import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/apiConfig';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [newMessages, setNewMessages] = useState([]);
  const socketRef = useRef(null);
  const currentChatId = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      console.log('[CHAT_CONTEXT] Initializing WebSocket connection...');
      console.log('[CHAT_CONTEXT] Connecting to:', API_URL.replace('/api', ''));
      
      // Use base URL without /api for Socket.IO
      const socketUrl = API_URL.replace('/api', '');
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('[CHAT_CONTEXT] ✅ Connected to WebSocket server');
        setIsConnected(true);
        
        // Authenticate user
        newSocket.emit('authenticate', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('[CHAT_CONTEXT] ❌ Disconnected from WebSocket server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('[CHAT_CONTEXT] Connection error:', error);
        console.error('[CHAT_CONTEXT] Error details:', error.message);
        console.error('[CHAT_CONTEXT] Socket URL used:', socketUrl);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`[CHAT_CONTEXT] Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('[CHAT_CONTEXT] Reconnection error:', error);
      });

      // Real-time message events
      newSocket.on('newMessage', (data) => {
        console.log('[CHAT_CONTEXT] 💬 New message received:', data);
        setNewMessages(prev => [...prev, data]);
      });

      // Typing indicator events
      newSocket.on('userTyping', (data) => {
        console.log('[CHAT_CONTEXT] ⌨️ Typing status update:', data);
        const { chatId, userId, user: userData, isTyping } = data;
        
        setTypingUsers(prev => ({
          ...prev,
          [chatId]: isTyping 
            ? [...(prev[chatId] || []).filter(u => u._id !== userId), { _id: userId, ...userData }]
            : (prev[chatId] || []).filter(u => u._id !== userId)
        }));
      });

      // Read receipt events
      newSocket.on('messagesMarkedRead', (data) => {
        console.log('[CHAT_CONTEXT] 👁️ Messages marked as read:', data);
        // Handle read receipts here if needed
      });

      // Cleanup on unmount
      return () => {
        console.log('[CHAT_CONTEXT] Cleaning up WebSocket connection');
        newSocket.disconnect();
      };
    }
  }, [user?.id]);

  // Chat room management
  const joinChat = (chatId) => {
    if (socketRef.current && chatId) {
      console.log(`[CHAT_CONTEXT] 👥 Joining chat room: ${chatId}`);
      socketRef.current.emit('joinChat', chatId);
      currentChatId.current = chatId;
    }
  };

  const leaveChat = (chatId) => {
    if (socketRef.current && chatId) {
      console.log(`[CHAT_CONTEXT] 👋 Leaving chat room: ${chatId}`);
      socketRef.current.emit('leaveChat', chatId);
      
      // Clear typing indicators for this chat
      setTypingUsers(prev => ({
        ...prev,
        [chatId]: []
      }));
      
      if (currentChatId.current === chatId) {
        currentChatId.current = null;
      }
    }
  };

  // Real-time message sending
  const sendRealtimeMessage = (chatId, message) => {
    if (socketRef.current && chatId && message) {
      console.log(`[CHAT_CONTEXT] 📤 Sending real-time message to chat ${chatId}`);
      socketRef.current.emit('sendMessage', {
        chatId,
        message
      });
    }
  };

  // Typing indicators
  const startTyping = (chatId) => {
    if (socketRef.current && chatId && user) {
      socketRef.current.emit('startTyping', {
        chatId,
        user: {
          _id: user.id,
          name: user.name
        }
      });
    }
  };

  const stopTyping = (chatId) => {
    if (socketRef.current && chatId) {
      socketRef.current.emit('stopTyping', { chatId });
    }
  };

  // Mark messages as read
  const markMessagesAsRead = (chatId) => {
    if (socketRef.current && chatId && user) {
      socketRef.current.emit('markMessagesRead', {
        chatId,
        userId: user.id
      });
    }
  };

  // Clear new messages for a specific chat
  const clearNewMessages = (chatId) => {
    setNewMessages(prev => prev.filter(msg => msg.chatId !== chatId));
  };

  // Get typing users for a specific chat
  const getTypingUsers = (chatId) => {
    return typingUsers[chatId] || [];
  };

  const contextValue = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendRealtimeMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    newMessages,
    clearNewMessages,
    getTypingUsers,
    currentChatId: currentChatId.current,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};
