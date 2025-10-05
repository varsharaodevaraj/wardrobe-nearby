import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, Dimensions, Switch, Image, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useRental } from '../context/RentalContext';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';

const { width } = Dimensions.get('window');

const ItemDetailScreen = ({ route, navigation }) => {
  const { item, focusReview = false } = route.params;
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const { getRentalStatus, checkRentalStatus, submitRentalRequest, loading: rentalLoading } = useRental();
  const [loading, setLoading] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [itemData, setItemData] = useState(item);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);
  const scrollViewRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  
  const imageGallery = itemData.images && itemData.images.length > 0 
    ? itemData.images 
    : [itemData.imageUrl].filter(Boolean);
  
  const itemOwnerId = typeof item.user === 'object' ? item.user._id : item.user;
  const isOwner = user?.id === itemOwnerId;

  useEffect(() => {
    const initializeScreen = async () => {
      if (isOwner) {
        setCheckingRequest(false);
        return;
      }
      try {
        await checkRentalStatus(item._id);
      } catch (error) {
        console.error('[ITEM_DETAIL] Error initializing screen:', error);
      } finally {
        setCheckingRequest(false);
      }
    };
    if (!isOwner) {
      initializeScreen();
    } else {
      setCheckingRequest(false);
    }
  }, [item._id, isOwner, checkRentalStatus]);

  const handleRentNow = async () => {
    if (!itemData.isAvailable) return Alert.alert("Not Available", "This item is currently not available.");
    if (isOwner) return Alert.alert("Info", "This is your own item.");

    const isForSale = item.listingType === 'sell';
    const actionText = isForSale ? "Purchase Request" : "Rental Request";
    const priceText = isForSale ? `₹${item.price_per_day}` : `₹${item.price_per_day}/${item.rentalDuration || 'day'}`;
    
    Alert.alert(`Send ${actionText}`, `Requesting "${item.name}" for ${priceText}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Send Request", onPress: () => handleSubmitRequest() },
    ]);
  };

  const handleSubmitRequest = async () => {
    setLoading(true);
    try {
      const result = await submitRentalRequest(item._id);
      if (result.success) {
        Alert.alert("Request Sent!", "Your request has been sent to the owner.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Request Failed", result.message);
      }
    } catch (error) {
      Alert.alert("Request Failed", "Could not submit your request.");
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = () => {
    if (isOwner) return;
    toggleWishlist(item);
  };

  const handleImageScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentImageIndex(currentIndex);
  };

  const handleAvailabilityToggle = async () => {
    setLoading(true);
    try {
      const updatedItem = await api(`/items/${itemData._id}`, 'PUT', { isAvailable: !itemData.isAvailable });
      setItemData(updatedItem);
      Alert.alert("Status Updated", `Item is now ${updatedItem.isAvailable ? 'available' : 'unavailable'}.`);
    } catch (error) {
      Alert.alert("Error", "Could not update availability status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleImageScroll} scrollEventThrottle={16}>
            {imageGallery.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: uri || 'https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image' }} style={styles.image} />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          {imageGallery.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{currentImageIndex + 1} / {imageGallery.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{itemData.name}</Text>
          <Text style={styles.category}>{itemData.category}</Text>
          {/* ... other details ... */}
        </View>
      </ScrollView>

      {/* FOOTER AREA */}
      {!isOwner && (
        <SafeAreaView style={styles.footerSafeArea} edges={['bottom']}>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.wishlistButton} onPress={handleWishlistToggle} disabled={wishlistLoading}>
              <Ionicons name={isInWishlist(item._id) ? "heart" : "heart-outline"} size={28} color={isInWishlist(item._id) ? "#E74C3C" : "#2c3e50"} />
            </TouchableOpacity>
            <View style={styles.priceSection}>
              <Text style={styles.price}>₹{item.price_per_day}</Text>
              <Text style={styles.priceLabel}>{item.listingType === 'sell' ? '' : `/${item.rentalDuration || 'day'}`}</Text>
            </View>
            <TouchableOpacity 
              style={[ getRentalStatus(item._id) ? styles.requestedButton : styles.rentButton, (!itemData.isAvailable || loading || getRentalStatus(item._id)) && styles.rentButtonDisabled ]} 
              onPress={handleRentNow} 
              disabled={!itemData.isAvailable || loading || getRentalStatus(item._id)}>
              {loading ? <ActivityIndicator color="white" /> : (
                <Text style={styles.rentButtonText}>
                  {getRentalStatus(item._id) ? "Requested" : (itemData.isAvailable ? (item.listingType === 'sell' ? 'Buy Now' : 'Rent Now') : 'Unavailable')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
      
      {isOwner && (
        <SafeAreaView style={styles.footerSafeArea} edges={['bottom']}>
          <View style={styles.ownerFooter}>
            <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('EditItem', { item: itemData })}>
              <Ionicons name="settings-outline" size={20} color="#957DAD" />
              <Text style={styles.manageButtonText}>Manage Listing</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 100 }, // Padding to ensure content is not hidden by footer
  imageSection: { height: 400 },
  imageContainer: { width, height: 400 },
  image: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  imageCounter: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  imageCounterText: { color: 'white', fontSize: 14, fontWeight: '500' },
  detailsContainer: { paddingHorizontal: 20, paddingTop: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  category: { fontSize: 16, color: '#7f8c8d', marginBottom: 15 },
  footerSafeArea: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  ownerFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  wishlistButton: { padding: 10 },
  priceSection: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  priceLabel: { fontSize: 14, color: '#7f8c8d', marginLeft: 2 },
  rentButton: { backgroundColor: '#957DAD', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
  rentButtonDisabled: { backgroundColor: '#CED4DA' },
  rentButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  requestedButton: { backgroundColor: '#27AE60', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
  manageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#E0BBE4', borderRadius: 30 },
  manageButtonText: { marginLeft: 6, fontSize: 16, color: '#957DAD', fontWeight: '500' },
});

export default ItemDetailScreen;