const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// imports
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const rentalRoutes = require('./routes/rentals');
// const storyRoutes = require('./routes/stories'); // REMOVED
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const reviewRoutes = require('./routes/reviews');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rentals', rentalRoutes);
// app.use('/api/stories', storyRoutes); // REMOVED
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// Get local network IP address dynamically
const os = require('os');
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();

// Real-time Socket.IO implementation
const activeUsers = new Map(); // Store active users and their socket IDs
const typingUsers = new Map(); // Store typing status per chat

io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);
  
  socket.on('authenticate', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`✅ User ${userId} authenticated with socket ${socket.id}`);
  });

  socket.on('joinChat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`👥 User ${socket.userId} joined chat ${chatId}`);
  });

  socket.on('leaveChat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`👋 User ${socket.userId} left chat ${chatId}`);
  });

  socket.on('sendMessage', (data) => {
    const { chatId, message } = data;
    console.log(`💬 Broadcasting message to chat ${chatId}`);
    socket.to(`chat_${chatId}`).emit('newMessage', { chatId, message });
  });

  socket.on('startTyping', (data) => {
    const { chatId, user } = data;
    socket.to(`chat_${chatId}`).emit('userTyping', { chatId, userId: socket.userId, user, isTyping: true });
    console.log(`⌨️ User ${socket.userId} started typing in chat ${chatId}`);
  });

  socket.on('stopTyping', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('userTyping', { chatId, userId: socket.userId, isTyping: false });
    console.log(`⏹️ User ${socket.userId} stopped typing in chat ${chatId}`);
  });

  socket.on('deleteMessage', (data) => {
    const { chatId, messageId } = data;
    console.log(`🗑️ Broadcasting message deletion to chat ${chatId}`);
    socket.to(`chat_${chatId}`).emit('messageDeleted', { chatId, messageId });
  });

  socket.on('markMessagesRead', (data) => {
    const { chatId, userId } = data;
    socket.to(`chat_${chatId}`).emit('messagesMarkedRead', { chatId, userId, readAt: new Date() });
    console.log(`👁️ User ${userId} marked messages as read in chat ${chatId}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      console.log(`🔌 User ${socket.userId} disconnected`);
    }
  });
});

app.set('io', io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running successfully!`);
  console.log(`📱 Mobile access: http://${localIP}:${PORT}`);
  console.log(`💻 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
  console.log(`⚡ WebSocket server ready for real-time chat!`);
});