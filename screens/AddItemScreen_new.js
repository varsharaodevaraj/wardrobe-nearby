import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import StyledTextInput from '../components/StyledTextInput';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/apiConfig';

const AddItemScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const showImagePickerOptions = () => {
    Alert.alert(
      "Select Photo",
      "Choose how you'd like to add a photo",
      [
        { text: "Camera", onPress: () => openCamera() },
        { text: "Photo Library", onPress: () => openImageLibrary() },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Please grant camera access to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("[CAMERA] Image captured:", result.assets[0].uri);
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error("[CAMERA] Error:", error);
      Alert.alert("Error", "Could not open camera. Please try again.");
    }
  };

  const openImageLibrary = async () => {
    try {
      // Check current permissions
      const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      let finalStatus = currentStatus;
      
      // If not granted, request permissions
      if (currentStatus !== 'granted') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Please go to Settings and grant photo library access to add images to your listings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, this will open app settings
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("[IMAGE_PICKER] Image selected:", result.assets[0].uri);
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error("[IMAGE_PICKER] Error:", error);
      Alert.alert("Error", "Could not open the photo library. Please try again.");
    }
  };

  const uploadImageToCloudinary = async (imageUri) => {
    // For demo, we'll use reliable placeholder images
    // In production, you'd upload to Cloudinary, AWS S3, etc.
    const placeholderImages = [
      'https://dummyimage.com/600x400/E0BBE4/4A235A&text=Fashion+Item',
      'https://dummyimage.com/600x400/957DAD/FFFFFF&text=Rental+Item',
      'https://dummyimage.com/600x400/D291BC/FFFFFF&text=Your+Item',
      'https://fakeimg.pl/600x400/E0BBE4/4A235A/?text=Fashion+Item&font=arial',
      'https://fakeimg.pl/600x400/957DAD/FFFFFF/?text=Rental+Item&font=arial',
      'https://fakeimg.pl/600x400/D291BC/FFFFFF/?text=Your+Item&font=arial',
    ];
    await new Promise(resolve => setTimeout(resolve, 1000));
    return placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
  };

  const handleSubmit = async () => {
    if (!image || !itemName || !category || !description || !price) {
      return Alert.alert("Missing Information", "Please fill in all fields and select an image.");
    }

    if (!user) {
      return Alert.alert("Error", "You must be logged in to add items.");
    }

    setLoading(true);
    try {
      console.log("[ADD_ITEM] Starting item submission...");
      const imageUrl = await uploadImageToCloudinary(image.uri);
      console.log("[ADD_ITEM] Image uploaded:", imageUrl);

      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          category,
          description,
          price_per_day: parseInt(price),
          imageUrl,
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add item');

      console.log("[ADD_ITEM] Item added successfully:", data);

      Alert.alert("Success!", "Your item has been listed successfully!", [
        {
          text: "OK",
          onPress: () => {
            setImage(null);
            setItemName('');
            setCategory('');
            setDescription('');
            setPrice('');
            navigation.navigate('Home');
          }
        }
      ]);
    } catch (error) {
      console.error("[ADD_ITEM] Error:", error);
      Alert.alert("Error", error.message || "Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>List Your Item</Text>
        
        <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions()}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>📷 Tap to add a photo</Text>
          )}
        </TouchableOpacity>
        
        <StyledTextInput 
          label="Item Name" 
          value={itemName} 
          onChangeText={setItemName}
          placeholder="e.g. Designer Evening Dress"
        />
        
        <StyledTextInput 
          label="Category" 
          value={category} 
          onChangeText={setCategory}
          placeholder="e.g. Formal Wear, Ethnic Wear"
        />
        
        <StyledTextInput 
          label="Description" 
          value={description} 
          onChangeText={setDescription} 
          multiline
          placeholder="Describe your item..."
        />
        
        <StyledTextInput 
          label="Price per day (₹)" 
          value={price} 
          onChangeText={setPrice} 
          keyboardType="numeric"
          placeholder="e.g. 1500"
        />
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollViewContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 20 },
  imagePicker: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#F8F9FA', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    borderWidth: 2, 
    borderColor: '#E0BBE4', 
    borderStyle: 'dashed',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imagePickerText: { 
    color: '#957DAD', 
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  },
  imagePreview: { width: '100%', height: '100%', borderRadius: 14 },
  submitButton: { backgroundColor: '#957DAD', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { backgroundColor: '#CED4DA' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default AddItemScreen;