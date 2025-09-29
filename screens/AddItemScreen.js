import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CLOUDINARY_CLOUD_NAME = 'dv9uxenrx';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

const AddItemScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  // New states for enhanced features
  const [listingType, setListingType] = useState('rent'); // 'rent' or 'sell'
  const [rentalDuration, setRentalDuration] = useState('per day'); // 'per day', 'per week', 'per month', 'custom'
  const [customDuration, setCustomDuration] = useState('');
  const { user } = useAuth();

  // --- NEW: Function to show Camera/Gallery choice ---
  const showImagePickerOptions = () => {
    Alert.alert(
      "Select Image",
      "Choose a source for your item's photo.",
      [
        { text: "Take Photo...", onPress: openCamera },
        { text: "Choose from Library...", onPress: openImageLibrary },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // --- NEW: Function to open the camera ---
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
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open camera.");
    }
  };

  // --- UPDATED: Function to open the photo library ---
  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library access is required to select photos.');
      return;
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
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const handleSubmit = async () => {
    if (!image || !itemName || !category || !description || !price) {
      return Alert.alert("Incomplete Form", "Please fill all fields and select an image.");
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: `image/${image.uri.split('.').pop()}`,
        name: `item_${user.id}_${Date.now()}.${image.uri.split('.').pop()}`,
      });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const cloudinaryData = await cloudinaryResponse.json();
      if (cloudinaryData.error) throw new Error(cloudinaryData.error.message);
      
      const imageUrl = cloudinaryData.secure_url;

      const itemData = {
        name: itemName, 
        category, 
        description,
        price_per_day: parseFloat(price),
        listingType, // 'rent' or 'sell'
        rentalDuration: rentalDuration === 'custom' ? customDuration : rentalDuration,
        imageUrl,
      };
      
      await api('/items', 'POST', itemData);

      Alert.alert("Success!", "Your item has been listed!", [
        { text: "OK", onPress: () => {
            setImage(null); setItemName(''); setCategory('');
            setDescription(''); setPrice('');
            navigation.navigate('Explore');
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
        <TouchableOpacity style={styles.imagePicker} onPress={showImagePickerOptions}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#957DAD" />
              <Text style={styles.imagePickerText}>Tap to add a photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <StyledTextInput label="Item Name" value={itemName} onChangeText={setItemName} />
        <StyledTextInput label="Category" value={category} onChangeText={setCategory} />
        <StyledTextInput label="Description" value={description} onChangeText={setDescription} multiline />
        
        {/* Listing Type Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Listing Type</Text>
          <View style={styles.optionContainer}>
            <TouchableOpacity 
              style={[styles.optionButton, listingType === 'rent' && styles.optionButtonSelected]}
              onPress={() => setListingType('rent')}
            >
              <Ionicons 
                name={listingType === 'rent' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color={listingType === 'rent' ? '#957DAD' : '#7f8c8d'} 
              />
              <Text style={[styles.optionText, listingType === 'rent' && styles.optionTextSelected]}>
                For Rent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionButton, listingType === 'sell' && styles.optionButtonSelected]}
              onPress={() => setListingType('sell')}
            >
              <Ionicons 
                name={listingType === 'sell' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color={listingType === 'sell' ? '#957DAD' : '#7f8c8d'} 
              />
              <Text style={[styles.optionText, listingType === 'sell' && styles.optionTextSelected]}>
                For Sale
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rental Duration (only show for rent) */}
        {listingType === 'rent' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Rental Duration</Text>
            <View style={styles.durationContainer}>
              {['per day', 'per week', 'per month', 'custom'].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[styles.durationButton, rentalDuration === duration && styles.durationButtonSelected]}
                  onPress={() => setRentalDuration(duration)}
                >
                  <Text style={[styles.durationText, rentalDuration === duration && styles.durationTextSelected]}>
                    {duration === 'custom' ? 'Custom' : duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {rentalDuration === 'custom' && (
              <StyledTextInput 
                label="Custom Duration (e.g., '3 days', '2 weeks')" 
                value={customDuration} 
                onChangeText={setCustomDuration}
                placeholder="e.g., 3 days, 2 weeks, 1 month"
              />
            )}
          </View>
        )}

        <StyledTextInput 
          label={listingType === 'rent' ? `Price ${rentalDuration === 'custom' ? `(₹ ${customDuration || 'per duration'})` : `(₹ ${rentalDuration})`}` : "Sale Price (₹)"} 
          value={price} 
          onChangeText={setPrice} 
          keyboardType="numeric" 
        />
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
  imagePicker: { width: '100%', height: 200, backgroundColor: '#FFFFFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#E0BBE4', borderStyle: 'dashed' },
  imagePickerPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  imagePickerText: { color: '#957DAD', fontSize: 16, fontWeight: '500', marginTop: 8 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 14 },
  submitButton: { backgroundColor: '#957DAD', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { backgroundColor: '#CED4DA' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#34495e', marginBottom: 12 },
  optionContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  optionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, backgroundColor: '#F8F9FA', flex: 1, marginHorizontal: 5 },
  optionButtonSelected: { backgroundColor: '#E0BBE4' },
  optionText: { marginLeft: 8, fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
  optionTextSelected: { color: '#4A235A' },
  durationContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  durationButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F8F9FA', marginBottom: 8, minWidth: '45%', alignItems: 'center' },
  durationButtonSelected: { backgroundColor: '#E0BBE4' },
  durationText: { fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
  durationTextSelected: { color: '#4A235A' },
});

export default AddItemScreen;