import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import Stories from '../components/Stories'; // --- IMPORT THE NEW STORIES COMPONENT ---
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';

const HomeScreen = React.memo(() => {
  const { logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false); // Changed initial value to false
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchItems = useCallback(async (query = '', showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await api(`/items${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      
      // Handle authentication errors gracefully
      if (error.message && error.message.includes('Session expired')) {
        console.log("[HOME] Session expired, user will be logged out");
        // Don't show error for session expired - user will be redirected to login
      } else {
        // Only show error for non-auth issues
        console.error("Non-auth error fetching items:", error.message);
      }
      
      // Set empty items array on error
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialLoad(false);
    }
  }, []);

  // Optimized search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialLoad) {
        fetchItems(searchQuery, false); // Don't show loading spinner for search
      }
    }, 500); // Increased debounce time to reduce API calls
    return () => clearTimeout(timer);
  }, [searchQuery, fetchItems, isInitialLoad]);

  // Initial load only
  useFocusEffect(
    useCallback(() => {
      if (isInitialLoad) {
        fetchItems('', true);
      }
    }, [fetchItems, isInitialLoad])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems(searchQuery, false);
  }, [searchQuery, fetchItems]);

  // Memoize the renderItem function to prevent unnecessary re-renders
  const renderItem = useCallback(({ item }) => (
    <ItemCard key={item._id} item={item} />
  ), []);

  // Memoize the keyExtractor
  const keyExtractor = useCallback((item) => item._id, []);

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

      {loading && isInitialLoad ? (
        <ActivityIndicator size="large" color="#957DAD" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found. Try a different search!</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#957DAD"]} />
          }
          removeClippedSubviews={true} // Performance optimization
          maxToRenderPerBatch={10} // Render only 10 items per batch
          updateCellsBatchingPeriod={50} // Update batching period
          initialNumToRender={8} // Initial items to render
          windowSize={10} // Viewport window size
          getItemLayout={(data, index) => ({
            length: 280, // Approximate item height (200 image + 80 content)
            offset: 280 * index,
            index,
          })}
        />
      )}
    </SafeAreaView>
  );
});

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