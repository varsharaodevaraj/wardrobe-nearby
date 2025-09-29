const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

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
// @desc    Send a message in a chat
// @access  Private
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;

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

    // Add message to chat
    const newMessage = {
      sender: req.user.id,
      content: content.trim(),
      timestamp: new Date(),
    };

    chat.messages.push(newMessage);
    chat.lastMessage = new Date();

    await chat.save();

    // Return the populated chat
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name profileImage')
      .populate('relatedItem', 'name imageUrl')
      .populate('messages.sender', 'name');

    res.json(populatedChat);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/chats/:chatId/mark-read
// @desc    Mark messages as read
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

    // Mark messages as read (only messages not sent by current user)
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user.id) {
        message.isRead = true;
      }
    });

    await chat.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
