import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const CLOUDINARY_CLOUD_NAME = "dv9uxenrx";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

const AddStoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!user?.id) return;
      try {
        const data = await api(`/items/user/${user.id}`);
        setMyListings(data);
      } catch (error) {
        console.error("Failed to fetch listings for tagging:", error);
      }
    };
    fetchMyListings();
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert(
        "Permission Required",
        "Please grant photo library access."
      );
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.7,
      });
      if (!result.canceled) setImage(result.assets[0]);
    } catch (error) {
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const handlePostStory = async () => {
    if (!image) return Alert.alert("No Image", "Please select an image.");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: `image/${image.uri.split(".").pop()}`,
        name: `story_${Date.now()}`,
      });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const cloudinaryData = await cloudinaryResponse.json();
      if (cloudinaryData.error) throw new Error(cloudinaryData.error.message);

      const imageUrl = cloudinaryData.secure_url;

      await api("/stories", "POST", {
        imageUrl,
        linkedItemId: selectedItem?._id,
      });

      Alert.alert("Success!", "Your story has been posted!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to post your story.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={32} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons name="camera-outline" size={50} color="#957DAD" />
              <Text style={styles.imagePickerText}>Select a Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* --- THIS IS THE FIXED FOOTER --- */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="pricetag-outline" size={20} color="#34495e" />
          <Text style={styles.linkButtonText}>
            {selectedItem ? selectedItem.name : "Link an Item"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handlePostStory}
          disabled={!image || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Post Story</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select an Item to Link</Text>
            <FlatList
              data={myListings}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setSelectedItem(item);
                    setModalVisible(false);
                  }}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                  />
                  <Text style={styles.itemName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>You have no items to link.</Text>
              }
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imagePicker: {
    width: "90%",
    aspectRatio: 9 / 16,
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
    marginTop: 10,
    color: "#957DAD",
    fontSize: 16,
    fontWeight: "500",
  },
  imagePreview: { width: "100%", height: "100%", borderRadius: 14 },
  // --- NEW FOOTER STYLES ---
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 15,
  },
  linkButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  submitButton: {
    backgroundColor: "#957DAD",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: "#CED4DA" },
  submitButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  // Modal Styles
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
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  itemImage: { width: 40, height: 40, borderRadius: 8, marginRight: 15 },
  itemName: { fontSize: 16 },
  emptyText: { textAlign: "center", color: "#7f8c8d", padding: 20 },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#ecf0f1",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  closeButtonText: { fontSize: 16, fontWeight: "bold" },
});

export default AddStoryScreen;