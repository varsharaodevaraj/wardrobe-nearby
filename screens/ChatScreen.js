import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ChatScreen = ({ route, navigation }) => {
  // Defensive programming: handle cases where route.params might be undefined
  const params = route?.params || {};
  const { chatId, participantId, itemId, participantName } = params;
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Debug info
  console.log('[CHAT] Screen initialized with params:', { chatId, participantId, itemId, participantName });

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

  const sendMessage = async () => {
    if (!message.trim() || !chat || sending) {
      console.log('[CHAT] Send message blocked:', { 
        hasMessage: !!message.trim(), 
        hasChat: !!chat, 
        sending 
      });
      return;
    }

    setSending(true);
    console.log('[CHAT] Sending message:', { chatId: chat._id, content: message.trim() });
    
    try {
      const updatedChat = await api(`/chats/${chat._id}/messages`, 'POST', {
        content: message.trim()
      });
      
      console.log('[CHAT] Message sent successfully, updated chat:', updatedChat);
      
      setChat(updatedChat);
      setMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[CHAT] Error sending message:', error);
      Alert.alert('Error', `Failed to send message: ${error.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender._id === user.id;
    const showDate = index === 0 || 
      new Date(item.timestamp).toDateString() !== 
      new Date(chat.messages[index - 1].timestamp).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toDateString()}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            isMyMessage ? styles.myTimestamp : styles.theirTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
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

  const otherParticipant = chat.participants.find(p => p._id !== user.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {otherParticipant?.name || participantName || 'User'}
          </Text>
          {chat.relatedItem && (
            <Text style={styles.headerSubtext}>About: {chat.relatedItem.name}</Text>
          )}
        </View>
        <TouchableOpacity>
          <Ionicons name="information-circle-outline" size={24} color="#2c3e50" />
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
      />

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
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
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#957DAD" />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={(!message.trim()) ? "#CED4DA" : "#957DAD"} 
              />
            )}
          </TouchableOpacity>
        </View>
        {message.length > 400 && (
          <Text style={styles.characterCount}>
            {message.length}/500
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#7f8c8d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 18,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#957DAD',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#2c3e50',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  theirTimestamp: {
    color: '#7f8c8d',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  characterCount: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
    marginTop: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 15,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 5,
  },
});

export default ChatScreen;
