import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api'; // Import our secure API client
import { useAuth } from '../context/AuthContext'; // To check if the user is the owner

const ItemDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const { user } = useAuth(); // Get the current logged-in user
  const [loading, setLoading] = useState(false);
  const [hasRequestedBefore, setHasRequestedBefore] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Check if the logged-in user is the owner of the item
  const isOwner = user?.id === item.user;

  // Check if user has already requested this item (optimized)
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (isOwner) {
        setCheckingRequest(false);
        return;
      }
      try {
        // Only get pending requests to reduce data transfer
        const requests = await api('/rentals/outgoing?status=pending');
        const hasRequested = requests.some(
          request => request.item._id === item._id
        );
        setHasRequestedBefore(hasRequested);
      } catch (error) {
        console.error('[ITEM_DETAIL] Error checking requests:', error);
        // If error, assume no request to allow user to try
        setHasRequestedBefore(false);
      } finally {
        setCheckingRequest(false);
      }
    };

    // Only check if not owner
    if (!isOwner) {
      checkExistingRequest();
    } else {
      setCheckingRequest(false);
    }
  }, [item._id, isOwner]);

  const handleRentNow = async () => {
    // Show confirmation dialog first
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
      // Use our secure API client to send the request
      const response = await api('/rentals/request', 'POST', { itemId: item._id });
      
      // Update local state to show request has been sent
      setHasRequestedBefore(true);
      
      Alert.alert(
        "Request Sent! 🎉", 
        `Your rental request for "${item.name}" has been sent to the owner. You'll be notified when they respond.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("[RENTAL_REQUEST] Error:", error);
      
      // Handle specific error cases
      if (error.message.includes('already requested')) {
        Alert.alert("Already Requested", "You have already sent a request for this item.");
        setHasRequestedBefore(true);
      } else if (error.message.includes('own item')) {
        Alert.alert("Cannot Rent", "You cannot rent your own item.");
      } else {
        Alert.alert("Request Failed", error.message || "Could not submit your request. Please try again.");
      }
    } finally {
      setLoading(false);
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
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </ScrollView>

      {/* --- ENHANCED FOOTER --- */}
      {/* The footer will not show if the user is the owner of the item */}
      {!isOwner && (
        <View style={styles.footer}>
          <Text style={styles.price}>{`₹${item.price_per_day} / day`}</Text>
          
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
                <Text style={styles.rentButtonText}>Rent Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Show owner message if user owns this item */}
      {isOwner && (
        <View style={styles.ownerFooter}>
          <Text style={styles.ownerText}>📝 This is your listing</Text>
          <Text style={styles.ownerSubtext}>Other users can send you rental requests</Text>
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
  description: { fontSize: 16, color: '#34495e', lineHeight: 24 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  price: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  rentButton: { backgroundColor: '#E0BBE4', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, minWidth: 150, alignItems: 'center' },
  rentButtonDisabled: { backgroundColor: '#CED4DA' },
  rentButtonText: { color: '#4A235A', fontSize: 18, fontWeight: 'bold' },
  requestedButton: { backgroundColor: '#27AE60', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, minWidth: 150, alignItems: 'center' },
  requestedButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  ownerFooter: { padding: 20, backgroundColor: '#F8F9FA', borderTopWidth: 1, borderTopColor: '#E9ECEF', alignItems: 'center' },
  ownerText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  ownerSubtext: { fontSize: 14, color: '#7f8c8d', textAlign: 'center' },
});

export default ItemDetailScreen;