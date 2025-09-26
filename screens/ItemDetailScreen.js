import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api'; // Import our secure API client
import { useAuth } from '../context/AuthContext'; // To check if the user is the owner

const ItemDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const { user } = useAuth(); // Get the current logged-in user
  const [loading, setLoading] = useState(false);

  // Check if the logged-in user is the owner of the item
  const isOwner = user?.id === item.user;

  const handleRentNow = async () => {
    setLoading(true);
    try {
      // Use our secure API client to send the request
      const response = await api('/rentals/request', 'POST', { itemId: item._id });
      Alert.alert("Success!", response.message || "Your rental request has been sent to the owner.");
      navigation.goBack(); // Go back to the home screen after request
    } catch (error) {
      console.error("[RENTAL_REQUEST] Error:", error);
      Alert.alert("Request Failed", error.message || "Could not submit your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </ScrollView>

      {/* --- UPDATED FOOTER --- */}
      {/* The footer will not show if the user is the owner of the item */}
      {!isOwner && (
        <View style={styles.footer}>
          <Text style={styles.price}>{`₹${item.price_per_day} / day`}</Text>
          <TouchableOpacity 
            style={[styles.rentButton, loading && styles.rentButtonDisabled]} 
            onPress={handleRentNow}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#4A235A" />
            ) : (
              <Text style={styles.rentButtonText}>Rent Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  image: { width: '100%', height: 400 },
  backButton: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  detailsContainer: { padding: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  category: { fontSize: 18, color: '#7f8c8d', marginBottom: 16 },
  description: { fontSize: 16, color: '#34495e', lineHeight: 24 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  price: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  rentButton: { backgroundColor: '#E0BBE4', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, minWidth: 150, alignItems: 'center' },
  rentButtonDisabled: { backgroundColor: '#CED4DA' },
  rentButtonText: { color: '#4A235A', fontSize: 18, fontWeight: 'bold' },
});

export default ItemDetailScreen;