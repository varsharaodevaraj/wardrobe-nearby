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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import api from '../utils/api';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, participantId, itemId, participantName } = route.params || {};
  const { user } = useAuth();
  const { socket, joinChat, leaveChat, sendRealtimeMessage, deleteRealtimeMessage, startTyping, stopTyping, newMessages, clearNewMessages, getTypingUsers } = useChatContext();

  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const loadChat = useCallback(async () => {
    setLoading(true);
    try {
      let chatData;
      if (chatId) {
        chatData = await api(`/chats/${chatId}`);
      } else if (participantId) {
        chatData = await api('/chats', 'POST', { participantId, itemId });
      } else {
        throw new Error('Missing chat parameters');
      }
      setChat(chatData);
      if (chatData?._id && chatData.isActive) {
        await api(`/chats/${chatData._id}/mark-read`, 'PUT');
      }
    } catch (error) {
      Alert.alert('Chat Error', `Failed to load chat: ${error.message || 'Unknown error'}.`);
    } finally {
      setLoading(false);
    }
  }, [chatId, participantId, itemId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (chat?._id) {
      joinChat(chat._id);
      clearNewMessages(chat._id);

      const handleChatCleared = ({ chatId: clearedChatId }) => {
        if (clearedChatId === chat._id) {
            setChat(prev => ({ ...prev, messages: [] }));
        }
      };

      const handleDeletedMessage = ({ chatId: deletedInChatId, messageId }) => {
        if (deletedInChatId === chat?._id) {
          setChat(prev => ({ ...prev, messages: prev.messages.filter(msg => msg._id !== messageId) }));
        }
      };

      socket?.on('chatCleared', handleChatCleared);
      socket?.on('messageDeleted', handleDeletedMessage);

      return () => {
        leaveChat(chat._id);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        stopTyping(chat._id);
        socket?.off('chatCleared', handleChatCleared);
        socket?.off('messageDeleted', handleDeletedMessage);
      };
    }
  }, [chat?._id, socket]);

  const handleClearChat = () => {
    Alert.alert("Clear Chat", "Are you sure you want to delete all messages in this chat? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear Chat", style: "destructive", onPress: async () => {
        try {
          await api(`/chats/${chat._id}/messages`, 'DELETE');
          setChat(prev => ({ ...prev, messages: [] }));
        } catch (error) {
          Alert.alert("Error", "Could not clear chat.");
        }
      }}
    ]);
  };
  
  const handleTyping = (text) => {
    setMessage(text);
    if (text.trim() && !typingTimeoutRef.current && chat?.isActive) startTyping(chat._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(chat._id);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const sendMessage = async () => {
    if (!message.trim() || !chat?._id || sending || !chat.isActive) return;
    stopTyping(chat._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const tempMessage = { _id: tempId, tempId, content: message.trim(), sender: { _id: user.id, name: user.name }, timestamp: new Date().toISOString(), status: 'sending' };
    setChat(prev => ({ ...prev, messages: [...prev.messages, tempMessage] }));
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const response = await api(`/chats/${chat._id}/messages`, 'POST', { content: tempMessage.content });
      setChat(prev => ({ ...prev, messages: prev.messages.map(m => m._id === tempId ? response.message : m) }));
      sendRealtimeMessage(chat._id, response.message);
    } catch (error) {
      Alert.alert('Error', `Failed to send message: ${error.message}`);
      setChat(prev => ({ ...prev, messages: prev.messages.filter(m => m._id !== tempId) }));
      setMessage(tempMessage.content);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = useCallback(async (messageId) => {
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            setChat(prev => ({ ...prev, messages: prev.messages.filter(msg => msg._id !== messageId) }));
            await api(`/chats/${chat._id}/messages/${messageId}`, 'DELETE');
            deleteRealtimeMessage(chat._id, messageId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete message.');
            loadChat();
          }
      }},
    ]);
  }, [chat, deleteRealtimeMessage, loadChat]);

  const renderMessage = ({ item }) => (
    <TouchableOpacity onLongPress={() => item.sender._id === user.id && handleDeleteMessage(item._id)}>
      <MessageBubble message={item} isOwn={item.sender._id === user.id} />
    </TouchableOpacity>
  );
  
  if (loading) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#957DAD" /></SafeAreaView>;
  }
  
  const otherParticipant = chat?.participants?.find(p => p._id !== user.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherParticipant?.name || participantName || 'Chat'}</Text>
          {chat?.relatedItem && <Text style={styles.headerSubtext} numberOfLines={1}>About: {chat.relatedItem.name}</Text>}
        </View>
        <TouchableOpacity onPress={handleClearChat} style={styles.optionsButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
      >
        <FlatList
          ref={flatListRef}
          data={chat?.messages || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CED4DA" />
              <Text style={styles.emptyText}>Start the conversation!</Text>
            </View>
          )}
          ListFooterComponent={<TypingIndicator typingUsers={getTypingUsers(chat?._id)} />}
        />
        <SafeAreaView style={styles.inputContainerWrapper} edges={['bottom']}>
          {chat?.isActive ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={message}
                onChangeText={handleTyping}
                placeholder="Type a message..."
                placeholderTextColor="#95a5a6"
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!message.trim() || sending}
              >
                {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.disabledInputContainer}>
                <Ionicons name="lock-closed" size={16} color="#7f8c8d" />
                <Text style={styles.disabledInputText}>
                    Owner must accept the request to enable chat.
                </Text>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  backButton: { padding: 5 },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerName: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  headerSubtext: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  optionsButton: { padding: 5 },
  messagesList: { flex: 1 },
  messagesContainer: { paddingHorizontal: 10, paddingTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  emptyText: { fontSize: 16, color: '#7f8c8d', marginTop: 10 },
  inputContainerWrapper: { backgroundColor: 'white' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  textInput: { flex: 1, backgroundColor: '#F1F2F6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 5, marginRight: 10, fontSize: 16, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#957DAD', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#CED4DA' },
  disabledInputContainer: {
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledInputText: {
    marginLeft: 8,
    color: '#7f8c8d',
    fontStyle: 'italic',
  }
});

export default ChatScreen;