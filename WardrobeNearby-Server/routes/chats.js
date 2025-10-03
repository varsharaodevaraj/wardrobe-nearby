const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Item = require('../models/Item');

// @route   GET /api/chats
// @desc    Get all chats for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
    .populate('participants', 'name profileImage')
    .populate('relatedItem', 'name imageUrl')
    .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/chats/:chatId
// @desc    Get a specific chat with messages
// @access  Private
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'name profileImage')
      .populate('relatedItem', 'name imageUrl')
      .populate('messages.sender', 'name');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chats
// @desc    Create a new chat or get existing one
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { participantId, itemId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Check if chat already exists between these users
    const existingChat = await Chat.findOne({
      participants: { $all: [req.user.id, participantId] }
    }).populate('participants', 'name profileImage')
      .populate('relatedItem', 'name imageUrl');

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const newChat = new Chat({
      participants: [req.user.id, participantId],
      relatedItem: itemId || null,
      messages: [],
    });

    await newChat.save();

    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants', 'name profileImage')
      .populate('relatedItem', 'name imageUrl');

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chats/:chatId/messages
// @desc    Send a message in a chat (WhatsApp-like with status tracking)
// @access  Private
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { content, tempId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this chat' });
    }

    // Create enhanced message with WhatsApp-like features
    const newMessage = {
      sender: req.user.id,
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent', // Message successfully sent to server
      tempId: tempId, // For client-side optimistic updates
      messageType: 'text',
    };

    chat.messages.push(newMessage);
    chat.lastMessage = new Date();

    // Update unread count for other participants
    const otherParticipants = chat.participants.filter(p => p.toString() !== req.user.id);
    otherParticipants.forEach(participantId => {
      let unreadEntry = chat.unreadCount.find(u => u.user.toString() === participantId.toString());
      if (unreadEntry) {
        unreadEntry.count += 1;
      } else {
        chat.unreadCount.push({ user: participantId, count: 1 });
      }
    });

    // Clear typing indicator for sender
    chat.typingUsers = chat.typingUsers.filter(tu => tu.user.toString() !== req.user.id);

    await chat.save();

    // Return the populated chat with the new message
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name profileImage')
      .populate('relatedItem', 'name imageUrl')
      .populate('messages.sender', 'name');

    const sentMessage = populatedChat.messages[populatedChat.messages.length - 1];
    
    // --- NEW: Emit message to other users in the chat room ---
    const io = req.app.get('io');
    const recipientSocketId = Array.from(io.sockets.sockets.values()).find(socket => socket.userId === otherParticipants[0].toString())?.id;
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('newMessage', {
        chatId: chat._id,
        message: sentMessage,
      });
    }

    res.json({
      success: true,
      message: sentMessage,
      chat: populatedChat
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: error.message 
    });
  }
});

// --- NEW: DELETE a message from a chat ---
// @route   DELETE /api/chats/:chatId/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:chatId/messages/:messageId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Find the message to delete
    const message = chat.messages.id(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Ensure the user owns the message
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this message' });
    }

    // Remove the message using the pull method
    chat.messages.pull({ _id: req.params.messageId });

    // If the deleted message was the last one, update the lastMessage timestamp
    if (chat.messages.length > 0) {
      chat.lastMessage = chat.messages[chat.messages.length - 1].timestamp;
    } else {
      chat.lastMessage = chat.createdAt;
    }
    
    await chat.save();

    // --- NEW: Emit message deletion to other users in the chat room ---
    const io = req.app.get('io');
    const otherParticipants = chat.participants.filter(p => p.toString() !== req.user.id);
    const recipientSocketId = Array.from(io.sockets.sockets.values()).find(socket => socket.userId === otherParticipants[0].toString())?.id;
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('messageDeleted', {
        chatId: req.params.chatId,
        messageId: req.params.messageId,
      });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/chats/:chatId/mark-read
// @desc    Mark messages as read (WhatsApp-like read receipts)
// @access  Private
router.put('/:chatId/mark-read', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const now = new Date();
    let markedCount = 0;

    // Mark messages as read (only messages not sent by current user)
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user.id && !message.isRead) {
        message.isRead = true;
        message.readAt = now;
        message.status = 'read';
        markedCount++;
      }
    });

    // Reset unread count for current user
    const userUnreadEntry = chat.unreadCount.find(u => u.user.toString() === req.user.id);
    if (userUnreadEntry) {
      userUnreadEntry.count = 0;
    }

    await chat.save();

    res.json({ 
      success: true,
      message: `${markedCount} messages marked as read`,
      markedCount 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chats/:chatId/typing
// @desc    Set typing indicator
// @access  Private
router.post('/:chatId/typing', auth, async (req, res) => {
  try {
    const { isTyping } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (isTyping) {
      // Add or update typing indicator
      const existingTyping = chat.typingUsers.find(tu => tu.user.toString() === req.user.id);
      if (existingTyping) {
        existingTyping.lastTyping = new Date();
      } else {
        chat.typingUsers.push({
          user: req.user.id,
          lastTyping: new Date()
        });
      }
    } else {
      // Remove typing indicator
      chat.typingUsers = chat.typingUsers.filter(tu => tu.user.toString() !== req.user.id);
    }

    await chat.save();

    // Get current typing users (excluding current user)
    const typingUsers = chat.typingUsers
      .filter(tu => tu.user.toString() !== req.user.id)
      .filter(tu => (new Date() - tu.lastTyping) < 10000); // 10 second timeout

    res.json({ 
      success: true,
      typingUsers: typingUsers.map(tu => tu.user)
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/chats/:chatId/typing
// @desc    Get current typing users
// @access  Private
router.get('/:chatId/typing', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('typingUsers.user', 'name');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Filter out expired typing indicators (older than 10 seconds)
    const activeTypingUsers = chat.typingUsers
      .filter(tu => tu.user._id.toString() !== req.user.id)
      .filter(tu => (new Date() - tu.lastTyping) < 10000);

    res.json({
      success: true,
      typingUsers: activeTypingUsers.map(tu => tu.user)
    });
  } catch (error) {
    console.error('Error getting typing status:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;