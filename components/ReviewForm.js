import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "./StarRating";
import api from "../utils/api";

const ReviewForm = ({
  itemId,
  existingReview = null,
  onSuccess = null,
  onCancel = null,
  visible = true,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(0);
      setComment("");
    }
    setErrors({});
  }, [existingReview]);

  const validateForm = () => {
    const newErrors = {};

    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (!comment.trim()) {
      newErrors.comment = "Please write a comment";
    } else if (comment.trim().length < 10) {
      newErrors.comment = "Comment must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let response;

      if (existingReview) {
        // Update existing review
        response = await api(`/reviews/${existingReview._id}`, "PUT", {
          rating,
          comment: comment.trim(),
        });
      } else {
        // Create new review
        response = await api("/reviews", "POST", {
          itemId,
          rating,
          comment: comment.trim(),
        });
      }

      if (onSuccess) {
        onSuccess(response.review);
      }

      // Reset form if creating new review
      if (!existingReview) {
        setRating(0);
        setComment("");
      }

      Alert.alert(
        "Success",
        existingReview
          ? "Review updated successfully!"
          : "Review submitted successfully!",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to submit review. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setRating(existingReview?.rating || 0);
      setComment(existingReview?.comment || "");
      setErrors({});
    }
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {existingReview ? "Edit Review" : "Write a Review"}
            </Text>
            {onCancel && (
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            )}
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rating *</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={rating}
                size={32}
                onRatingChange={setRating}
                color="#FFD700"
                emptyColor="#DDD"
              />
              <Text style={styles.ratingText}>
                {rating > 0 ? `${rating} out of 5 stars` : "Tap to rate"}
              </Text>
            </View>
            {errors.rating && (
              <Text style={styles.errorText}>{errors.rating}</Text>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review *</Text>
            <TextInput
              style={[styles.commentInput, errors.comment && styles.errorInput]}
              placeholder="Share your experience with this item..."
              placeholderTextColor="#A9A9A9"
              value={comment}
              onChangeText={(text) => {
                setComment(text);
                if (errors.comment) {
                  setErrors((prev) => ({ ...prev, comment: null }));
                }
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={styles.commentFooter}>
              {errors.comment && (
                <Text style={styles.errorText}>{errors.comment}</Text>
              )}
              <Text style={styles.charCount}>
                {comment.length}/500 characters
              </Text>
            </View>
          </View>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Review Guidelines:</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and constructive{"\n"}• Focus on the item's condition
              and quality{"\n"}• Avoid personal information{"\n"}• Be respectful
              to other users
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {existingReview ? "Update Review" : "Submit Review"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: "flex-start",
  },
  ratingText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2c3e50",
    backgroundColor: "#f8f9fa",
    minHeight: 100,
  },
  errorInput: {
    borderColor: "#e74c3c",
  },
  commentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: "#95a5a6",
    textAlign: "right",
  },
  errorText: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 4,
  },
  guidelines: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#957DAD",
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 6,
  },
  guidelinesText: {
    fontSize: 12,
    color: "#7f8c8d",
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#95a5a6",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#7f8c8d",
    fontSize: 16,
    fontWeight: "500",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#957DAD",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#CED4DA",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ReviewForm;
