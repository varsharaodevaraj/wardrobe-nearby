import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

// We receive 'item' as a prop.
const ItemCard = React.memo(({ item }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  
  // Check if current user is the owner
  const isOwner = user?.id === (typeof item.user === 'object' ? item.user._id : item.user);
  const ownerName = typeof item.user === 'object' ? item.user.name : 'Owner';
  const ownerStatus = typeof item.user === 'object' ? item.user.status : 'regular';

  // --- HANDLE PRESS EVENT ---
  const handlePress = useCallback(() => {
    // Navigate to the 'ItemDetail' screen and pass the 'item' object as a parameter.
    navigation.navigate('ItemDetail', { item: item });
  }, [navigation, item]);

  const handleImageError = useCallback((e) => {
    console.log('[ITEMCARD] Image load error for:', item.imageUrl, e.nativeEvent.error);
    console.log('[ITEMCARD] Switching to fallback image');
    setImageError(true);
  }, [item.imageUrl]);

  // Use featured image if available, fallback to main imageUrl
  const getFeaturedImageUrl = () => {
    if (item.images && item.images.length > 0) {
      const featuredIndex = item.featuredImageIndex || 0;
      return item.images[featuredIndex] || item.images[0];
    }
    return item.imageUrl;
  };

  // Fallback image for when the main image fails to load
  const fallbackImageUrl = 'https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image';
  const featuredImage = getFeaturedImageUrl();
  
  // Check if the URL is from placehold.co (which can be unreliable)
  const isUnreliableUrl = featuredImage && featuredImage.includes('placehold.co');
  const displayUrl = isUnreliableUrl || imageError ? fallbackImageUrl : featuredImage;

  return (
    // --- ATTACH ONPRESS HANDLER ---
    <TouchableOpacity style={styles.cardContainer} onPress={handlePress}>
      <Image 
        source={{ uri: displayUrl }} 
        style={styles.image}
        onLoad={() => console.log('[ITEMCARD] Image loaded successfully:', displayUrl)}
        onError={handleImageError}
      />
      
      <View style={styles.infoContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{item.name}</Text>
          <View style={[styles.listingBadge, item.listingType === 'sell' && styles.sellBadge]}>
            <Text style={[styles.listingText, item.listingType === 'sell' && styles.sellText]}>
              {item.listingType === 'sell' ? 'FOR SALE' : 'FOR RENT'}
            </Text>
          </View>
        </View>
        
        {/* Owner info with super lender status */}
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
          </View>
        </View>

        {/* Rating Display */}
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

        {/* Availability Status */}
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
    statusContainer: {
        marginVertical: 5,
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
    
    // Rating Styles
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