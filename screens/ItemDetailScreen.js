import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api'; // Import our secure API client
import { useAuth } from '../context/AuthContext'; // To check if the user is the owner
import { useFollow } from '../context/FollowContext'; // For global follow management

const ItemDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const { user } = useAuth(); // Get the current logged-in user
  const { isFollowing, toggleFollow, checkFollowStatus, loading: followLoading } = useFollow();
  const [loading, setLoading] = useState(false);
  const [hasRequestedBefore, setHasRequestedBefore] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Check if the logged-in user is the owner of the item
  // Handle both cases: item.user as object {_id, name} or as string ID
  const itemOwnerId = typeof item.user === 'object' ? item.user._id : item.user;
  const isOwner = user?.id === itemOwnerId;
  
  // Debug logging to ensure proper owner detection
  console.log('[ITEM_DETAIL] Owner check:', {
    currentUserId: user?.id,
    itemOwnerId: itemOwnerId,
    itemUserType: typeof item.user,
    isOwner: isOwner
  });

  // Check if user has already requested this item and follow status
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
        console.error('[ITEM_DETAIL] Error initializing screen:', error);
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
  }, [item._id, isOwner, checkFollowStatus]);

  const handleRentNow = async () => {
    console.log('🎯 [REGULAR] handleRentNow called');
    console.log('🎯 [REGULAR] isOwner:', isOwner);
    console.log('🎯 [REGULAR] item.listingType:', item.listingType);
    
    // Additional safety check - should never happen since UI hides button for owners
    if (isOwner) {
      Alert.alert("Info", "This is your own item. You can manage it from your profile.");
      return;
    }

    // Show message input dialog
    const isForSale = item.listingType === 'sell';
    const actionText = isForSale ? "Purchase Request" : "Rental Request";
    const priceText = isForSale ? `₹${item.price_per_day}` : `₹${item.price_per_day}/${item.rentalDuration || 'day'}`;
    
    console.log('🎯 [REGULAR] About to show Alert for request');
    
    // Show confirmation first, then ask for message
    Alert.alert(
      `Send ${actionText}`,
      `${isForSale ? 'Interested in buying' : 'Requesting'} "${item.name}" for ${priceText}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send Request", 
          onPress: () => {
            console.log('🎯 [REGULAR] Alert onPress called, submitting request');
            submitRentalRequest("");
          }
        }
      ]
    );
  };

  const submitRentalRequest = async (customMessage = "") => {
    console.log('🚀 [REGULAR] submitRentalRequest called with message:', customMessage);
    setLoading(true);
    try {
      console.log('🚀 [REGULAR] Making API call to /rentals/request');
      // Use our secure API client to send the request
      const response = await api('/rentals/request', 'POST', { 
        itemId: item._id,
        customMessage: customMessage.trim()
      });
      console.log('🚀 [REGULAR] API response received:', response);
      
      // Update local state to show request has been sent
      setHasRequestedBefore(true);
      
      const requestType = item.listingType === 'sell' ? 'purchase request' : 'rental request';
      Alert.alert(
        "Request Sent! 🎉", 
        `Your ${requestType} for "${item.name}" has been sent to the owner and a message has been added to your chat. You'll be notified when they respond.`,
        [
          { text: "Go to Chat", onPress: () => {
            const ownerName = typeof item.user === 'object' ? item.user.name : 'Owner';
            navigation.navigate('Chat', {
              participantId: itemOwnerId,
              itemId: item._id,
              participantName: ownerName,
              itemName: item.name
            });
          }},
          { text: "OK", onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error("[RENTAL_REQUEST] Error:", error);
      
      // Handle specific error cases
      if (error.message.includes('already sent a request') || error.message.includes('alreadyRequested')) {
        const requestType = item.listingType === 'sell' ? 'purchase request' : 'rental request';
        Alert.alert("Already Requested", `You have already sent a ${requestType} for this item. Please wait for the owner to respond.`);
        setHasRequestedBefore(true);
      } else if (error.message.includes('own item') || error.message.includes('isOwnItem')) {
        // This should not happen since UI prevents it, but handle gracefully
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
      
      console.log('[ITEM_DETAIL] Starting chat with:', { itemOwnerId, ownerName, itemId: item._id });
      
      // Navigate to chat with the owner
      navigation.navigate('Chat', {
        participantId: itemOwnerId,
        itemId: item._id,
        participantName: ownerName,
        itemName: item.name
      });
    } catch (error) {
      console.error('[ITEM_DETAIL] Chat error:', error);
      Alert.alert("Error", "Could not start chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <Image 
          source={{ 
            uri: imageError ? 'https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image' : item.imageUrl 
          }} 
          style={styles.image}
          onError={() => setImageError(true)}
        />
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      </ScrollView>

      {/* --- ENHANCED FOOTER --- */}
      {/* The footer will not show if the user is the owner of the item */}
      {!isOwner && (
        <>
          {/* Social Actions Bar */}
          <View style={styles.socialActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.followButton]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color="#4A235A" />
              ) : (
                <>
                  <Ionicons 
                    name={isFollowing(itemOwnerId) ? 'person-remove-outline' : 'person-add-outline'} 
                    size={18} 
                    color="#4A235A" 
                  />
                  <Text style={styles.actionButtonText}>
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
                <ActivityIndicator size="small" color="#4A235A" />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={18} color="#4A235A" />
                  <Text style={styles.actionButtonText}>Chat</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Main Footer */}
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                ₹{item.price_per_day}
              </Text>
              <Text style={styles.priceLabel}>
                {item.listingType === 'sell' ? '' : `${item.rentalDuration || 'per day'}`}
              </Text>
            </View>
            
            {checkingRequest ? (
              <View style={styles.rentButton}>
                <ActivityIndicator color="#4A235A" />
              </View>
            ) : hasRequestedBefore ? (
              <TouchableOpacity style={styles.requestedButton} disabled={true}>
                <Text style={styles.requestedButtonText}>✓ Request Sent</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.rentButton, loading && styles.rentButtonDisabled]} 
                onPress={handleRentNow}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#4A235A" />
                ) : (
                  <Text style={styles.rentButtonText}>
                    {item.listingType === 'sell' ? 'Buy Now' : 'Rent Now'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Show owner message if user owns this item */}
      {isOwner && (
        <View style={styles.ownerFooter}>
          <Text style={styles.ownerText}>📝 This is your listing</Text>
          <Text style={styles.ownerSubtext}>Other users can send you rental requests</Text>
        </View>
      )}
      
      {/* Enhanced View Button */}
      {!isOwner && (
        <View style={styles.enhancedViewContainer}>
          <TouchableOpacity 
            style={styles.enhancedViewButton}
            onPress={() => navigation.navigate('ItemDetailEnhanced', { item })}
          >
            <Ionicons name="eye-outline" size={20} color="#957DAD" />
            <Text style={styles.enhancedViewText}>Enhanced View</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  image: { width: '100%', height: 400 },
  backButton: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  detailsContainer: { padding: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  category: { fontSize: 18, color: '#7f8c8d', marginBottom: 16 },
  socialActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingVertical: 15, 
    backgroundColor: '#F8F9FA', 
    borderTopWidth: 1, 
    borderTopColor: '#E9ECEF' 
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: '#E0BBE4', 
    backgroundColor: '#FFFFFF',
    minWidth: 90,
    justifyContent: 'center'
  },
  followButton: { marginRight: 10 },
  chatButton: { marginLeft: 10 },
  actionButtonText: { marginLeft: 6, fontSize: 14, color: '#4A235A', fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  priceContainer: { alignItems: 'flex-start' },
  price: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  priceLabel: { fontSize: 14, color: '#7f8c8d', marginTop: 2 },
  rentButton: { backgroundColor: '#E0BBE4', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, minWidth: 150, alignItems: 'center' },
  rentButtonDisabled: { backgroundColor: '#CED4DA' },
  rentButtonText: { color: '#4A235A', fontSize: 18, fontWeight: 'bold' },
  requestedButton: { backgroundColor: '#27AE60', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, minWidth: 150, alignItems: 'center' },
  requestedButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  ownerFooter: { padding: 20, backgroundColor: '#F8F9FA', borderTopWidth: 1, borderTopColor: '#E9ECEF', alignItems: 'center' },
  ownerText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  ownerSubtext: { fontSize: 14, color: '#7f8c8d', textAlign: 'center' },
  enhancedViewContainer: { padding: 15, backgroundColor: '#f8f9fa', alignItems: 'center' },
  enhancedViewButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0BBE4',
    borderRadius: 20,
  },
  enhancedViewText: { marginLeft: 6, fontSize: 14, color: '#957DAD', fontWeight: '500' },
});

export default ItemDetailScreen;