import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import StyledTextInput from '../components/StyledTextInput';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserInContext } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, you would upload the profileImage to a service like Cloudinary here
      // For now, we'll just pass the URI (or the existing URL)
      const updatedData = { name, bio, profileImage };
      const updatedUser = await api('/users/profile', 'PUT', updatedData);
      
      await updateUserInContext(updatedUser);
      Alert.alert('Success', 'Your profile has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
          <Image source={{ uri: profileImage || 'https://placehold.co/200x200/E0BBE4/4A235A/png?text=Add\\nPhoto' }} style={styles.avatar} />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <StyledTextInput label="Name" value={name} onChangeText={setName} />
        <StyledTextInput label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#2c3e50' },
    content: { padding: 20 },
    avatarContainer: { alignSelf: 'center', marginBottom: 30 },
    avatar: { width: 120, height: 120, borderRadius: 60 },
    cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#957DAD', padding: 8, borderRadius: 20 },
    saveButton: { backgroundColor: '#957DAD', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default EditProfileScreen;