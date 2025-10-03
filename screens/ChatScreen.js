import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import MessageNotification from '../components/MessageNotification';
import api from '../utils/api';

const ChatScreen = ({ route, navigation }) => {
  const params = route?.params || {};
  const { 
    chatId = null, 
    participantId = null, 
    itemId = null, 
    participantName = null 
  } = params;
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendRealtimeMessage,
    deleteRealtimeMessage,
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
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const inputBorderAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (chat?._id) {
      joinChat(chat._id);
      markMessagesAsRead(chat._id);
      clearNewMessages(chat._id);

      return () => {
        leaveChat(chat._id);
        stopRealtimeTyping(chat._id);
      };
    }
  }, [chat?._id]);

  useEffect(() => {
    const chatNewMessages = newMessages.filter(msg => msg.chatId === chat?._id);

    if (chatNewMessages.length > 0) {
      const currentMessages = Array.isArray(chat?.messages) ? chat.messages : [];
      const updatedMessages = [...currentMessages];

      chatNewMessages.forEach(msgData => {
        if (msgData?.message && typeof msgData.message === 'object') {
          const exists = updatedMessages.find(m =>
            m._id === msgData.message._id || m.tempId === msgData.message.tempId
          );

          if (!exists) {
            updatedMessages.push(msgData.message);
            
            if (msgData.message.sender._id !== user.id) {
              setNotificationData({
                senderName: msgData.message.sender.name,
                messageContent: msgData.message.content,
                chatId: chat._id,
              });
              setShowNotification(true);
            }
          }
        }
      });

      setChat(prev => prev ? { ...prev, messages: updatedMessages } : null);
      clearNewMessages(chat._id);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      markMessagesAsRead(chat._id);
    }
  }, [newMessages, chat?._id]);

  useEffect(() => {
    if (chat?._id && socket) {
      const handleDelete = ({ chatId: deletedInChatId, messageId }) => {
        if (deletedInChatId === chat._id) {
          setChat(prev => ({
            ...prev,
            messages: prev.messages.filter(msg => msg._id !== messageId),
          }));
        }
      };
      socket.on('messageDeleted', handleDelete);

      return () => {
        socket.off('messageDeleted', handleDelete);
      };
    }
  }, [chat?._id, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (chat?._id) {
        stopRealtimeTyping(chat._id);
      }
    };
  }, []);

  const loadChat = async () => {
    setLoading(true);
    try {
      let chatData;
      if (chatId) {
        chatData = await api(`/chats/${chatId}`);
      } else if (participantId) {
        chatData = await api('/chats', 'POST', { participantId, itemId });
      } else {
        throw new Error('Missing chatId or participantId');
      }
      setChat(chatData);
      if (chatData && chatData._id) {
        await api(`/chats/${chatData._id}/mark-read`, 'PUT');
      }
    } catch (error) {
      console.error('[CHAT] Error loading chat:', error);
      Alert.alert(
        'Chat Error',
        `Failed to load chat: ${error.message || 'Unknown error'}.\n\nPlease check your internet connection and try again.`,
        [{ text: 'Retry', onPress: loadChat }, { text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const startTyping = () => {
    if (chat?._id) startRealtimeTyping(chat._id);
  };

  const stopTyping = () => {
    if (chat?._id) stopRealtimeTyping(chat._id);
  };

  const handleTyping = (text) => {
    setMessage(text);
    if (text.trim() && !typingTimeoutRef.current) {
      startTyping();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const sendMessage = async () => {
    if (!message.trim() || !chat || sending) return;
    if (!chat._id || !Array.isArray(chat.messages)) {
      Alert.alert('Error', 'Invalid chat data. Please try refreshing the chat.');
      return;
    }
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setSending(true);
    const messageContent = message.trim();
    setMessage('');
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      content: messageContent,
      sender: { _id: user.id, name: user.name },
      timestamp: new Date().toISOString(),
      status: 'sending',
      tempId: `temp_${Date.now()}`,
    };
    const currentMessages = Array.isArray(chat.messages) ? chat.messages : [];
    setChat({ ...chat, messages: [...currentMessages, tempMessage] });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const response = await api(`/chats/${chat._id}/messages`, 'POST', { content: messageContent });
      const updatedChat = response.chat || response;
      if (!updatedChat._id || !Array.isArray(updatedChat.messages)) {
        throw new Error('Invalid chat response from server');
      }
      setChat(updatedChat);
      if (Array.isArray(updatedChat.messages) && updatedChat.messages.length > 0) {
        const realMessage = updatedChat.messages[updatedChat.messages.length - 1];
        sendRealtimeMessage(chat._id, realMessage);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('[CHAT] Error sending message:', error);
      setChat(chat);
      setMessage(messageContent);
      Alert.alert('Error', `Failed to send message: ${error.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = useCallback(async (messageId) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setChat(prev => ({
                ...prev,
                messages: prev.messages.filter(msg => msg._id !== messageId),
              }));
              await api(`/chats/${chat._id}/messages/${messageId}`, 'DELETE');
              deleteRealtimeMessage(chat._id, messageId);
            } catch (error) {
              console.error('[CHAT] Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message. Please try again.');
              loadChat();
            }
          },
        },
      ]
    );
  }, [chat, deleteRealtimeMessage, loadChat]);

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender._id === user.id;
    const messages = Array.isArray(chat.messages) ? chat.messages : [];
    const showDate = index === 0 || (messages[index - 1] && new Date(item.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString());
    const isLastMessage = index === messages.length - 1;
    const participants = Array.isArray(chat.participants) ? chat.participants : [];
    const otherParticipant = participants.find(p => p._id !== user.id);
    const hasBeenRead = item.status === 'read' || item.isRead || otherParticipant?.lastReadMessageId === item._id || (chat.lastReadBy && chat.lastReadBy.includes(otherParticipant?._id));
    const messageWithStatus = { ...item, status: hasBeenRead ? 'read' : (item.status || 'sent') };

    return (
      <TouchableOpacity onLongPress={() => isMyMessage && handleDeleteMessage(item._id)}>
        <View>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>
                {new Date(item.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          )}
          <MessageBubble
            message={messageWithStatus}
            isMyMessage={isMyMessage}
            showStatus={isMyMessage && isLastMessage}
            hasBeenRead={hasBeenRead}
          />
        </View>
      </TouchableOpacity>
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
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!chatId && !participantId && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={styles.errorText}>Invalid Chat Parameters</Text>
          <Text style={[styles.errorText, { fontSize: 14, marginTop: 10 }]}>
            Please navigate to this chat from an item or chat list.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
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
      <MessageNotification
        isVisible={showNotification}
        senderName={notificationData?.senderName}
        messageContent={notificationData?.messageContent}
        onPress={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)}
        onDismiss={() => {
          setShowNotification(false);
          setNotificationData(null);
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
            const filteredTypingUsers = Array.isArray(typingUsers) ? typingUsers.filter(u => u && u._id && u._id !== user.id) : [];
            return <TypingIndicator typingUsers={filteredTypingUsers} />;
          }}
        />

        <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <Animated.View style={[
            styles.textInputContainer,
            {
              borderColor: inputBorderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#E9ECEF', '#957DAD']
              })
            }
          ]}>
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
              onFocus={() => {
                setInputFocused(true);
                Animated.timing(inputBorderAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                }).start();
              }}
              onBlur={() => {
                setInputFocused(false);
                Animated.timing(inputBorderAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: false,
                }).start();
                stopTyping();
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
              }}
            />
          </Animated.View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled,
              { transform: [{ scale: sendButtonScale }] }
            ]}
            onPress={() => {
              Animated.sequence([
                Animated.timing(sendButtonScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
                Animated.timing(sendButtonScale, { toValue: 1, duration: 100, useNativeDriver: true })
              ]).start();
              sendMessage();
            }}
            disabled={!message.trim() || sending}
            activeOpacity={0.8}
            onPressIn={() => Animated.timing(sendButtonScale, { toValue: 0.95, duration: 50, useNativeDriver: true }).start()}
            onPressOut={() => Animated.timing(sendButtonScale, { toValue: 1, duration: 50, useNativeDriver: true }).start()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" style={{ marginLeft: 2 }} />
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
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#957DAD',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
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
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    marginBottom: 0,
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
  textInputContainer: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
  },
  textInput: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: 12,
    minHeight: 42,
    maxHeight: 120,
    fontSize: 16,
    color: '#2c3e50',
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#957DAD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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