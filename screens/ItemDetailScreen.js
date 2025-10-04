import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Switch,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useRental } from "../context/RentalContext";
import ReviewsList from "../components/ReviewsList";
import ReviewForm from "../components/ReviewForm";
import StarRating from "../components/StarRating";

const { width } = Dimensions.get("window");

const ItemDetailScreen = ({ route, navigation }) => {
  const { item, focusReview = false } = route.params;
  const { user } = useAuth();
  const {
    isInWishlist,
    toggleWishlist,
    loading: wishlistLoading,
  } = useWishlist();
  const {
    getRentalStatus,
    checkRentalStatus,
    submitRentalRequest,
    loading: rentalLoading,
  } = useRental();
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

  const imageGallery =
    itemData.images && itemData.images.length > 0
      ? itemData.images
      : [itemData.imageUrl].filter(Boolean);
  const featuredIndex = itemData.featuredImageIndex || 0;

  const itemOwnerId = typeof item.user === "object" ? item.user._id : item.user;
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
        console.error("[ITEM_DETAIL] Error initializing screen:", error);
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

  useEffect(() => {
    if (focusReview && reviewsSectionRef.current && scrollViewRef.current) {
      const timer = setTimeout(() => {
        reviewsSectionRef.current.measure((x, y) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [focusReview]);

  const handleRentNow = async () => {
    if (!itemData.isAvailable) {
      Alert.alert("Not Available", "This item is currently not available.");
      return;
    }

    if (isOwner) {
      Alert.alert("Info", "This is your own item.");
      return;
    }

    const isForSale = item.listingType === "sell";
    const actionText = isForSale ? "Purchase Request" : "Rental Request";
    const priceText = isForSale
      ? `₹${item.price_per_day}`
      : `₹${item.price_per_day}/${item.rentalDuration || "day"}`;

    Alert.alert(
      `Send ${actionText}`,
      `Requesting "${item.name}" for ${priceText}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Request",
          onPress: () => handleSubmitRequest(""),
        },
      ]
    );
  };

  const handleSubmitRequest = async (customMessage = "") => {
    setLoading(true);
    try {
      const result = await submitRentalRequest(item._id, customMessage);

      if (result.success) {
        const requestType =
          item.listingType === "sell" ? "purchase request" : "rental request";
        Alert.alert("Request Sent!", `Your ${requestType} has been sent.`, [
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

  const handleWishlistToggle = async () => {
    if (isOwner) return;
    await toggleWishlist(item);
  };

  const handleImageScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentImageIndex(currentIndex);
  };

  const handleAvailabilityToggle = async () => {
    try {
      setLoading(true);
      const updatedItem = await api(`/items/${itemData._id}`, "PUT", {
        isAvailable: !itemData.isAvailable,
      });
      setItemData(updatedItem);
      Alert.alert(
        "Status Updated",
        `Item is now ${updatedItem.isAvailable ? "available" : "unavailable"}.`
      );
    } catch (error) {
      Alert.alert("Error", "Could not update availability status.");
    } finally {
      setLoading(false);
    }
  };

  const renderImageIndicator = () => {
    if (imageGallery.length <= 1) return null;
    return (
      <View style={styles.imageIndicatorContainer}>
        {imageGallery.map((_, index) => (
          <View
            key={index}
            style={[
              styles.imageIndicator,
              index === currentImageIndex && styles.activeImageIndicator,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          >
            {imageGallery.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{
                    uri:
                      uri ||
                      "https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image",
                  }}
                  style={styles.image}
                />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          {imageGallery.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {imageGallery.length}
              </Text>
            </View>
          )}
        </View>
        {renderImageIndicator()}

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{itemData.name}</Text>
          <Text style={styles.category}>{itemData.category}</Text>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                itemData.isAvailable
                  ? styles.availableBadge
                  : styles.unavailableBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  itemData.isAvailable
                    ? styles.availableText
                    : styles.unavailableText,
                ]}
              >
                {itemData.isAvailable ? "Available" : "Not Available"}
              </Text>
            </View>
            <View style={styles.listingTypeBadge}>
              <Text style={styles.listingTypeText}>
                {itemData.listingType === "rent" ? "For Rent" : "For Sale"}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{itemData.description}</Text>
          </View>

          {itemData.reasonForSelling && itemData.reasonForSelling.trim() && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {itemData.listingType === "rent"
                  ? "Reason for Renting"
                  : "Reason for Selling"}
              </Text>
              <Text style={styles.reasonText}>{itemData.reasonForSelling}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Listed by</Text>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerInitial}>
                  {item.user?.name
                    ? item.user.name.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
              <View>
                <Text style={styles.ownerName}>
                  {item.user?.name || "Unknown User"}
                </Text>
                {item.user?.status === "super-lender" && (
                  <Text style={styles.superLenderText}>Super Lender</Text>
                )}
              </View>
            </View>
          </View>

          {isOwner && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Item Management</Text>
              <View style={styles.availabilityToggle}>
                <Text style={styles.toggleLabel}>
                  Available for {itemData.listingType}
                </Text>
                <Switch
                  value={itemData.isAvailable}
                  onValueChange={handleAvailabilityToggle}
                  trackColor={{ false: "#CCC", true: "#E0BBE4" }}
                  thumbColor={itemData.isAvailable ? "#957DAD" : "#FFF"}
                  disabled={loading}
                />
              </View>
            </View>
          )}

          <View ref={reviewsSectionRef} style={styles.card}>
            <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
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

      {!isOwner && (
        <SafeAreaView style={styles.footerSafeArea} edges={["bottom"]}>
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={handleWishlistToggle}
              disabled={wishlistLoading}
            >
              <Ionicons
                name={isInWishlist(item._id) ? "heart" : "heart-outline"}
                size={28}
                color={isInWishlist(item._id) ? "#E74C3C" : "#2c3e50"}
              />
            </TouchableOpacity>
            <View style={styles.priceSection}>
              <Text style={styles.price}>₹{item.price_per_day}</Text>
              <Text style={styles.priceLabel}>
                {item.listingType === "sell"
                  ? ""
                  : `/${item.rentalDuration || "day"}`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.rentButton,
                (!itemData.isAvailable || loading) && styles.rentButtonDisabled,
              ]}
              onPress={handleRentNow}
              disabled={!itemData.isAvailable || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.rentButtonText}>
                  {itemData.isAvailable
                    ? item.listingType === "sell"
                      ? "Buy Now"
                      : "Rent Now"
                    : "Unavailable"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {isOwner && (
        <SafeAreaView style={styles.footerSafeArea} edges={["bottom"]}>
          <View style={styles.ownerFooter}>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate("EditItem", { item: itemData })}
            >
              <Ionicons name="settings-outline" size={20} color="#957DAD" />
              <Text style={styles.manageButtonText}>Manage Listing</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      <Modal
        visible={showReviewForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowReviewForm(false);
          setEditingReview(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
          <ReviewForm
            itemId={item._id}
            existingReview={editingReview}
            onSuccess={() => {
              setShowReviewForm(false);
              setEditingReview(null);
              setReviewsRefreshTrigger((p) => p + 1);
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
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { paddingBottom: 100 },
  imageSection: { height: 400 },
  imageContainer: { width, height: 400 },
  image: { width: "100%", height: "100%" },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  imageCounter: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: { color: "white", fontSize: 14, fontWeight: "500" },
  imageIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  activeImageIndicator: { backgroundColor: "#957DAD" },
  detailsContainer: { paddingHorizontal: 20, paddingTop: 10 },
  name: { fontSize: 28, fontWeight: "bold", color: "#2c3e50", marginBottom: 4 },
  category: { fontSize: 16, color: "#7f8c8d", marginBottom: 15 },
  statusContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  availableBadge: { backgroundColor: "#E8F5E8" },
  unavailableBadge: { backgroundColor: "#FFF2F2" },
  statusText: { fontSize: 12, fontWeight: "bold" },
  availableText: { color: "#2E7D32" },
  unavailableText: { color: "#D32F2F" },
  listingTypeBadge: {
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  listingTypeText: { fontSize: 12, fontWeight: "bold", color: "#7B1FA2" },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 10,
  },
  description: { fontSize: 16, color: "#34495e", lineHeight: 24 },
  reasonText: {
    fontSize: 16,
    color: "#7f8c8d",
    fontStyle: "italic",
    lineHeight: 24,
  },

  ownerInfo: { flexDirection: "row", alignItems: "center" },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0BBE4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ownerInitial: { color: "#4A235A", fontSize: 18, fontWeight: "bold" },
  ownerName: { fontSize: 16, fontWeight: "600", color: "#2c3e50" },
  superLenderText: {
    fontSize: 12,
    color: "#B7950B",
    fontWeight: "bold",
    marginTop: 2,
  },

  availabilityToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: { fontSize: 16, color: "#34495e" },

  footerSafeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    backgroundColor: "white",
  },
  wishlistButton: { padding: 10 },
  priceSection: { flexDirection: "row", alignItems: "baseline" },
  price: { fontSize: 24, fontWeight: "bold", color: "#2c3e50" },
  priceLabel: { fontSize: 14, color: "#7f8c8d", marginLeft: 2 },
  rentButton: {
    backgroundColor: "#957DAD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  rentButtonDisabled: { backgroundColor: "#CED4DA", opacity: 0.8 },
  rentButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  requestedButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  requestedButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },

  ownerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    backgroundColor: "white",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E0BBE4",
    borderRadius: 30,
  },
  manageButtonText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#957DAD",
    fontWeight: "500",
  },
});

export default ItemDetailScreen;