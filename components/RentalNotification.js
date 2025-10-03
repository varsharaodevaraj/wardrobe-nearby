import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const RentalNotification = ({ 
  visible, 
  type = 'accepted', // 'accepted', 'declined', 'completed'
  itemName = '',
  onNavigateToReview = null,
  onNavigateToRentals = null,
  onDismiss = null,
  autoHide = true,
  duration = 5000
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      if (autoHide) {
        const timer = setTimeout(() => {
          hideNotification();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideNotification();
    }
  }, [visible, autoHide, duration]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const getNotificationContent = () => {
    switch (type) {
      case 'accepted':
        return {
          icon: 'checkmark-circle',
          iconColor: '#27AE60',
          bgColor: '#D4EDDA',
          borderColor: '#27AE60',
          title: 'Request Accepted! 🎉',
          message: `Your rental request for "${itemName}" has been accepted. You can now write a review!`,
          actions: [
            {
              text: 'Write Review',
              action: onNavigateToReview,
              style: 'primary'
            },
            {
              text: 'View Rentals',
              action: onNavigateToRentals,
              style: 'secondary'
            }
          ]
        };
      case 'declined':
        return {
          icon: 'close-circle',
          iconColor: '#E74C3C',
          bgColor: '#F8D7DA',
          borderColor: '#E74C3C',
          title: 'Request Declined',
          message: `Your rental request for "${itemName}" was declined.`,
          actions: [
            {
              text: 'Browse More',
              action: onNavigateToRentals,
              style: 'secondary'
            }
          ]
        };
      case 'completed':
        return {
          icon: 'checkmark-done-circle',
          iconColor: '#3498DB',
          bgColor: '#CCE5FF',
          borderColor: '#3498DB',
          title: 'Rental Completed! ✅',
          message: `Your rental of "${itemName}" is now complete. How was your experience?`,
          actions: [
            {
              text: 'Write Review',
              action: onNavigateToReview,
              style: 'primary'
            }
          ]
        };
      default:
        return null;
    }
  };

  if (!visible) return null;

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: content.bgColor,
          borderColor: content.borderColor,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name={content.icon} size={24} color={content.iconColor} />
          <Text style={styles.title}>{content.title}</Text>
        </View>
        <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#7f8c8d" />
        </TouchableOpacity>
      </View>

      <Text style={styles.message}>{content.message}</Text>

      {content.actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {content.actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.style === 'primary' ? styles.primaryButton : styles.secondaryButton
              ]}
              onPress={() => {
                if (action.action) action.action();
                hideNotification();
              }}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  action.style === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
                ]}
              >
                {action.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
    zIndex: 1000,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  closeButton: {
    padding: 5,
  },
  message: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#957DAD',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7f8c8d',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#7f8c8d',
  },
});

export default RentalNotification;
