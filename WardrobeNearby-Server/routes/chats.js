const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Item = require('../models/Item');

// @route   GET /api/chats
// @desc    Get all chats for the current user
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

    // Find a chat that involves both users. The item is secondary.
    const existingChat = await Chat.findOne({
      participants: { $all: [req.user.id, participantId] }
    }).populate('participants', 'name profileImage')
      .populate('relatedItem', 'name imageUrl');

    if (existingChat) {
      return res.json(existingChat);
    }

    // If no chat exists, create a new one.
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
    console.error('Error creating or finding chat:', error);
    res.status(500).send('Server Error');
  }
});


// @route   POST /api/chats/:chatId/messages
// @desc    Send a message in a chat
// @access  Private
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { content, tempId } = req.body;
    if (!content || content.trim().length === 0) return res.status(400).json({ message: 'Message content is required' });

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.includes(req.user.id)) return res.status(403).json({ message: 'Not authorized' });
    if (!chat.isActive) return res.status(403).json({ message: 'Chat is not active. Owner must accept the request first.' });

    const newMessage = { sender: req.user.id, content: content.trim(), timestamp: new Date(), status: 'sent', tempId: tempId, messageType: 'text' };
    chat.messages.push(newMessage);
    chat.lastMessage = new Date();

    const otherParticipants = chat.participants.filter(p => p.toString() !== req.user.id);
    otherParticipants.forEach(participantId => {
      let unreadEntry = chat.unreadCount.find(u => u.user.toString() === participantId.toString());
      if (unreadEntry) unreadEntry.count += 1;
      else chat.unreadCount.push({ user: participantId, count: 1 });
    });

    chat.typingUsers = chat.typingUsers.filter(tu => tu.user.toString() !== req.user.id);
    await chat.save();

    const populatedChat = await Chat.findById(chat._id).populate('participants', 'name profileImage').populate('relatedItem', 'name imageUrl').populate('messages.sender', 'name');
    const sentMessage = populatedChat.messages[populatedChat.messages.length - 1];
    
    const io = req.app.get('io');
    const recipientSocketId = Array.from(io.sockets.sockets.values()).find(socket => socket.userId === otherParticipants[0].toString())?.id;
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('newMessage', { chatId: chat._id, message: sentMessage });
    }

    res.json({ success: true, message: sentMessage, chat: populatedChat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


// @route   DELETE /api/chats/:chatId/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:chatId/messages/:messageId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const message = chat.messages.id(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });
    
    chat.messages.pull({ _id: req.params.messageId });
    chat.lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].timestamp : chat.createdAt;
    await chat.save();

    const io = req.app.get('io');
    const otherParticipants = chat.participants.filter(p => p.toString() !== req.user.id);
    const recipientSocketId = Array.from(io.sockets.sockets.values()).find(socket => socket.userId === otherParticipants[0].toString())?.id;
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('messageDeleted', { chatId: req.params.chatId, messageId: req.params.messageId });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/chats/:chatId/messages
// @desc    Clear all messages in a chat
router.delete('/:chatId/messages', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!chat.participants.includes(req.user.id)) return res.status(401).json({ message: 'User not authorized' });
        
        chat.messages = [];
        chat.lastMessage = chat.createdAt;
        await chat.save();

        const io = req.app.get('io');
        const otherParticipants = chat.participants.filter(p => p.toString() !== req.user.id);
        const recipientSocketId = Array.from(io.sockets.sockets.values()).find(socket => socket.userId === otherParticipants[0].toString())?.id;
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('chatCleared', { chatId: req.params.chatId });
        }

        res.json({ message: 'Chat cleared successfully' });
    } catch (error) {
        console.error('Error clearing chat:', error);
        res.status(500).send('Server Error');
    }
});


// (rest of the file remains the same: mark-read, typing routes)
router.put('/:chatId/mark-read', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.includes(req.user.id)) return res.status(403).json({ message: 'Not authorized' });

    const now = new Date();
    let markedCount = 0;
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user.id && !message.isRead) {
        message.isRead = true;
        message.readAt = now;
        message.status = 'read';
        markedCount++;
      }
    });

    const userUnreadEntry = chat.unreadCount.find(u => u.user.toString() === req.user.id);
    if (userUnreadEntry) userUnreadEntry.count = 0;

    await chat.save();
    res.json({ success: true, message: `${markedCount} messages marked as read`, markedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).send('Server Error');
  }
});

router.post('/:chatId/typing', auth, async (req, res) => {
  try {
    const { isTyping } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.includes(req.user.id)) return res.status(403).json({ message: 'Not authorized' });

    if (isTyping) {
      const existingTyping = chat.typingUsers.find(tu => tu.user.toString() === req.user.id);
      if (existingTyping) existingTyping.lastTyping = new Date();
      else chat.typingUsers.push({ user: req.user.id, lastTyping: new Date() });
    } else {
      chat.typingUsers = chat.typingUsers.filter(tu => tu.user.toString() !== req.user.id);
    }
    await chat.save();
    const typingUsers = chat.typingUsers.filter(tu => tu.user.toString() !== req.user.id && (new Date() - tu.lastTyping) < 10000);
    res.json({ success: true, typingUsers: typingUsers.map(tu => tu.user) });
  } catch (error) {
    console.error('Error updating typing status:', error);
    res.status(500).send('Server Error');
  }
});

router.get('/:chatId/typing', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('typingUsers.user', 'name');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const activeTypingUsers = chat.typingUsers.filter(tu => tu.user._id.toString() !== req.user.id && (new Date() - tu.lastTyping) < 10000);
    res.json({ success: true, typingUsers: activeTypingUsers.map(tu => tu.user) });
  } catch (error) {
    console.error('Error getting typing status:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;