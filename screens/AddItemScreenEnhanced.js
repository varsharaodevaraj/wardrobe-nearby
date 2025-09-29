import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, 
  Alert, ActivityIndicator, Dimensions, FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CLOUDINARY_CLOUD_NAME = 'dv9uxenrx';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
const MAX_IMAGES = 5; // Maximum number of images per item

const AddItemScreenEnhanced = ({ navigation }) => {
  const [images, setImages] = useState([]); // Array of image objects
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const showImagePickerOptions = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Maximum Images', `You can only add up to ${MAX_IMAGES} images per item.`);
      return;
    }

    Alert.alert(
      "Add Photo",
      "Choose a source for your item's photo.",
      [
        { text: "Take Photo", onPress: openCamera },
        { text: "Choose from Library", onPress: openImageLibrary },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to take photos.');
      return;
    }

    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        addImageToList(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        allowsMultipleSelection: false, // We'll handle multiple selection manually
      });
      if (!result.canceled) {
        addImageToList(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const addImageToList = (imageAsset) => {
    const newImages = [...images, { ...imageAsset, id: Date.now() }];
    setImages(newImages);
    
    // If this is the first image, make it featured
    if (newImages.length === 1) {
      setFeaturedImageIndex(0);
    }
  };

  const removeImage = (indexToRemove) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    
    // Adjust featured image index if needed
    if (indexToRemove === featuredImageIndex) {
      setFeaturedImageIndex(0); // Reset to first image
    } else if (indexToRemove < featuredImageIndex) {
      setFeaturedImageIndex(featuredImageIndex - 1);
    }
  };

  const setFeaturedImage = (index) => {
    setFeaturedImageIndex(index);
  };

  const uploadImageToCloudinary = async (imageUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } }
    );

    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!itemName || !category || !description || !price || images.length === 0) {
      Alert.alert('Missing Information', 'Please fill in all fields and add at least one photo.');
      return;
    }

    setLoading(true);
    try {
      // Upload all images to Cloudinary
      const imageUrls = await Promise.all(
        images.map(image => uploadImageToCloudinary(image.uri))
      );

      const itemData = {
        name: itemName,
        category: category,
        description: description,
        price_per_day: parseFloat(price),
        imageUrl: imageUrls[featuredImageIndex], // Main image for backward compatibility
        images: imageUrls, // All images
        featuredImageIndex: featuredImageIndex,
      };

      await api('/items', 'POST', itemData);
      
      Alert.alert(
        'Success! 🎉',
        'Your item has been listed successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add item. Please try again.');
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageItem}>
      <Image source={{ uri: item.uri }} style={styles.imagePreview} />
      
      {/* Featured badge */}
      {index === featuredImageIndex && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>★ Featured</Text>
        </View>
      )}
      
      {/* Image controls */}
      <View style={styles.imageControls}>
        {index !== featuredImageIndex && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => setFeaturedImage(index)}
          >
            <Ionicons name="star-outline" size={16} color="#4A235A" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.deleteButton]} 
          onPress={() => removeImage(index)}
        >
          <Ionicons name="trash-outline" size={16} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Add New Item</Text>
        
        {/* Image section */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Photos ({images.length}/{MAX_IMAGES})</Text>
          
          {images.length > 0 ? (
            <>
              <FlatList
                data={images}
                renderItem={renderImageItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
              />
              
              {images.length < MAX_IMAGES && (
                <TouchableOpacity style={styles.addMoreButton} onPress={showImagePickerOptions}>
                  <Ionicons name="add" size={24} color="#957DAD" />
                  <Text style={styles.addMoreText}>Add Another Photo</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={showImagePickerOptions}>
              <Ionicons name="camera" size={40} color="#957DAD" />
              <Text style={styles.imagePickerText}>Add Photos</Text>
              <Text style={styles.imagePickerSubtext}>Tap to add your first photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <StyledTextInput
          label="Item Name"
          value={itemName}
          onChangeText={setItemName}
          placeholder="e.g., Red Party Dress"
        />

        <StyledTextInput
          label="Category"
          value={category}
          onChangeText={setCategory}
          placeholder="e.g., Dresses, Shoes, Accessories"
        />

        <StyledTextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your item, size, condition, etc."
          multiline
          numberOfLines={3}
        />

        <StyledTextInput
          label="Price per Day (₹)"
          value={price}
          onChangeText={setPrice}
          placeholder="e.g., 100"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>List Item</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollViewContent: { padding: 20 },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  imageSection: { marginBottom: 20 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#2c3e50', 
    marginBottom: 12 
  },
  imagePicker: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#F8F9FA', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#E0BBE4', 
    borderStyle: 'dashed' 
  },
  imagePickerText: { 
    color: '#957DAD', 
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8
  },
  imagePickerSubtext: { 
    color: '#957DAD', 
    fontSize: 14,
    marginTop: 4
  },
  imageList: { paddingBottom: 10 },
  imageItem: { 
    marginRight: 15, 
    position: 'relative' 
  },
  imagePreview: { 
    width: 120, 
    height: 120, 
    borderRadius: 12 
  },
  featuredBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featuredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageControls: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 12,
    marginLeft: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0BBE4',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addMoreText: {
    marginLeft: 8,
    color: '#957DAD',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: { 
    backgroundColor: '#957DAD', 
    paddingVertical: 15, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginTop: 20 
  },
  submitButtonDisabled: { backgroundColor: '#CED4DA' },
  submitButtonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});

export default AddItemScreenEnhanced;
