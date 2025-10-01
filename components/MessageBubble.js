import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageBubble = ({ message, isOwn, user, showTime = false }) => {
  // Format time display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // Same day - show time
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 48) {
      // Yesterday
      return 'Yesterday';
    } else {
      // Show date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Get status icon for sent messages
  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color="#8E8E93" />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="#8E8E93" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="#8E8E93" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#4A90E2" />;
      default:
        return null;
    }
  };

  // Handle system messages (like "User joined chat")
  if (message.messageType === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessageText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.messageContainer, 
      isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        {/* Show sender name for received messages in group chats */}
        {!isOwn && message.sender?.name && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}
        
        {/* Message content */}
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
        
        {/* Time and status row */}
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timeText,
            isOwn ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {/* Status icon for sent messages */}
          {isOwn && (
            <View style={styles.statusIcon}>
              {getStatusIcon()}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  ownBubble: {
    backgroundColor: '#957DAD', // Match app's primary purple
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F8F9FA', // Match app's light background
    borderColor: '#E9ECEF',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#957DAD', // Match app's primary color
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#2c3e50', // Match app's text color
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    minHeight: 16,
  },
  timeText: {
    fontSize: 11,
    marginRight: 4,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#7f8c8d', // Match app's secondary text color
  },
  statusIcon: {
    marginLeft: 2,
  },
  
  // System message styles
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#7f8c8d',
    backgroundColor: 'rgba(149, 125, 173, 0.1)', // Light purple tint
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MessageBubble;
