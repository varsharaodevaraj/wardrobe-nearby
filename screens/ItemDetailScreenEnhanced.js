import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, Dimensions, Switch, Image, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../context/FollowContext';
import { useRental } from '../context/RentalContext';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';
import StarRating from '../components/StarRating';

const { width } = Dimensions.get('window');

const ItemDetailScreenEnhanced = ({ route, navigation }) => {
  const { item, focusReview = false } = route.params;
  const { user } = useAuth();
  const { isFollowing, toggleFollow, checkFollowStatus, loading: followLoading } = useFollow();
  const { getRentalStatus, checkRentalStatus, submitRentalRequest, loading: rentalLoading } = useRental();
  const [loading, setLoading] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [itemData, setItemData] = useState(item);
  
  // Review-related state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);
  const scrollViewRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  
  // Handle both old and new image formats - use images array if available, fallback to single imageUrl
  const imageGallery = itemData.images && itemData.images.length > 0 
    ? itemData.images 
    : [itemData.imageUrl].filter(Boolean);
  const featuredIndex = itemData.featuredImageIndex || 0;
  
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
        // Check existing rental request using context
        await checkRentalStatus(item._id);

        // Check follow status using global context
        if (itemOwnerId) {
          await checkFollowStatus(itemOwnerId);
        }
      } catch (error) {
        console.error('[ITEM_DETAIL_ENHANCED] Error initializing screen:', error);
      } finally {
        setCheckingRequest(false);
      }
    };

    if (!isOwner) {
      initializeScreen();
    } else {
      setCheckingRequest(false);
    }
  }, [item._id, isOwner, checkFollowStatus, checkRentalStatus]);

  // Auto-scroll to reviews section when focusReview is true
  useEffect(() => {
    if (focusReview && reviewsSectionRef.current && scrollViewRef.current) {
      const timer = setTimeout(() => {
        reviewsSectionRef.current.measure((x, y, width, height, pageX, pageY) => {
          scrollViewRef.current.scrollTo({ y: pageY - 100, animated: true });
        });
      }, 500); // Wait for component to render

      return () => clearTimeout(timer);
    }
  }, [focusReview]);

  const handleRentNow = async () => {
    console.log('🎯 [ENHANCED] handleRentNow called');
    console.log('🎯 [ENHANCED] isOwner:', isOwner);
    console.log('🎯 [ENHANCED] item.listingType:', item.listingType);
    
    if (isOwner) {
      Alert.alert("Info", "This is your own item. You can manage it from your profile.");
      return;
    }

    // Show message input dialog
    const isForSale = item.listingType === 'sell';
    const actionText = isForSale ? "Purchase Request" : "Rental Request";
    const priceText = isForSale ? `₹${item.price_per_day}` : `₹${item.price_per_day}/${item.rentalDuration || 'day'}`;
    
    console.log('🎯 [ENHANCED] About to show Alert for request');
    
    // Show confirmation first, then ask for message
    Alert.alert(
      `Send ${actionText}`,
      `${isForSale ? 'Interested in buying' : 'Requesting'} "${item.name}" for ${priceText}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send Request", 
          onPress: () => {
            console.log('🎯 [ENHANCED] Alert onPress called, submitting request');
            handleSubmitRequest("");
          }
        }
      ]
    );
  };

  const handleSubmitRequest = async (customMessage = "") => {
    console.log('🚀 [ENHANCED] handleSubmitRequest called with message:', customMessage);
    setLoading(true);
    
    try {
      const result = await submitRentalRequest(item._id, customMessage);
      
      if (result.success) {
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
      } else {
        // Handle error from context
        if (result.message.includes('already sent a request')) {
          const requestType = item.listingType === 'sell' ? 'purchase request' : 'rental request';
          Alert.alert("Already Requested", `You have already sent a ${requestType} for this item. Please wait for the owner to respond.`);
        } else {
          Alert.alert("Request Failed", result.message);
        }
      }
    } catch (error) {
      console.error("[RENTAL_REQUEST] Error:", error);
      Alert.alert("Request Failed", "Could not submit your request. Please try again.");
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

  const handleAvailabilityToggle = async () => {
    try {
      setLoading(true);
      const updatedItem = await api(`/items/${itemData._id}`, 'PUT', {
        isAvailable: !itemData.isAvailable
      });
      setItemData(updatedItem);
      Alert.alert(
        "Status Updated", 
        `Item is now ${updatedItem.isAvailable ? 'available' : 'unavailable'} for ${itemData.listingType === 'rent' ? 'rent' : 'sale'}.`
      );
    } catch (error) {
      console.error('[AVAILABILITY_TOGGLE] Error:', error);
      Alert.alert("Error", "Could not update availability status.");
    } finally {
      setLoading(false);
    }
  };

  const renderImageItem = ({ item: imageUrl, index }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ 
          uri: imageUrl || 'https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image'
        }}
        style={styles.image}
        resizeMode="cover"
      />
      {index === featuredIndex && imageGallery.length > 1 && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={16} color="white" />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
    </View>
  );

  const renderImageIndicator = () => {
    if (imageGallery.length <= 1) return null;
    
    return (
      <View style={styles.imageIndicatorContainer}>
        {imageGallery.map((_, index) => (
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
      <ScrollView ref={scrollViewRef}>
        {/* Enhanced Image Section with Slideshow */}
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.imageScrollContainer}
          >
            {imageGallery.map((item, index) => renderImageItem({ item, index }))}
          </ScrollView>
          
          {/* Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Image Counter */}
          {imageGallery.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {imageGallery.length}
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

          {/* Item Header */}
          <View style={styles.headerSection}>
            <Text style={styles.name}>{itemData.name}</Text>
            <Text style={styles.category}>{itemData.category}</Text>
            
            {/* Availability Status */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge, 
                itemData.isAvailable ? styles.availableBadge : styles.unavailableBadge
              ]}>
                <Text style={[
                  styles.statusText,
                  itemData.isAvailable ? styles.availableText : styles.unavailableText
                ]}>
                  {itemData.isAvailable ? '✅ Available' : '❌ Not Available'}
                </Text>
              </View>
              
              {/* Listing Type Badge */}
              <View style={styles.listingTypeBadge}>
                <Text style={styles.listingTypeText}>
                  {itemData.listingType === 'rent' ? '🏷️ For Rent' : '💰 For Sale'}
                </Text>
              </View>
            </View>
          </View>

          {/* Owner Section */}
          <View style={styles.ownerSection}>
            <Text style={styles.ownerLabel}>Listed by</Text>
            <Text style={styles.ownerName}>
              {typeof itemData.user === 'object' ? itemData.user.name : 'Unknown User'}
            </Text>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{itemData.description}</Text>
          </View>

          {/* Reason for Selling Section */}
          {itemData.reasonForSelling && itemData.reasonForSelling.trim() && (
            <View style={styles.reasonSection}>
              <Text style={styles.sectionTitle}>
                {itemData.listingType === 'rent' ? 'Reason for Renting' : 'Reason for Selling'}
              </Text>
              <Text style={styles.reasonText}>{itemData.reasonForSelling}</Text>
            </View>
          )}

          {/* Owner Controls */}
          {isOwner && (
            <View style={styles.ownerControls}>
              <Text style={styles.sectionTitle}>Item Management</Text>
              
              <View style={styles.availabilityToggle}>
                <Text style={styles.toggleLabel}>
                  Available for {itemData.listingType === 'rent' ? 'rent' : 'sale'}
                </Text>
                <Switch
                  value={itemData.isAvailable}
                  onValueChange={handleAvailabilityToggle}
                  trackColor={{ false: '#CCC', true: '#E0BBE4' }}
                  thumbColor={itemData.isAvailable ? '#957DAD' : '#FFF'}
                  disabled={loading}
                />
              </View>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#7f8c8d" />
              <Text style={styles.infoText}>
                Listed on {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Reviews Section */}
          <View ref={reviewsSectionRef} style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={24} color="#957DAD" />
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            </View>
            
            <ReviewsList
              itemId={item._id}
              onWriteReview={() => setShowReviewForm(true)}
              onEditReview={(review) => {
                setEditingReview(review);
                setShowReviewForm(true);
              }}
              refreshTrigger={reviewsRefreshTrigger}
              highlightWriteReview={focusReview}
              isOwner={isOwner}
            />
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
          
          {checkingRequest ? (
            <View style={styles.rentButton}>
              <ActivityIndicator color="#4A235A" />
            </View>
          ) : getRentalStatus(item._id) ? (
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
                  <Ionicons name={item.listingType === 'sell' ? "card-outline" : "bag-handle-outline"} size={20} color="white" />
                  <Text style={styles.rentButtonText}>{item.listingType === 'sell' ? 'Buy Now' : 'Rent Now'}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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

      {/* Review Form Modal */}
      <Modal
        visible={showReviewForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowReviewForm(false);
          setEditingReview(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ReviewForm
            itemId={item._id}
            existingReview={editingReview}
            onSuccess={(review) => {
              setShowReviewForm(false);
              setEditingReview(null);
              setReviewsRefreshTrigger(prev => prev + 1);
            }}
            onCancel={() => {
              setShowReviewForm(false);
              setEditingReview(null);
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  imageSection: { position: 'relative' },
  imageScrollContainer: { paddingHorizontal: 0 },
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
  category: { fontSize: 16, color: '#7f8c8d', marginBottom: 20 },
  
  // Description Section Styles
  descriptionSection: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  description: { 
    fontSize: 16, 
    color: '#34495e', 
    lineHeight: 24,
  },

  // Ratings Section Styles
  ratingsSection: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  ratingOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingScore: {
    alignItems: 'center',
    flex: 1,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  ratingBars: {
    flex: 2,
    marginLeft: 20,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#2c3e50',
    width: 12,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f2f6',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  ratingPercent: {
    fontSize: 12,
    color: '#7f8c8d',
    width: 30,
    textAlign: 'right',
  },

  // Reviews Section Styles
  reviewsSection: {
    marginBottom: 25,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0BBE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    color: '#4A235A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 6,
  },
  reviewDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  viewAllReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0BBE4',
    borderRadius: 25,
    marginTop: 8,
  },
  viewAllReviewsText: {
    fontSize: 16,
    color: '#957DAD',
    fontWeight: '500',
    marginRight: 4,
  },
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
  // New styles for enhanced features
  headerSection: { marginBottom: 15 },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  availableBadge: { backgroundColor: '#E8F5E8' },
  unavailableBadge: { backgroundColor: '#FFF2F2' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  availableText: { color: '#2E7D32' },
  unavailableText: { color: '#D32F2F' },
  listingTypeBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  listingTypeText: { fontSize: 12, fontWeight: 'bold', color: '#7B1FA2' },
  ownerSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  ownerLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 5 },
  ownerName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  reasonSection: { marginBottom: 20 },
  reasonText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  ownerControls: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  availabilityToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: '500',
  },
  
  // Reviews Section Styles
  reviewsSection: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default ItemDetailScreenEnhanced;
