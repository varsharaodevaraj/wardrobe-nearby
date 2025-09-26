import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import { useFocusEffect } from '@react-navigation/native'; // --- IMPORT THE HOOK ---

// --- computer'S IP ADDRESS ---
const API_URL = 'http://10.51.8.5:3000/api';

const HomeScreen = () => {
  const { logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

  // We wrap fetchItems in useCallback to prevent it from being recreated on every render
  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/items`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // useFocusEffect runs the fetchItems function every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Show loader when screen is focused
      fetchItems();
    }, [fetchItems])
  );

  // This function is for the "pull-to-refresh" gesture
  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Nearby</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#957DAD" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => <ItemCard item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No items listed yet. Be the first!</Text>}
          // Add the RefreshControl component for pull-to-refresh
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#957DAD"]} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#7f8c8d',
  },
});

export default HomeScreen;