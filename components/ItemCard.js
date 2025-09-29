import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFollow } from '../context/FollowContext';
import { useAuth } from '../context/AuthContext';

// We receive 'item' as a prop.
const ItemCard = React.memo(({ item }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isFollowing } = useFollow();
  const [imageError, setImageError] = useState(false);
  
  // Check if current user is the owner
  const isOwner = user?.id === (typeof item.user === 'object' ? item.user._id : item.user);
  const itemOwnerId = typeof item.user === 'object' ? item.user._id : item.user;
  const ownerName = typeof item.user === 'object' ? item.user.name : 'Owner';

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

  // Fallback image for when the main image fails to load
  const fallbackImageUrl = 'https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image';
  
  // Check if the URL is from placehold.co (which can be unreliable)
  const isUnreliableUrl = item.imageUrl && item.imageUrl.includes('placehold.co');
  const displayUrl = isUnreliableUrl || imageError ? fallbackImageUrl : item.imageUrl;

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
        
        {/* Owner info with follow status */}
        <View style={styles.ownerContainer}>
          <View style={styles.ownerInfo}>
            <Ionicons name="person-circle-outline" size={16} color="#7f8c8d" />
            <Text style={styles.ownerName}>{ownerName}</Text>
            {!isOwner && isFollowing(itemOwnerId) && (
              <View style={styles.followingIndicator}>
                <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
                <Text style={styles.followingText}>Following</Text>
              </View>
            )}
            {isOwner && (
              <View style={styles.ownItemIndicator}>
                <Text style={styles.ownItemText}>Your Item</Text>
              </View>
            )}
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
    followingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    followingText: {
        fontSize: 10,
        color: '#27AE60',
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
});

export default ItemCard;