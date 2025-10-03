import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StarRating = ({ 
  rating = 0, 
  maxStars = 5, 
  size = 20, 
  color = '#FFD700', 
  emptyColor = '#DDD',
  onRatingChange = null,
  disabled = false,
  style = {}
}) => {
  const renderStar = (index) => {
    const isFilled = index < rating;
    const starName = isFilled ? 'star' : 'star-outline';
    const starColor = isFilled ? color : emptyColor;

    if (onRatingChange && !disabled) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => onRatingChange(index + 1)}
          style={styles.starButton}
        >
          <Ionicons
            name={starName}
            size={size}
            color={starColor}
          />
        </TouchableOpacity>
      );
    }

    return (
      <Ionicons
        key={index}
        name={starName}
        size={size}
        color={starColor}
        style={styles.starIcon}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  starIcon: {
    marginHorizontal: 1,
  },
});

export default StarRating;
