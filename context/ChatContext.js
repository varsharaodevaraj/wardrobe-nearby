import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
// UPDATE: Import the simple BASE_URL from the correct config file
import { BASE_URL } from '../config/apiConfig';

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

  useEffect(() => {
    if (user?.id) {
      console.log('[CHAT_CONTEXT] Initializing WebSocket connection...');
      
      // SIMPLIFIED: No need for async logic, just use the imported BASE_URL
      console.log('[CHAT_CONTEXT] Connecting to:', BASE_URL);
      
      const newSocket = io(BASE_URL, {
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
        newSocket.emit('authenticate', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('[CHAT_CONTEXT] ❌ Disconnected from WebSocket server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('[CHAT_CONTEXT] Connection error:', error.message);
        console.error('[CHAT_CONTEXT] Socket URL used:', BASE_URL);
        setIsConnected(false);
      });

      // Real-time message events
      newSocket.on('newMessage', (data) => {
        console.log('[CHAT_CONTEXT] 💬 New message received:', data);
        setNewMessages(prev => [...prev, data]);
      });

      // Typing indicator events
      newSocket.on('userTyping', (data) => {
        const { chatId, userId, user: userData, isTyping } = data;
        setTypingUsers(prev => ({
          ...prev,
          [chatId]: isTyping
            ? [...(prev[chatId] || []).filter(u => u._id !== userId), { _id: userId, ...userData }]
            : (prev[chatId] || []).filter(u => u._id !== userId)
        }));
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          console.log('[CHAT_CONTEXT] Cleaning up WebSocket connection');
          socketRef.current.disconnect();
        }
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
      setTypingUsers(prev => ({ ...prev, [chatId]: [] }));
      if (currentChatId.current === chatId) {
        currentChatId.current = null;
      }
    }
  };

  // Real-time message sending
  const sendRealtimeMessage = (chatId, message) => {
    if (socketRef.current && chatId && message) {
      socketRef.current.emit('sendMessage', { chatId, message });
    }
  };
  
  const deleteRealtimeMessage = (chatId, messageId) => {
    if (socketRef.current && chatId && messageId) {
      socketRef.current.emit('deleteMessage', { chatId, messageId });
    }
  };

  // Typing indicators
  const startTyping = (chatId) => {
    if (socketRef.current && chatId && user) {
      socketRef.current.emit('startTyping', { chatId, user: { _id: user.id, name: user.name } });
    }
  };

  const stopTyping = (chatId) => {
    if (socketRef.current && chatId) {
      socketRef.current.emit('stopTyping', { chatId });
    }
  };

  const markMessagesAsRead = (chatId) => {
    if (socketRef.current && chatId && user) {
      socketRef.current.emit('markMessagesRead', { chatId, userId: user.id });
    }
  };

  const clearNewMessages = (chatId) => {
    setNewMessages(prev => prev.filter(msg => msg.chatId !== chatId));
  };

  const getTypingUsers = (chatId) => {
    return typingUsers[chatId] || [];
  };

  const contextValue = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendRealtimeMessage,
    deleteRealtimeMessage,
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