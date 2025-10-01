import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import MessageBubble from './MessageBubble';

const AnimatedMessageBubble = ({ message, isMyMessage, showStatus, hasBeenRead, isNew = false }) => {
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(isNew ? 20 : 0)).current;

  useEffect(() => {
    if (isNew) {
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
        })
      ]).start();
    }
  }, [isNew]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <MessageBubble
        message={message}
        isMyMessage={isMyMessage}
        showStatus={showStatus}
        hasBeenRead={hasBeenRead}
      />
    </Animated.View>
  );
};

export default AnimatedMessageBubble;
