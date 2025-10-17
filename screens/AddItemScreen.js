import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import StyledTextInput from "../components/StyledTextInput";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const CLOUDINARY_CLOUD_NAME = "dv9uxenrx";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const MAX_IMAGES = 5;

const AddItemScreen = ({ navigation }) => {
  const [images, setImages] = useState([]);
  const [featuredImageId, setFeaturedImageId] = useState(null);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [listingType, setListingType] = useState("rent");
  const [rentalDuration, setRentalDuration] = useState("per day");
  const [customDuration, setCustomDuration] = useState("");
  const [reasonForSelling, setReasonForSelling] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const { user } = useAuth();

  const showImagePickerOptions = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(
        "Maximum Images Reached",
        `You can add up to ${MAX_IMAGES} photos per item.`
      );
      return;
    }

    Alert.alert("Add Photo", `Choose a source for your item's photo(s).`, [
      { text: "Take Photo", onPress: openCamera },
      { text: "Choose from Library", onPress: pickImagesFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera access is required to take photos."
      );
      return;
    }
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets) {
        const newImage = { ...result.assets[0], id: Date.now().toString() };
        setImages((prev) => [...prev, newImage]);
        if (!featuredImageId) {
          setFeaturedImageId(newImage.id);
        }
      }
    } catch (error) {
      console.error("Camera Error:", error);
      Alert.alert(
        "Error",
        "Could not open camera. Please check the console for details."
      );
    }
  };

  const pickImagesFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Photo library access is required to select photos."
      );
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: MAX_IMAGES - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => ({
          ...asset,
          id: `${Date.now()}_${Math.random()}`,
        }));

        setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));

        if (!featuredImageId && newImages.length > 0) {
          setFeaturedImageId(newImages[0].id);
        }
      }
    } catch (error) {
      console.error("Image Library Error:", error);
      Alert.alert(
        "Error",
        "Could not open photo library. Please check the console for details."
      );
    }
  };

  const removeImage = (imageId) => {
    const newImages = images.filter((img) => img.id !== imageId);
    setImages(newImages);
    if (featuredImageId === imageId) {
      setFeaturedImageId(newImages.length > 0 ? newImages[0].id : null);
    }
  };

  const handleSubmit = async () => {
    if (
      images.length === 0 ||
      !itemName ||
      !category ||
      !description ||
      !price
    ) {
      return Alert.alert(
        "Incomplete Form",
        "Please fill all required fields and add at least one image."
      );
    }
    setLoading(true);
    try {
      const uploadPromises = images.map((img) => {
        const formData = new FormData();
        formData.append("file", {
          uri: img.uri,
          type: `image/${img.uri.split(".").pop()}`,
          name: `item_${user.id}_${Date.now()}.${img.uri.split(".").pop()}`,
        });
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        return fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        ).then((response) => response.json());
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const uploadedImageUrls = uploadedImages.map((result) => {
        if (result.error) throw new Error(result.error.message);
        return result.secure_url;
      });

      const featuredImageIndex = images.findIndex(
        (img) => img.id === featuredImageId
      );

      const itemData = {
        name: itemName,
        category,
        description,
        price_per_day: parseFloat(price),
        listingType,
        rentalDuration:
          rentalDuration === "custom" ? customDuration : rentalDuration,
        reasonForSelling: reasonForSelling.trim(),
        isAvailable,
        imageUrl:
          uploadedImageUrls[featuredImageIndex !== -1 ? featuredImageIndex : 0],
        images: uploadedImageUrls,
        featuredImageIndex: featuredImageIndex !== -1 ? featuredImageIndex : 0,
      };

      await api("/items", "POST", itemData);

      Alert.alert("Success!", "Your item has been listed!", [
        {
          text: "OK",
          onPress: () => {
            setImages([]);
            setFeaturedImageId(null);
            setItemName("");
            setCategory("");
            setDescription("");
            setPrice("");
            setReasonForSelling("");
            setIsAvailable(true);
            navigation.navigate("Explore");
          },
        },
      ]);
    } catch (error) {
      console.error("[ADD_ITEM] Error:", error);
      Alert.alert(
        "Error",
        error.message || "An unexpected error occurred while uploading."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>List Your Item</Text>
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>
              Photos ({images.length}/{MAX_IMAGES})
            </Text>
            {images.length > 0 ? (
              <View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imageScrollContainer}
                >
                  {images.map((item) => (
                    <View key={item.id} style={styles.imageContainer}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.thumbnailImage}
                      />
                      {item.id === featuredImageId && (
                        <View style={styles.featuredBadge}>
                          <Text style={styles.featuredText}>Featured</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.setFeaturedButton}
                        onPress={() => setFeaturedImageId(item.id)}
                      >
                        <Ionicons
                          name="star"
                          size={16}
                          color={
                            item.id === featuredImageId ? "#FFD700" : "#CCC"
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(item.id)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#FF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                {images.length < MAX_IMAGES && (
                  <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={showImagePickerOptions}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={30}
                      color="#957DAD"
                    />
                    <Text style={styles.addMoreText}>Add More Photos</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={showImagePickerOptions}
              >
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#957DAD" />
                  <Text style={styles.imagePickerText}>Tap to add photos</Text>
                  <Text style={styles.imagePickerSubtext}>
                    Add up to {MAX_IMAGES} photos
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <StyledTextInput
            label="Item Name"
            value={itemName}
            onChangeText={setItemName}
          />
          <StyledTextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
          />
          <StyledTextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Listing Type</Text>
            <View style={styles.optionContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  listingType === "rent" && styles.optionButtonSelected,
                ]}
                onPress={() => setListingType("rent")}
              >
                <Ionicons
                  name={
                    listingType === "rent"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={listingType === "rent" ? "#957DAD" : "#7f8c8d"}
                />
                <Text
                  style={[
                    styles.optionText,
                    listingType === "rent" && styles.optionTextSelected,
                  ]}
                >
                  For Rent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  listingType === "sell" && styles.optionButtonSelected,
                ]}
                onPress={() => setListingType("sell")}
              >
                <Ionicons
                  name={
                    listingType === "sell"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={listingType === "sell" ? "#957DAD" : "#7f8c8d"}
                />
                <Text
                  style={[
                    styles.optionText,
                    listingType === "sell" && styles.optionTextSelected,
                  ]}
                >
                  For Sale
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {listingType === "rent" && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Rental Duration</Text>
              <View style={styles.durationContainer}>
                {["per day", "per week", "per month", "custom"].map(
                  (duration) => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationButton,
                        rentalDuration === duration &&
                          styles.durationButtonSelected,
                      ]}
                      onPress={() => setRentalDuration(duration)}
                    >
                      <Text
                        style={[
                          styles.durationText,
                          rentalDuration === duration &&
                            styles.durationTextSelected,
                        ]}
                      >
                        {duration === "custom" ? "Custom" : duration}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
              {rentalDuration === "custom" && (
                <StyledTextInput
                  label="Custom Duration"
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  placeholder="e.g., 3 days, 1 month"
                />
              )}
            </View>
          )}

          <StyledTextInput
            label={listingType === "rent" ? `Price (₹)` : "Sale Price (₹)"}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <StyledTextInput
            label="Reason for Selling/Renting (Optional)"
            value={reasonForSelling}
            onChangeText={setReasonForSelling}
            multiline
            placeholder="e.g., Outgrown, style change, etc."
          />

          <View style={styles.availabilityContainer}>
            <Text style={styles.sectionTitle}>Availability Status</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                Available for {listingType}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: "#CCC", true: "#E0BBE4" }}
                thumbColor={isAvailable ? "#957DAD" : "#FFF"}
              />
            </View>
            <Text style={styles.switchHint}>
              {isAvailable
                ? "✅ Item will be visible to others"
                : "❌ Item will be hidden from listings"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>List My Item</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  keyboardAvoidingView: { flex: 1 },
  scrollViewContent: { padding: 20 },
  imageScrollContainer: { paddingVertical: 10 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 20,
  },
  photosSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 12,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0BBE4",
    borderStyle: "dashed",
  },
  imagePickerPlaceholder: { justifyContent: "center", alignItems: "center" },
  imagePickerText: {
    color: "#957DAD",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  imagePickerSubtext: { color: "#957DAD", fontSize: 12, marginTop: 4 },
  imageContainer: { position: "relative", marginRight: 10 },
  thumbnailImage: { width: 100, height: 100, borderRadius: 8 },
  featuredBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: { fontSize: 10, fontWeight: "bold", color: "#FFD700" },
  setFeaturedButton: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 10,
    padding: 4,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 12,
  },
  addMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0BBE4",
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 10,
  },
  addMoreText: {
    marginTop: 5,
    color: "#957DAD",
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#957DAD",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: { backgroundColor: "#CED4DA" },
  submitButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  sectionContainer: { marginBottom: 20 },
  optionContainer: { flexDirection: "row", justifyContent: "space-around" },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "#ecf0f1",
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  optionButtonSelected: { backgroundColor: "#E0BBE4" },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  optionTextSelected: { color: "#4A235A" },
  durationContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#ecf0f1",
    alignItems: "center",
  },
  durationButtonSelected: { backgroundColor: "#E0BBE4" },
  durationText: { fontSize: 14, color: "#7f8c8d", fontWeight: "500" },
  durationTextSelected: { color: "#4A235A" },
  availabilityContainer: { marginBottom: 20 },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ecf0f1",
  },
  switchLabel: { fontSize: 16, color: "#34495e", fontWeight: "500" },
  switchHint: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 8,
  },
});

export default AddItemScreen;
