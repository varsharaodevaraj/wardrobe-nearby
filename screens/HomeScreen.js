import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import Stories from '../components/Stories'; // --- IMPORT THE NEW STORIES COMPONENT ---
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';

const HomeScreen = () => {
  const { logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = useCallback(async (query) => {
    try {
      const data = await api(`/items?search=${query}`);
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchItems(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchItems]);

  useFocusEffect(
    useCallback(() => {
      setSearchQuery('');
      setLoading(true);
      fetchItems('');
    }, [fetchItems])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems(searchQuery);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={28} color="#E74C3C" />
        </TouchableOpacity>
      </View>
      
      {/* --- DISPLAY THE STORIES COMPONENT HERE --- */}
      <Stories />

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for dresses, jewelry..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#957DAD" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => <ItemCard item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found. Try a different search!</Text>}
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
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingRight: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  searchIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
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