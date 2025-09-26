import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const CLOUDINARY_CLOUD_NAME = 'dv9uxenrx';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

const AddStoryScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const showImagePickerOptions = () => {
    Alert.alert("Select Image", "Choose a source for your story.",
      [
        { text: "Take Photo...", onPress: openCamera },
        { text: "Choose from Library...", onPress: openImageLibrary },
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
        aspect: [9, 16],
        quality: 0.7,
      });
      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open camera.");
    }
  };

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
        aspect: [9, 16],
        quality: 0.7,
      });
      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const handlePostStory = async () => {
    if (!image) {
      return Alert.alert("No Image", "Please select an image to post as your story.");
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: `image/${image.uri.split('.').pop()}`,
        name: `story_${Date.now()}.${image.uri.split('.').pop()}`,
      });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const cloudinaryData = await cloudinaryResponse.json();
      if (cloudinaryData.error) throw new Error(cloudinaryData.error.message);
      
      const imageUrl = cloudinaryData.secure_url;
      await api('/stories', 'POST', { imageUrl });

      Alert.alert("Success!", "Your story has been posted!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("[ADD_STORY] Error:", error);
      Alert.alert("Error", error.message || "Failed to post your story.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={32} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity style={styles.imagePicker} onPress={showImagePickerOptions}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons name="camera-outline" size={50} color="#957DAD" />
              <Text style={styles.imagePickerText}>Add a Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {image && (
          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handlePostStory} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Post to Story</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#2c3e50', marginLeft: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  imagePicker: { width: '90%', aspectRatio: 9 / 16, backgroundColor: '#FFFFFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E0BBE4', borderStyle: 'dashed' },
  imagePickerPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  imagePickerText: { marginTop: 10, color: '#957DAD', fontSize: 16, fontWeight: '500' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 14 },
  submitButton: { position: 'absolute', bottom: 40, backgroundColor: '#957DAD', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#CED4DA' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default AddStoryScreen;