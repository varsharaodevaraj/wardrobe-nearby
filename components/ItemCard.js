import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRental } from '../context/RentalContext';
import StarRating from './StarRating';

const ItemCard = React.memo(({ item, onDelete, onToggleAvailability }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { getRentalStatus } = useRental();
  const [imageError, setImageError] = useState(false);

  // **THIS IS THE FIX**: Handle cases where item.user might be null
  if (!item || !item.user) {
    // Render a placeholder or nothing at all to prevent a crash
    return null; 
  }

  const isOwner = user?.id === (typeof item.user === 'object' ? item.user._id : item.user);
  const ownerName = typeof item.user === 'object' ? item.user.name : 'Owner';
  const ownerStatus = typeof item.user === 'object' ? item.user.status : 'regular';

  const hasRequested = !isOwner && getRentalStatus(item._id);

  const handlePress = useCallback(() => {
    navigation.navigate('ItemDetail', { item: item });
  }, [navigation, item]);

  const handleImageError = useCallback((e) => {
    console.log('[ITEMCARD] Image load error for:', item.imageUrl, e.nativeEvent.error);
    setImageError(true);
  }, [item.imageUrl]);

  const getFeaturedImageUrl = () => {
    if (item.images && item.images.length > 0) {
      const featuredIndex = item.featuredImageIndex || 0;
      return item.images[featuredIndex] || item.images[0];
    }
    return item.imageUrl;
  };

  const fallbackImageUrl = 'https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image';
  const featuredImage = getFeaturedImageUrl();
  const isUnreliableUrl = featuredImage && featuredImage.includes('placehold.co');
  const displayUrl = isUnreliableUrl || imageError ? fallbackImageUrl : featuredImage;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handlePress}>
      <Image
        source={{ uri: displayUrl }}
        style={styles.image}
        onError={handleImageError}
      />
      
      {isOwner && onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item._id)}>
          <Ionicons name="trash-outline" size={24} color="#E74C3C" />
        </TouchableOpacity>
      )}

      <View style={styles.infoContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{item.name}</Text>
          <View style={[styles.listingBadge, item.listingType === 'sell' && styles.sellBadge]}>
            <Text style={[styles.listingText, item.listingType === 'sell' && styles.sellText]}>
              {item.listingType === 'sell' ? 'FOR SALE' : 'FOR RENT'}
            </Text>
          </View>
        </View>

        <View style={styles.ownerContainer}>
          <View style={styles.ownerInfo}>
            <Ionicons name="person-circle-outline" size={16} color="#7f8c8d" />
            <Text style={styles.ownerName}>{ownerName}</Text>
            {ownerStatus === 'super-lender' && (
              <View style={styles.superLenderBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.superLenderText}>Super Lender</Text>
              </View>
            )}
            {isOwner && (
              <View style={styles.ownItemIndicator}>
                <Text style={styles.ownItemText}>Your Item</Text>
              </View>
            )}
            {hasRequested && (
              <View style={styles.requestedIndicator}>
                <Ionicons name="checkmark-circle" size={12} color="#27AE60" />
                <Text style={styles.requestedText}>
                  {item.listingType === 'sell' ? 'Purchase Requested' : 'Rental Requested'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {item.totalReviews > 0 && (
          <View style={styles.ratingContainer}>
            <StarRating
              rating={Math.round(item.averageRating)}
              size={14}
              disabled={true}
              color="#FFD700"
            />
            <Text style={styles.ratingText}>
              {item.averageRating.toFixed(1)} ({item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'})
            </Text>
          </View>
        )}

        {/* Availability Status with Toggle */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.availabilityBadge,
            item.isAvailable !== false ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <Ionicons
              name={item.isAvailable !== false ? "checkmark-circle" : "close-circle"}
              size={12}
              color={item.isAvailable !== false ? "#2E7D32" : "#D32F2F"}
            />
            <Text style={[
              styles.availabilityText,
              item.isAvailable !== false ? styles.availableText : styles.unavailableText
            ]}>
              {item.isAvailable !== false ? 'Available' : 'Not Available'}
            </Text>
          </View>
          {isOwner && onToggleAvailability && (
            <Switch
              value={item.isAvailable !== false}
              onValueChange={(newValue) => onToggleAvailability(item._id, newValue)}
              trackColor={{ false: "#CED4DA", true: "#E0BBE4" }}
              thumbColor={item.isAvailable !== false ? "#957DAD" : "#f4f3f4"}
              style={styles.availabilitySwitch}
            />
          )}
        </View>

        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>
          ₹{item.price_per_day}
          {item.listingType === 'rent' && (
            <Text style={styles.duration}> {item.rentalDuration || 'per day'}</Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 8,
        borderRadius: 20,
    },
    image: {
        width: '100%',
        height: 200,
    },
    infoContainer: {
        padding: 15,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        flex: 1,
        marginRight: 8,
    },
    listingBadge: {
        backgroundColor: '#E0BBE4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    sellBadge: {
        backgroundColor: '#FF6B6B',
    },
    listingText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4A235A',
        textAlign: 'center',
    },
    sellText: {
        color: '#FFFFFF',
    },
    category: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 8,
        textAlign: 'right',
    },
    duration: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#7f8c8d',
    },
    ownerContainer: {
        marginVertical: 8,
    },
    ownerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ownerName: {
        fontSize: 12,
        color: '#7f8c8d',
        marginLeft: 4,
        flex: 1,
    },
    superLenderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEA',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderColor: '#FFD700',
        borderWidth: 1,
    },
    superLenderText: {
        fontSize: 10,
        color: '#B7950B',
        marginLeft: 2,
        fontWeight: '500',
    },
    ownItemIndicator: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    ownItemText: {
        fontSize: 10,
        color: '#666',
        fontWeight: '500',
    },
    requestedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    requestedText: {
        fontSize: 9,
        color: '#27AE60',
        fontWeight: '600',
        marginLeft: 3,
    },
    statusContainer: {
        marginVertical: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    availabilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    availableBadge: {
        backgroundColor: '#E8F5E8',
    },
    unavailableBadge: {
        backgroundColor: '#FFF2F2',
    },
    availabilityText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    availableText: {
        color: '#2E7D32',
    },
    unavailableText: {
        color: '#D32F2F',
    },
    availabilitySwitch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }]
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginLeft: 6,
    },
});

export default ItemCard;