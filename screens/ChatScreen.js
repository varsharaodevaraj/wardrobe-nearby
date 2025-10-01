import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  // SafeAreaView is removed from here
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- ✅ THIS IS THE NEW, CORRECT IMPORT
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import api from '../utils/api';

const ChatScreen = ({ route, navigation }) => {
  // Defensive programming: handle cases where route.params might be undefined
  const params = route?.params || {};
  const { 
    chatId = null, 
    participantId = null, 
    itemId = null, 
    participantName = null 
  } = params;
  const { user } = useAuth();
  const {
    isConnected,
    joinChat,
    leaveChat,
    sendRealtimeMessage,
    startTyping: startRealtimeTyping,
    stopTyping: stopRealtimeTyping,
    markMessagesAsRead,
    newMessages,
    clearNewMessages,
    getTypingUsers,
  } = useChatContext();

  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Debug info
  console.log('[CHAT] Screen initialized with params:', { chatId, participantId, itemId, participantName });
  console.log('[CHAT] Raw route.params:', route?.params);
  console.log('[CHAT] User info:', { userId: user?.id, userName: user?.name });

  // Safety check: if no essential parameters provided, show error and go back
  useEffect(() => {
    if (!chatId && !participantId) {
      console.error('[CHAT] No chatId or participantId provided');
      Alert.alert(
        'Chat Error',
        'Invalid chat parameters. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    loadChat();
  }, [chatId, participantId]);

  // Real-time WebSocket integration
  useEffect(() => {
    if (chat?._id) {
      console.log('[CHAT] Joining real-time chat room:', chat._id);
      // Join the chat room for real-time updates
      joinChat(chat._id);

      // Mark messages as read when entering chat
      markMessagesAsRead(chat._id);

      // Clear any existing new messages for this chat
      clearNewMessages(chat._id);

      // Cleanup when leaving chat
      return () => {
        console.log('[CHAT] Leaving real-time chat room:', chat._id);
        leaveChat(chat._id);
        stopRealtimeTyping(chat._id);
      };
    }
  }, [chat?._id]);

  // Handle real-time new messages
  useEffect(() => {
    const chatNewMessages = newMessages.filter(msg => msg.chatId === chat?._id);

    if (chatNewMessages.length > 0) {
      console.log('[CHAT] Processing real-time messages:', chatNewMessages);

      // Add new messages to chat
      const currentMessages = Array.isArray(chat?.messages) ? chat.messages : [];
      const updatedMessages = [...currentMessages];

      chatNewMessages.forEach(msgData => {
        // Safety check for message data
        if (msgData?.message && typeof msgData.message === 'object') {
          const exists = updatedMessages.find(m =>
            m._id === msgData.message._id || m.tempId === msgData.message.tempId
          );

          if (!exists) {
            updatedMessages.push(msgData.message);
          }
        }
      });

      setChat(prev => prev ? { ...prev, messages: updatedMessages } : null);

      // Clear processed messages
      clearNewMessages(chat._id);

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Mark as read
      markMessagesAsRead(chat._id);
    }
  }, [newMessages, chat?._id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when leaving screen
      if (chat?._id) {
        stopRealtimeTyping(chat._id);
      }
    };
  }, []);

  const loadChat = async () => {
    setLoading(true);
    try {
      console.log('[CHAT] Loading chat with params:', { chatId, participantId, itemId });
      let chatData;

      if (chatId) {
        // Load existing chat
        console.log('[CHAT] Loading existing chat:', chatId);
        chatData = await api(`/chats/${chatId}`);
      } else if (participantId) {
        // Create new chat or get existing one
        console.log('[CHAT] Creating chat with participant:', participantId);
        chatData = await api('/chats', 'POST', { participantId, itemId });
      } else {
        throw new Error('Missing chatId or participantId');
      }

      console.log('[CHAT] Loaded chat data:', chatData);
      setChat(chatData);

      // Mark messages as read
      if (chatData && chatData._id) {
        await api(`/chats/${chatData._id}/mark-read`, 'PUT');
      }
    } catch (error) {
      console.error('[CHAT] Error loading chat:', error);
      Alert.alert(
        'Chat Error',
        `Failed to load chat: ${error.message || 'Unknown error'}.\n\nPlease check your internet connection and try again.`,
        [
          { text: 'Retry', onPress: () => loadChat() },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Real-time typing management
  const startTyping = () => {
    if (chat?._id) {
      startRealtimeTyping(chat._id);
    }
  };

  const stopTyping = () => {
    if (chat?._id) {
      stopRealtimeTyping(chat._id);
    }
  };

  const handleTyping = (text) => {
    console.log('[CHAT] Typing input received:', text);
    setMessage(text);

    // Start typing indicator
    if (text.trim() && !typingTimeoutRef.current) {
      console.log('[CHAT] Starting typing indicator');
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      console.log('[CHAT] Stopping typing indicator');
      stopTyping();
      typingTimeoutRef.current = null;
    }, 2000); // Stop typing after 2 seconds of inactivity
  };

  const sendMessage = async () => {
    if (!message.trim() || !chat || sending) {
      console.log('[CHAT] Send message blocked:', {
        hasMessage: !!message.trim(),
        hasChat: !!chat,
        sending
      });
      return;
    }

    // Extra safety check for chat structure
    if (!chat._id || !Array.isArray(chat.messages)) {
      console.error('[CHAT] Invalid chat structure:', chat);
      Alert.alert('Error', 'Invalid chat data. Please try refreshing the chat.');
      return;
    }

    // Stop typing immediately when sending
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    setSending(true);
    const messageContent = message.trim();

    // Clear input immediately for better UX
    setMessage('');

    // Create optimistic message for instant feedback
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      content: messageContent,
      sender: { _id: user.id, name: user.name },
      timestamp: new Date().toISOString(),
      status: 'sending',
      tempId: `temp_${Date.now()}`,
    };

    // Add message optimistically to chat
    const currentMessages = Array.isArray(chat.messages) ? chat.messages : [];
    const optimisticChat = {
      ...chat,
      messages: [...currentMessages, tempMessage]
    };
    setChat(optimisticChat);

    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    console.log('[CHAT] Sending real-time message:', { chatId: chat._id, content: messageContent });

    try {
      // Send to backend API
      const response = await api(`/chats/${chat._id}/messages`, 'POST', {
        content: messageContent
      });

      console.log('[CHAT] Message sent successfully, response:', response);

      // Handle wrapped response structure
      const updatedChat = response.chat || response;
      
      // Extra validation for chat structure
      if (!updatedChat._id || !Array.isArray(updatedChat.messages)) {
        console.error('[CHAT] Invalid response structure:', response);
        throw new Error('Invalid chat response from server');
      }

      // Replace optimistic message with real message
      setChat(updatedChat);

      // Send real-time notification to other users
      if (Array.isArray(updatedChat.messages) && updatedChat.messages.length > 0) {
        const realMessage = updatedChat.messages[updatedChat.messages.length - 1];
        sendRealtimeMessage(chat._id, realMessage);
      }

      // Scroll to bottom again
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[CHAT] Error sending message:', error);

      // Remove failed message and restore input
      setChat(chat);
      setMessage(messageContent);

      Alert.alert('Error', `Failed to send message: ${error.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender._id === user.id;
    const messages = Array.isArray(chat.messages) ? chat.messages : [];
    const showDate = index === 0 ||
      (messages[index - 1] && 
       new Date(item.timestamp).toDateString() !==
       new Date(messages[index - 1].timestamp).toDateString());

    // Determine if this message has been seen by the other user
    const isLastMessage = index === messages.length - 1;
    const participants = Array.isArray(chat.participants) ? chat.participants : [];
    const otherParticipant = participants.find(p => p._id !== user.id);
    const hasBeenRead = otherParticipant?.lastReadMessageId === item._id ||
                       (chat.lastReadBy && chat.lastReadBy.includes(otherParticipant?._id));

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        )}
        <MessageBubble
          message={item}
          isMyMessage={isMyMessage}
          showStatus={isMyMessage && isLastMessage}
          hasBeenRead={hasBeenRead}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#957DAD" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="chatbubble-outline" size={64} color="#E9ECEF" />
          <Text style={styles.errorText}>Chat not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Safety check: if no essential parameters and not loading, show error
  if (!chatId && !participantId && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={styles.errorText}>Invalid Chat Parameters</Text>
          <Text style={[styles.errorText, { fontSize: 14, marginTop: 10 }]}>
            Please navigate to this chat from an item or chat list.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const participantsArray = Array.isArray(chat.participants) ? chat.participants : [];
  const otherParticipant = participantsArray.find(p => p._id !== user.id);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {otherParticipant?.name || participantName || 'User'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {chat.relatedItem && (
                <Text style={styles.headerSubtext}>About: {chat.relatedItem.name}</Text>
              )}
              {!isConnected && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                  <View style={styles.offlineIndicator} />
                  <Text style={[styles.headerSubtext, { fontSize: 12, marginLeft: 4 }]}>
                    Connecting...
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={{ padding: 4 }}>
            <Ionicons name="information-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={chat.messages || []}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `message_${index}_${item.timestamp || Date.now()}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#E9ECEF" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          )}
          ListFooterComponent={() => {
            if (!chat?._id || !user?.id) return null;
            
            const typingUsers = getTypingUsers(chat._id) || [];
            const filteredTypingUsers = Array.isArray(typingUsers) 
              ? typingUsers.filter(u => u && u._id && u._id !== user.id) 
              : [];
            
            return <TypingIndicator typingUsers={filteredTypingUsers} />;
          }}
        />



        {/* Message Input */}
        <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor="#BDC3C7"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (message.trim() && !sending) {
                sendMessage();
              }
            }}
            onBlur={() => {
              // Stop typing when input loses focus
              stopTyping();
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
              }
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!message.trim() || sending}
            activeOpacity={0.8}
            onPressIn={() => {
              // Add subtle press animation if needed
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color="white"
                style={{ marginLeft: 2 }} // Slight offset for visual balance
              />
            )}
          </TouchableOpacity>
        </View>
        {message.length > 400 && (
          <Text style={styles.characterCount}>
            {message.length}/500
          </Text>
        )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Match app's light background
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
    paddingBottom: 12,
    backgroundColor: '#957DAD', // Match app's primary purple
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  offlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  messagesList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#7f8c8d',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    fontWeight: '500',
    overflow: 'hidden',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    marginBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: 12,
    minHeight: 42,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#2c3e50',
    textAlignVertical: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sendButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#957DAD', // Match app's primary purple
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    transform: [{ scale: 1 }],
  },
  characterCount: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
    marginTop: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#CED4DA',
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontSize: 16,
    color: '#e74c3c',
  },
  retryButton: {
    backgroundColor: '#957DAD',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ADB5BD',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default ChatScreen;