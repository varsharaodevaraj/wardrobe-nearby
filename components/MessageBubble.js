import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MessageBubble = ({ message, isOwn }) => {
  const navigation = useNavigation();

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    let iconName = 'checkmark';
    let iconColor = 'rgba(255, 255, 255, 0.7)';
    
    switch (message.status) {
      case 'sending': iconName = 'time-outline'; break;
      case 'sent': iconName = 'checkmark'; break;
      case 'read': iconName = 'checkmark-done'; iconColor = '#4A90E2'; break;
      default: iconName = 'checkmark';
    }
    return <Ionicons name={iconName} size={14} color={iconColor} style={{ marginLeft: 4 }} />;
  };
  
  const handleItemPress = () => {
    if (message.itemInfo?.itemId) {
      navigation.navigate('ItemDetail', { item: { _id: message.itemInfo.itemId } });
    }
  };

  if (message.messageType === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessageText}>{message.content}</Text>
      </View>
    );
  }
  
  if (message.messageType === 'request') {
      return (
          <View style={[styles.messageRow, isOwn ? styles.ownMessageRow : styles.otherMessageRow]}>
            <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                <TouchableOpacity onPress={handleItemPress} style={styles.requestContainer}>
                    <Image source={{ uri: message.itemInfo.itemImage }} style={styles.requestImage} />
                    <View style={styles.requestTextContainer}>
                        <Text style={[styles.requestTitle, isOwn && styles.ownMessageText]}>{message.itemInfo.itemName}</Text>
                        <Text style={[styles.requestSubtitle, isOwn && styles.ownMessageText]}>Rental Request</Text>
                    </View>
                </TouchableOpacity>
                <Text style={[isOwn ? styles.ownMessageText : styles.otherMessageText, { marginTop: 8 }]}>
                    {message.content}
                </Text>
                <View style={styles.footer}>
                    <Text style={isOwn ? styles.ownTimeText : styles.otherTimeText}>
                        {formatTime(message.timestamp)}
                    </Text>
                    {isOwn && getStatusIcon()}
                </View>
            </View>
          </View>
      );
  }

  return (
    <View style={[styles.messageRow, isOwn ? styles.ownMessageRow : styles.otherMessageRow]}>
      <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={isOwn ? styles.ownMessageText : styles.otherMessageText}>
          {message.content}
        </Text>
        <View style={styles.footer}>
          <Text style={isOwn ? styles.ownTimeText : styles.otherTimeText}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && getStatusIcon()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: { flexDirection: 'row', marginVertical: 5 },
  ownMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, maxWidth: '80%' },
  ownBubble: { backgroundColor: '#957DAD', borderBottomRightRadius: 5 },
  otherBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#E9ECEF' },
  ownMessageText: { color: '#FFFFFF', fontSize: 16 },
  otherMessageText: { color: '#2c3e50', fontSize: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 5 },
  ownTimeText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11 },
  otherTimeText: { color: '#7f8c8d', fontSize: 11 },
  systemMessageContainer: { alignItems: 'center', marginVertical: 10 },
  systemMessageText: { fontSize: 12, color: '#7f8c8d', backgroundColor: '#E9ECEF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  requestContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 8, marginBottom: 8 },
  requestImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
  requestTextContainer: { flex: 1, justifyContent: 'center' },
  requestTitle: { fontWeight: 'bold', fontSize: 15 },
  requestSubtitle: { fontSize: 13, color: '#7f8c8d' },
});

export default MessageBubble;