import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// --- MOCK DATA ---
const MY_LISTINGS = [
  { id: '1', name: 'Designer Silk Saree', imageUrl: 'https://placehold.co/600x400/957DAD/4A235A?text=Silk+Saree' },
  { id: '2', name: 'Kundan Necklace Set', imageUrl: 'https://placehold.co/600x400/D291BC/4A235A?text=Necklace' },
];
const MY_RENTALS = [
  { id: '3', name: 'Elegant Floral Gown', imageUrl: 'https://placehold.co/600x400/E0BBE4/4A235A?text=Floral+Gown', return_by: '2025-10-05' },
];

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const renderItemRow = (item, isRental = false) => (
    <View key={item.id} style={styles.itemRow}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {isRental && <Text style={styles.itemSubtext}>Return by: {item.return_by}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#CED4DA" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          {MY_LISTINGS.map(item => renderItemRow(item))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Rentals</Text>
          {MY_RENTALS.map(item => renderItemRow(item, true))}
        </View>
        
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#957DAD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  itemSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#E74C3C',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;