import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);

  const addUnreadMessage = (message) => {
    setUnreadMessages(prev => prev + 1);
    setLastMessage(message);
  };

  const clearUnreadMessages = () => {
    setUnreadMessages(0);
    setLastMessage(null);
  };

  const markMessageAsRead = () => {
    if (unreadMessages > 0) {
      setUnreadMessages(prev => prev - 1);
    }
  };

  return (
    <NotificationContext.Provider value={{
      unreadMessages,
      lastMessage,
      addUnreadMessage,
      clearUnreadMessages,
      markMessageAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;