import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import StyledTextInput from '../components/StyledTextInput';
import { useAuth } from '../context/AuthContext';

// --- IMPORTANT: ADD YOUR DETAILS HERE ---
const CLOUDINARY_CLOUD_NAME = 'dv9uxenrx'; // Your Cloudinary Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // Your unsigned upload preset
const API_URL = 'http://10.51.8.5:3000/api';

const AddItemScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Required', 'Please grant access to your photo library to continue.');
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open the photo library.");
    }
  };

  const handleSubmit = async () => {
    if (!image || !itemName || !category || !description || !price) {
      return Alert.alert("Missing Information", "Please fill in all fields and select an image.");
    }
    setLoading(true);

    try {
      // --- THIS IS THE REAL UPLOAD LOGIC ---
      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: `image/${image.uri.split('.').pop()}`, // Dynamically get file type
        name: `item_${user.id}_${Date.now()}.${image.uri.split('.').pop()}`,
      });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const cloudinaryData = await cloudinaryResponse.json();
      if (cloudinaryData.error) throw new Error(cloudinaryData.error.message);
      
      const imageUrl = cloudinaryData.secure_url;

      // Now, submit the item data to your server with the new image URL
      const itemData = {
        name: itemName, category, description,
        price_per_day: parseFloat(price),
        imageUrl, userId: user.id,
      };
      
      const serverResponse = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!serverResponse.ok) throw new Error('Failed to list item on the server.');

      Alert.alert("Success!", "Your item has been listed!", [
        { text: "OK", onPress: () => {
            setImage(null); setItemName(''); setCategory('');
            setDescription(''); setPrice('');
            navigation.navigate('Home');
          }
        }
      ]);
    } catch (error) {
      console.error("[ADD_ITEM] Error:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>List Your Item</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>📷 Tap to add a photo</Text>
          )}
        </TouchableOpacity>
        <StyledTextInput label="Item Name" value={itemName} onChangeText={setItemName} />
        <StyledTextInput label="Category" value={category} onChangeText={setCategory} />
        <StyledTextInput label="Description" value={description} onChangeText={setDescription} multiline />
        <StyledTextInput label="Price per day (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>List My Item</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollViewContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 20 },
  imagePicker: { width: '100%', height: 200, backgroundColor: '#F8F9FA', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#E0BBE4', borderStyle: 'dashed' },
  imagePickerText: { color: '#957DAD', fontSize: 16, fontWeight: '500' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 14 },
  submitButton: { backgroundColor: '#957DAD', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { backgroundColor: '#CED4DA' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default AddItemScreen;