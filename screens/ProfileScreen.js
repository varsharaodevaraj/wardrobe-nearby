import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://10.51.8.5:3000/api';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyListings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/items/user/${user.id}`);
      const data = await response.json();
      setMyListings(data);
    } catch (error) {
      console.error("Failed to fetch my listings:", error);
      Alert.alert("Error", "Could not fetch your listings.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchMyListings();
  }, [fetchMyListings]));
  
  const renderItemRow = (item) => (
    <View key={item._id} style={styles.itemRow}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#CED4DA" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          {loading ? (
            <ActivityIndicator color="#957DAD" style={{ marginTop: 20 }} />
          ) : myListings.length > 0 ? (
            myListings.map(item => renderItemRow(item))
          ) : (
            <Text style={styles.emptyText}>You haven't listed any items yet.</Text>
          )}
        </View>
        
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#957DAD', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  userEmail: { fontSize: 16, color: '#7f8c8d' },
  section: { marginTop: 20, backgroundColor: '#FFFFFF', paddingVertical: 15, minHeight: 100 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#34495e', paddingHorizontal: 20, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, color: '#2c3e50' },
  emptyText: { paddingHorizontal: 20, color: '#7f8c8d', textAlign: 'center', marginTop: 10 },
  logoutButton: { marginHorizontal: 20, marginTop: 30, marginBottom: 40, backgroundColor: '#E74C3C', paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default ProfileScreen;