import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReviewCard from "./ReviewCard";
import StarRating from "./StarRating";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ReviewsList = ({
  itemId,
  onWriteReview = null,
  onEditReview = null,
  refreshTrigger = 0,
  highlightWriteReview = false, // New prop to highlight the write review section
  isOwner = false, // New prop to check if current user owns the item
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({});
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReviews = useCallback(
    async (page = 1, refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await api(
          `/reviews/item/${itemId}?page=${page}&limit=10&sort=${sortBy}`
        );

        if (page === 1 || refresh) {
          setReviews(response.reviews);
        } else {
          setReviews((prev) => [...prev, ...response.reviews]);
        }

        setPagination(response.pagination);
        setAverageRating(response.averageRating);
        setTotalReviews(response.totalReviews);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        Alert.alert("Error", "Failed to load reviews. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [itemId, sortBy]
  );

  // Check review permission
  const checkReviewPermission = useCallback(async () => {
    if (!user?.id) {
      setCanWriteReview(false);
      setReviewPermissionMessage("Please log in to write a review");
      return;
    }

    // If user owns the item, they cannot write a review
    if (isOwner) {
      setCanWriteReview(false);
      setReviewPermissionMessage("You cannot review your own item");
      return;
    }

    try {
      const response = await api(`/reviews/can-review/${itemId}`);
      setCanWriteReview(response.canReview);
      setReviewPermissionMessage(response.message);
    } catch (error) {
      console.error("Error checking review permission:", error);
      setCanWriteReview(false);
      setReviewPermissionMessage("Unable to check review permission");
    }
  }, [user?.id, itemId, isOwner]);

  // Fetch reviews on component mount and when dependencies change
  useEffect(() => {
    fetchReviews(1);
    checkReviewPermission();
  }, [fetchReviews, checkReviewPermission, refreshTrigger]);

  const handleRefresh = () => {
    fetchReviews(1, true);
    checkReviewPermission();
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchReviews(currentPage + 1);
    }
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await api(`/reviews/${reviewId}/helpful`, "POST");
      // Update the review in the list
      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? { ...review, helpfulCount: (review.helpfulCount || 0) + 1 }
            : review
        )
      );
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      Alert.alert("Error", "Failed to mark review as helpful");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api(`/reviews/${reviewId}`, "DELETE");

      // Remove review from list
      setReviews((prev) => prev.filter((review) => review._id !== reviewId));
      setTotalReviews((prev) => prev - 1);
      checkReviewPermission(); // Refresh permission after deleting review

      Alert.alert("Success", "Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      Alert.alert("Error", "Failed to delete review");
    }
  };

  const handleEditReview = (review) => {
    if (onEditReview) {
      onEditReview(review);
    }
  };

  const updateReviewInList = (updatedReview) => {
    setReviews((prev) =>
      prev.map((review) =>
        review._id === updatedReview._id ? updatedReview : review
      )
    );
  };

  const addReviewToList = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
    setTotalReviews((prev) => prev + 1);
    checkReviewPermission(); // Refresh permission after adding review
  };

  // Check if current user can write a review
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [reviewPermissionMessage, setReviewPermissionMessage] = useState("");

  // Removed renderReviewItem since we're now using direct mapping

  const renderSortButton = (sortType, label) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === sortType && styles.sortButtonActive,
      ]}
      onPress={() => handleSortChange(sortType)}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortBy === sortType && styles.sortButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Overall Rating */}
      <View style={styles.overallRating}>
        <View style={styles.ratingRow}>
          <StarRating
            rating={Math.round(averageRating)}
            size={24}
            disabled={true}
          />
          <Text style={styles.ratingNumber}>
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </Text>
        </View>
        <Text style={styles.totalReviews}>
          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </Text>
      </View>

      {/* Write Review Section */}
      {user && (
        <View style={styles.reviewPermissionSection}>
          {canWriteReview ? (
            onWriteReview && (
              <TouchableOpacity
                style={[
                  styles.writeReviewButton,
                  highlightWriteReview && styles.writeReviewButtonHighlight,
                ]}
                onPress={onWriteReview}
              >
                <Ionicons name="create-outline" size={18} color="white" />
                <Text style={styles.writeReviewText}>Write Review</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.permissionMessageContainer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#7f8c8d"
              />
              <Text style={styles.permissionMessageText}>
                {reviewPermissionMessage}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Sort Options */}
      {totalReviews > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            {renderSortButton("newest", "Newest")}
            {renderSortButton("oldest", "Oldest")}
            {renderSortButton("highest", "Highest Rated")}
            {renderSortButton("lowest", "Lowest Rated")}
          </View>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-outline" size={64} color="#BDC3C7" />
      <Text style={styles.emptyTitle}>No reviews yet</Text>
      <Text style={styles.emptyMessage}>
        Be the first to share your experience with this item!
      </Text>
      {canWriteReview && onWriteReview && (
        <TouchableOpacity
          style={styles.emptyWriteButton}
          onPress={onWriteReview}
        >
          <Text style={styles.emptyWriteButtonText}>
            Write the first review
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color="#957DAD" />
        <Text style={styles.loadingMoreText}>Loading more reviews...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#957DAD" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#957DAD"]}
            tintColor="#957DAD"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled={true}
      >
        {renderHeader()}

        {reviews.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                onMarkHelpful={handleMarkHelpful}
              />
            ))}

            {pagination.hasMore && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator color="#957DAD" />
                    <Text style={styles.loadingMoreText}>
                      Loading more reviews...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.loadMoreText}>Load More Reviews</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    color: "#7f8c8d",
    fontSize: 16,
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
  },
  overallRating: {
    alignItems: "center",
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginLeft: 12,
  },
  totalReviews: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  writeReviewButton: {
    backgroundColor: "#957DAD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  writeReviewText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  sortContainer: {
    marginTop: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 8,
    fontWeight: "500",
  },
  sortButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#ecf0f1",
    borderWidth: 1,
    borderColor: "#bdc3c7",
  },
  sortButtonActive: {
    backgroundColor: "#E0BBE4",
    borderColor: "#957DAD",
  },
  sortButtonText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  sortButtonTextActive: {
    color: "#4A235A",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#34495e",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyWriteButton: {
    backgroundColor: "#957DAD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyWriteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: "#7f8c8d",
  },
  listContent: {
    paddingBottom: 16,
  },
  loadMoreButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    marginHorizontal: 16,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#957DAD",
    fontSize: 16,
    fontWeight: "600",
  },
  reviewPermissionSection: {
    marginVertical: 12,
  },
  permissionMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  permissionMessageText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#7f8c8d",
    flex: 1,
  },
  writeReviewButtonHighlight: {
    backgroundColor: "#E8A87C", // Orange highlight color
    shadowColor: "#E8A87C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
});

export default ReviewsList;
