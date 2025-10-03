import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';

const ReviewCard = ({ 
  review, 
  onEdit = null, 
  onDelete = null, 
  onMarkHelpful = null 
}) => {
  const { user } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [isMarkedHelpful, setIsMarkedHelpful] = useState(false);

  // Check if current user is the reviewer
  const isMyReview = user?.id === review.reviewer._id;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleMarkHelpful = async () => {
    if (isMarkedHelpful || isMyReview) return;
    
    try {
      if (onMarkHelpful) {
        await onMarkHelpful(review._id);
        setHelpfulCount(prev => prev + 1);
        setIsMarkedHelpful(true);
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(review);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(review._id)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with user info and rating */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {review.reviewer.profileImage ? (
              <Image 
                source={{ uri: review.reviewer.profileImage }} 
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person-circle" size={40} color="#957DAD" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{review.reviewer.name}</Text>
            <StarRating 
              rating={review.rating} 
              size={16} 
              disabled={true}
            />
          </View>
        </View>
        <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
      </View>

      {/* Review comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          {/* Helpful button */}
          {!isMyReview && (
            <TouchableOpacity 
              style={[
                styles.helpfulButton, 
                isMarkedHelpful && styles.helpfulButtonActive
              ]}
              onPress={handleMarkHelpful}
              disabled={isMarkedHelpful}
            >
              <Ionicons 
                name={isMarkedHelpful ? "thumbs-up" : "thumbs-up-outline"} 
                size={16} 
                color={isMarkedHelpful ? "#957DAD" : "#7f8c8d"} 
              />
              <Text style={[
                styles.helpfulText,
                isMarkedHelpful && styles.helpfulTextActive
              ]}>
                Helpful {helpfulCount > 0 && `(${helpfulCount})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Edit/Delete buttons for own reviews */}
        {isMyReview && (
          <View style={styles.rightActions}>
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Ionicons name="pencil" size={16} color="#957DAD" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Ionicons name="trash" size={16} color="#e74c3c" />
                <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Updated indicator */}
      {review.updatedAt !== review.createdAt && (
        <Text style={styles.updatedText}>Updated</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  comment: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignSelf: 'flex-start',
  },
  helpfulButtonActive: {
    backgroundColor: '#E0BBE4',
  },
  helpfulText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  helpfulTextActive: {
    color: '#4A235A',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#957DAD',
    marginLeft: 4,
  },
  updatedText: {
    fontSize: 10,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default ReviewCard;
