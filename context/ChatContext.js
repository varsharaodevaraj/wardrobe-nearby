import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../config/apiConfig';
import api from '../utils/api';

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
  const [unreadCounts, setUnreadCounts] = useState({});
  const socketRef = useRef(null);
  const currentChatId = useRef(null);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const chats = await api('/chats');
      const counts = chats.reduce((acc, chat) => {
        const userUnread = chat.unreadCount.find(uc => uc.user === user.id);
        acc[chat._id] = userUnread ? userUnread.count : 0;
        return acc;
      }, {});
      setUnreadCounts(counts);
    } catch (error) {
      console.error('[CHAT_CONTEXT] Failed to fetch initial unread counts', error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      console.log('[CHAT_CONTEXT] Initializing WebSocket connection...');
      console.log('[CHAT_CONTEXT] Connecting to:', BASE_URL);

      const newSocket = io(BASE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
      fetchUnreadCounts();

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
      });

      newSocket.on('newMessage', (data) => {
        console.log('[CHAT_CONTEXT] 💬 New message received:', data);
        setNewMessages(prev => [...prev, data]);
        if (data.chatId !== currentChatId.current) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.chatId]: (prev[data.chatId] || 0) + 1,
          }));
        }
      });

      newSocket.on('userTyping', (data) => {
        const { chatId, userId, user: userData, isTyping } = data;
        setTypingUsers(prev => {
            const currentTypers = prev[chatId] || [];
            if (isTyping) {
                if (currentTypers.some(u => u._id === userId)) return prev;
                return {...prev, [chatId]: [...currentTypers, { _id: userId, name: userData.name }]};
            } else {
                return {...prev, [chatId]: currentTypers.filter(u => u._id !== userId)};
            }
        });
      });

      return () => {
        if (socketRef.current) {
          console.log('[CHAT_CONTEXT] Cleaning up WebSocket connection');
          socketRef.current.disconnect();
        }
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
        setUnreadCounts({});
      }
    }
  }, [user?.id, fetchUnreadCounts]);

  const joinChat = (chatId) => {
    if (socketRef.current && chatId) {
      socketRef.current.emit('joinChat', chatId);
      currentChatId.current = chatId;
      if (unreadCounts[chatId] > 0) {
        setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
        api(`/chats/${chatId}/mark-read`, 'PUT');
      }
    }
  };

  const leaveChat = (chatId) => {
    if (socketRef.current && chatId) {
      socketRef.current.emit('leaveChat', chatId);
      setTypingUsers(prev => ({ ...prev, [chatId]: [] }));
      if (currentChatId.current === chatId) {
        currentChatId.current = null;
      }
    }
  };

  const sendRealtimeMessage = (chatId, message) => {
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', { chatId, message });
    }
  };
  
  const deleteRealtimeMessage = (chatId, messageId) => {
    if (socketRef.current) {
      socketRef.current.emit('deleteMessage', { chatId, messageId });
    }
  };

  const startTyping = (chatId) => {
    if (socketRef.current && user) {
      socketRef.current.emit('startTyping', { chatId, user: { _id: user.id, name: user.name } });
    }
  };

  const stopTyping = (chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('stopTyping', { chatId });
    }
  };

  const clearNewMessages = (chatId) => {
    setNewMessages(prev => prev.filter(msg => msg.chatId !== chatId));
  };

  // *** THIS IS THE RESTORED FUNCTION ***
  const getTypingUsers = (chatId) => {
    return typingUsers[chatId] || [];
  };

  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const contextValue = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendRealtimeMessage,
    deleteRealtimeMessage,
    startTyping,
    stopTyping,
    newMessages,
    clearNewMessages,
    getTypingUsers, // *** IT IS NOW CORRECTLY INCLUDED HERE ***
    unreadCounts,
    totalUnreadCount,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};