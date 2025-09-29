import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, Dimensions, FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image'; // Using expo-image for better performance
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../context/FollowContext';

const { width } = Dimensions.get('window');

const ItemDetailScreenEnhanced = ({ route, navigation }) => {
  const { item } = route.params;
  const { user } = useAuth();
  const { isFollowing, toggleFollow, checkFollowStatus, loading: followLoading } = useFollow();
  const [loading, setLoading] = useState(false);
  const [hasRequestedBefore, setHasRequestedBefore] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Handle both old and new image formats
  const images = item.images && item.images.length > 0 ? item.images : [item.imageUrl];
  const featuredIndex = item.featuredImageIndex || 0;
  
  // Check if the logged-in user is the owner of the item
  // Handle both cases: item.user as object {_id, name} or as string ID
  const itemOwnerId = typeof item.user === 'object' ? item.user._id : item.user;
  const isOwner = user?.id === itemOwnerId;

  useEffect(() => {
    const initializeScreen = async () => {
      if (isOwner) {
        setCheckingRequest(false);
        return;
      }
      
      try {
        // Check existing rental request
        const requests = await api('/rentals/outgoing?status=pending');
        const hasRequested = requests.some(
          request => request.item._id === item._id
        );
        setHasRequestedBefore(hasRequested);

        // Check follow status using global context
        if (itemOwnerId) {
          await checkFollowStatus(itemOwnerId);
        }
      } catch (error) {
        console.error('[ITEM_DETAIL_ENHANCED] Error initializing screen:', error);
        setHasRequestedBefore(false);
      } finally {
        setCheckingRequest(false);
      }
    };

    if (!isOwner) {
      initializeScreen();
    } else {
      setCheckingRequest(false);
    }
  }, [item._id, isOwner]);

  const handleRentNow = async () => {
    if (isOwner) {
      Alert.alert("Info", "This is your own item. You can manage it from your profile.");
      return;
    }

    Alert.alert(
      "Confirm Rental Request",
      `Do you want to send a rental request for "${item.name}" at ₹${item.price_per_day}/day?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send Request", onPress: submitRentalRequest }
      ]
    );
  };

  const submitRentalRequest = async () => {
    setLoading(true);
    try {
      const response = await api('/rentals/request', 'POST', { itemId: item._id });
      setHasRequestedBefore(true);
      
      Alert.alert(
        "Request Sent! 🎉", 
        `Your rental request for "${item.name}" has been sent to the owner. You'll be notified when they respond.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("[RENTAL_REQUEST] Error:", error);
      
      if (error.message.includes('already requested')) {
        Alert.alert("Already Requested", "You have already sent a request for this item.");
        setHasRequestedBefore(true);
      } else if (error.message.includes('own item') || error.message.includes('isOwnItem')) {
        Alert.alert("Info", "This is your own item. You can manage it from your profile.");
      } else {
        Alert.alert("Request Failed", error.message || "Could not submit your request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    // Additional safety check - should never happen since UI hides button for owners
    if (isOwner) {
      Alert.alert("Info", "This is your own item. You cannot follow yourself.");
      return;
    }
    
    const ownerName = typeof item.user === 'object' ? item.user.name : 'User';
    await toggleFollow(itemOwnerId, ownerName);
  };

  const handleStartChat = async () => {
    // Additional safety check - should never happen since UI hides button for owners
    if (isOwner) {
      Alert.alert("Info", "This is your own item. You cannot chat with yourself.");
      return;
    }
    
    setChatLoading(true);
    try {
      const ownerName = typeof item.user === 'object' ? item.user.name : 'Owner';
      
      console.log('[ITEM_DETAIL_ENHANCED] Starting chat with:', { itemOwnerId, ownerName, itemId: item._id });
      
      // Navigate to chat with the owner
      navigation.navigate('Chat', {
        participantId: itemOwnerId,
        itemId: item._id,
        participantName: ownerName,
        itemName: item.name
      });
    } catch (error) {
      console.error('[ITEM_DETAIL_ENHANCED] Chat error:', error);
      Alert.alert("Error", "Could not start chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleImageScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentImageIndex(currentIndex);
  };

  const renderImageItem = ({ item: imageUrl, index }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        placeholder="https://dummyimage.com/600x400/E0BBE4/4A235A&text=Loading"
      />
      {index === featuredIndex && images.length > 1 && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={16} color="white" />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
    </View>
  );

  const renderImageIndicator = () => {
    if (images.length <= 1) return null;
    
    return (
      <View style={styles.imageIndicatorContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.imageIndicator,
              index === currentImageIndex && styles.activeImageIndicator
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        {/* Enhanced Image Section with Slideshow */}
        <View style={styles.imageSection}>
          <FlatList
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `image-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          />
          
          {/* Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Image Counter */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Image Indicators */}
        {renderImageIndicator()}

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          {/* Owner Info */}
          <View style={styles.ownerSection}>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerInitial}>
                  {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.ownerName}>
                  {item.user?.name || 'Unknown User'}
                </Text>
                <Text style={styles.ownerLabel}>Item Owner</Text>
              </View>
            </View>
            
            {!isOwner && (
              <View style={styles.ownerActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.followButton]}
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="#957DAD" />
                  ) : (
                    <>
                      <Ionicons 
                        name={isFollowing(itemOwnerId) ? 'person-remove-outline' : 'person-add-outline'} 
                        size={16} 
                        color="#957DAD" 
                      />
                      <Text style={styles.followButtonText}>
                        {isFollowing(itemOwnerId) ? 'Unfollow' : 'Follow'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.chatButton]}
                  onPress={handleStartChat}
                  disabled={chatLoading}
                >
                  {chatLoading ? (
                    <ActivityIndicator size="small" color="#957DAD" />
                  ) : (
                    <>
                      <Ionicons name="chatbubble-outline" size={16} color="#957DAD" />
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.description}>{item.description}</Text>
          
          {/* Additional Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#7f8c8d" />
              <Text style={styles.infoText}>
                Listed on {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Footer */}
      {!isOwner && (
        <View style={styles.footer}>
          <View style={styles.priceSection}>
            <Text style={styles.price}>₹{item.price_per_day}</Text>
            <Text style={styles.priceLabel}>per day</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => navigation.navigate('Chat', { 
                participantId: item.user._id || item.user,
                itemId: item._id 
              })}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#957DAD" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
            
            {checkingRequest ? (
              <View style={styles.rentButton}>
                <ActivityIndicator color="#4A235A" />
              </View>
            ) : hasRequestedBefore ? (
              <TouchableOpacity style={styles.requestedButton} disabled={true}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.requestedButtonText}>Request Sent</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.rentButton, loading && styles.rentButtonDisabled]} 
                onPress={handleRentNow}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="bag-handle-outline" size={20} color="white" />
                    <Text style={styles.rentButtonText}>Rent Now</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Owner Footer */}
      {isOwner && (
        <View style={styles.ownerFooter}>
          <View style={styles.ownerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Requests</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.manageButton}>
            <Ionicons name="settings-outline" size={20} color="#957DAD" />
            <Text style={styles.manageButtonText}>Manage Listing</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  imageSection: { position: 'relative' },
  imageContainer: { width, height: 400, position: 'relative' },
  image: { width: '100%', height: '100%' },
  featuredBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(241, 196, 15, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  backButton: { 
    position: 'absolute', 
    top: 20, 
    left: 20, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imageCounter: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: { color: 'white', fontSize: 14, fontWeight: '500' },
  imageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeImageIndicator: { backgroundColor: '#957DAD' },
  detailsContainer: { padding: 20 },
  ownerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  ownerInfo: { flexDirection: 'row', alignItems: 'center' },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0BBE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownerInitial: { color: '#4A235A', fontSize: 18, fontWeight: 'bold' },
  ownerName: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  ownerLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 15,
    minWidth: 80,
    justifyContent: 'center',
  },
  followButton: {
    borderColor: '#E0BBE4',
  },
  followButtonText: { marginLeft: 4, fontSize: 14, color: '#957DAD', fontWeight: '500' },
  chatButton: {
    borderColor: '#E0BBE4',
  },
  chatButtonText: { marginLeft: 4, fontSize: 14, color: '#957DAD', fontWeight: '500' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  category: { fontSize: 16, color: '#7f8c8d', marginBottom: 16 },
  description: { fontSize: 16, color: '#34495e', lineHeight: 24, marginBottom: 20 },
  infoSection: { marginTop: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, fontSize: 14, color: '#7f8c8d' },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#E9ECEF',
    backgroundColor: 'white'
  },
  priceSection: { alignItems: 'flex-start' },
  price: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  priceLabel: { fontSize: 14, color: '#7f8c8d', marginTop: 2 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  rentButton: { 
    backgroundColor: '#957DAD', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center'
  },
  rentButtonDisabled: { backgroundColor: '#CED4DA' },
  rentButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
  requestedButton: { 
    backgroundColor: '#27AE60', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center'
  },
  requestedButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  ownerFooter: { 
    padding: 20, 
    backgroundColor: '#F8F9FA', 
    borderTopWidth: 1, 
    borderTopColor: '#E9ECEF' 
  },
  ownerStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  statLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E9ECEF', marginHorizontal: 20 },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0BBE4',
    borderRadius: 25,
  },
  manageButtonText: { marginLeft: 6, fontSize: 16, color: '#957DAD', fontWeight: '500' },
});

export default ItemDetailScreenEnhanced;
