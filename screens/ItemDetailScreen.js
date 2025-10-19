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
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useRental } from "../context/RentalContext";
import StyledTextInput from "../components/StyledTextInput";
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import api from '../utils/api';

const { width } = Dimensions.get("window");

const ItemDetailScreen = ({ route, navigation }) => {
  const { item: initialItem } = route.params;
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const { getRentalStatus, checkRentalStatus, submitRentalRequest, loading: rentalLoading } = useRental();

  const [loading, setLoading] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [itemData, setItemData] = useState(initialItem);
  
  // State for reviews preview
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // State for calendar modal
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customMessage, setCustomMessage] = useState("");

  const scrollViewRef = useRef(null);

  const imageGallery =
    itemData.images && itemData.images.length > 0
      ? itemData.images
      : [itemData.imageUrl].filter(Boolean);

  const itemOwner = typeof itemData.user === 'object' ? itemData.user : { _id: itemData.user, name: 'Owner' };
  const isOwner = user?.id === itemOwner._id;

  const fetchTopReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const data = await api(`/reviews/item/${initialItem._id}?page=1&limit=2`);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to fetch top reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  }, [initialItem._id]);

  useEffect(() => {
    fetchTopReviews();
    const initializeScreen = async () => {
      if (!isOwner) {
        await checkRentalStatus(initialItem._id);
      }
      setCheckingRequest(false);
    };
    initializeScreen();
  }, [initialItem._id, isOwner, checkRentalStatus, fetchTopReviews]);

  const handleOpenRentalModal = () => {
    if (!itemData.isAvailable)
      return Alert.alert("Not Available", "This item is currently not available.");
    if (isOwner) return Alert.alert("Info", "This is your own item.");

    if (itemData.listingType === "sell") {
      handleSubmitRequest();
    } else {
      setCalendarVisible(true);
    }
  };

  const handleAskDetails = () => {
    if (isOwner) {
      Alert.alert("Info", "This is your own item.");
      return;
    }
    navigation.navigate('Chat', {
      participantId: itemOwner._id,
      itemId: itemData._id,
      participantName: itemOwner.name,
    });
  };

  const handleDayPress = (day) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
      setSelectedDates({
        [day.dateString]: { startingDay: true, color: "#957DAD", textColor: "white" },
      });
    } else {
      let newSelectedDates = {};
      let current = new Date(startDate);
      let end = new Date(day.dateString);

      if (current > end) {
        [current, end] = [end, current];
        setStartDate(end.toISOString().split("T")[0]);
        setEndDate(current.toISOString().split("T")[0]);
      } else {
        setEndDate(day.dateString);
      }

      let tempDate = new Date(current);
      while (tempDate <= end) {
        const dateString = tempDate.toISOString().split("T")[0];
        newSelectedDates[dateString] = { color: "#E0BBE4", textColor: "#4A235A" };
        tempDate.setDate(tempDate.getDate() + 1);
      }

      const startString = current.toISOString().split("T")[0];
      const endString = end.toISOString().split("T")[0];

      newSelectedDates[startString] = { ...newSelectedDates[startString], startingDay: true };
      newSelectedDates[endString] = { ...newSelectedDates[endString], endingDay: true };
      setSelectedDates(newSelectedDates);
    }
  };

  const handleSubmitRequest = async () => {
    if (itemData.listingType === "rent" && (!startDate || !endDate)) {
      return Alert.alert("Date Required", "Please select a start and end date for your rental.");
    }
    setLoading(true);
    setCalendarVisible(false);
    try {
      const result = await submitRentalRequest(itemData._id, startDate, endDate, customMessage);
      if (result.success) {
        Alert.alert("Request Sent!", "Your request has been sent to the owner.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert("Request Failed", result.message);
      }
    } catch (error) {
      Alert.alert("Request Failed", "Could not submit your request.");
    } finally {
      setLoading(false);
      setStartDate(null);
      setEndDate(null);
      setSelectedDates({});
      setCustomMessage("");
    }
  };

  const handleWishlistToggle = () => {
    if (isOwner) return;
    toggleWishlist(itemData);
  };

  const handleImageScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentImageIndex(currentIndex);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleImageScroll} scrollEventThrottle={16}>
            {imageGallery.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri: uri || "https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image" }}
                  style={styles.image}
                />
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

          <TouchableOpacity 
            style={styles.ownerSection}
            onPress={() => navigation.navigate('UserProfile', { userId: itemOwner._id })}
          >
            <Ionicons name="person-circle-outline" size={20} color="#7f8c8d" />
            <Text style={styles.ownerName}>{itemOwner.name}</Text>
            <StarRating rating={itemOwner.averageRating || 0} size={16} disabled />
            <Text style={styles.ownerRating}>({itemOwner.totalRatings || 0})</Text>
          </TouchableOpacity>

          <Text style={styles.description}>{itemData.description}</Text>
        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Item Reviews ({itemData.totalReviews})</Text>
          {reviewsLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : reviews.length > 0 ? (
            <>
              {reviews.map(review => <ReviewCard key={review._id} review={review} />)}
              {itemData.totalReviews > 2 && (
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => navigation.navigate('AllReviews', { 
                    itemId: itemData._id, 
                    averageRating: itemData.averageRating, 
                    totalReviews: itemData.totalReviews 
                  })}
                >
                  <Text style={styles.seeAllButtonText}>See All {itemData.totalReviews} Reviews</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noReviewsText}>Be the first to review this item!</Text>
          )}
        </View>

      </ScrollView>

      {/* FOOTER AREA */}
      {!isOwner && (
        <SafeAreaView style={styles.footerSafeArea} edges={["bottom"]}>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.wishlistButton} onPress={handleWishlistToggle} disabled={wishlistLoading}>
              <Ionicons
                name={isInWishlist(itemData._id) ? "heart" : "heart-outline"}
                size={28}
                color={isInWishlist(itemData._id) ? "#E74C3C" : "#2c3e50"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.askButton} onPress={handleAskDetails}>
              <Text style={styles.askButtonText}>Ask Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                getRentalStatus(itemData._id) ? styles.requestedButton : styles.rentButton,
                (!itemData.isAvailable || loading || checkingRequest || getRentalStatus(itemData._id)) && styles.rentButtonDisabled,
              ]}
              onPress={handleOpenRentalModal}
              disabled={!itemData.isAvailable || loading || checkingRequest || getRentalStatus(itemData._id)}
            >
              {loading || checkingRequest ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.rentButtonText}>
                  {getRentalStatus(itemData._id)
                    ? "Requested"
                    : itemData.isAvailable
                    ? itemData.listingType === "sell" ? "Buy Now" : "Rent Now"
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
            <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate("EditItem", { item: itemData })}>
              <Ionicons name="settings-outline" size={20} color="#957DAD" />
              <Text style={styles.manageButtonText}>Manage Listing</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Calendar Modal */}
      <Modal animationType="slide" transparent={true} visible={isCalendarVisible} onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Rental Dates</Text>
            <Calendar onDayPress={handleDayPress} markedDates={{ ...selectedDates }} markingType={"period"} minDate={new Date().toISOString().split("T")[0]} />
            <StyledTextInput label="Add a message (optional)" value={customMessage} onChangeText={setCustomMessage} placeholder="Hi! I'd like to rent this item..." multiline />
            <TouchableOpacity style={styles.modalButton} onPress={handleSubmitRequest} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Confirm Request</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setCalendarVisible(false)}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { paddingBottom: 120 },
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
  detailsContainer: { paddingHorizontal: 20, paddingTop: 20 },
  name: { fontSize: 28, fontWeight: "bold", color: "#2c3e50", marginBottom: 4 },
  category: { fontSize: 16, color: "#7f8c8d", marginBottom: 15 },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 15,
  },
  ownerName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  ownerRating: {
    marginLeft: 5,
    fontSize: 14,
    color: '#7f8c8d',
  },
  description: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
    marginBottom: 20,
  },
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
  },
  ownerFooter: { padding: 20, borderTopWidth: 1, borderTopColor: "#E9ECEF" },
  wishlistButton: { padding: 10 },
  askButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#957DAD',
  },
  askButtonText: {
    color: '#957DAD',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceSection: { flexDirection: "row", alignItems: "baseline" },
  price: { fontSize: 24, fontWeight: "bold", color: "#2c3e50" },
  priceLabel: { fontSize: 14, color: "#7f8c8d", marginLeft: 2 },
  rentButton: {
    backgroundColor: "#957DAD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  rentButtonDisabled: { backgroundColor: "#CED4DA" },
  rentButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  requestedButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
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
  reviewsSection: { 
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 20,
    marginBottom: 20,
  },
  seeAllButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  seeAllButtonText: {
    color: '#957DAD',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  modalButton: {
    backgroundColor: "#957DAD",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  modalCancelButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelButtonText: { color: "#7f8c8d", fontSize: 16 },
});

export default ItemDetailScreen;