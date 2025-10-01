import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageNotification = ({ 
  isVisible, 
  senderName, 
  messageContent, 
  onPress, 
  onDismiss 
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Show notification
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Auto-dismiss after 4 seconds
      const dismissTimer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(dismissTimer);
    } else {
      hideNotification();
    }
  }, [isVisible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.notificationContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.notificationContent}
        onPress={() => {
          hideNotification();
          onPress?.();
        }}
        activeOpacity={0.9}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.senderInfo}>
            <Ionicons name="chatbubble" size={16} color="#957DAD" />
            <Text style={styles.senderName} numberOfLines={1}>
              {senderName || 'New Message'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={hideNotification}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color="#7f8c8d" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.messagePreview} numberOfLines={2}>
          {messageContent}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
  },
  notificationContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#957DAD',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 6,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  messagePreview: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 16,
  },
});

export default MessageNotification;
