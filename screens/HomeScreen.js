import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal, Button, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';

const FeaturedItems = ({ items, navigation }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.featuredContainer}>
      <Text style={styles.featuredTitle}>Deals of the Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
        {items.map(item => (
          <TouchableOpacity key={item._id} style={styles.featuredItemCard} onPress={() => navigation.navigate('ItemDetail', { item })}>
            <Image source={{ uri: item.imageUrl }} style={styles.featuredItemImage} />
            <Text style={styles.featuredItemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.featuredItemPrice}>₹{item.price_per_day}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};


const HomeScreen = React.memo(({ navigation }) => {
  const { logout } = useAuth();
  const [items, setItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    size: '',
    color: '',
    occasion: '',
    sort: 'date',
  });

  const fetchItems = useCallback(async (query = '', showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      let queryString = `?search=${encodeURIComponent(query)}`;
      if (filters.size) queryString += `&size=${filters.size}`;
      if (filters.color) queryString += `&color=${filters.color}`;
      if (filters.occasion) queryString += `&occasion=${filters.occasion}`;
      if (filters.sort) queryString += `&sort=${filters.sort}`;
      
      const [itemsData, featuredData] = await Promise.all([
        api(`/items${queryString}`),
        api('/items/featured')
      ]);

      setItems(itemsData);
      setFeaturedItems(featuredData);

    } catch (error) {
      console.error("Failed to fetch items:", error);
      if (error.message && error.message.includes('Session expired')) {
        console.log("[HOME] Session expired, user will be logged out");
      } else {
        console.error("Non-auth error fetching items:", error.message);
      }
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialLoad) {
        fetchItems(searchQuery, false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchItems, isInitialLoad]);

  useFocusEffect(
    useCallback(() => {
      fetchItems(searchQuery, true);
    }, [fetchItems, searchQuery])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems(searchQuery, false);
  }, [searchQuery, fetchItems]);

  const applyFilters = () => {
    setFilterModalVisible(false);
    fetchItems(searchQuery, true);
  };

  const renderItem = useCallback(({ item }) => (
    <ItemCard key={item._id} item={item} />
  ), []);

  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={28} color="#E74C3C" />
        </TouchableOpacity>
      </View>

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
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#34495e" />
        </TouchableOpacity>
      </View>

      {loading && isInitialLoad ? (
        <ActivityIndicator size="large" color="#957DAD" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={<FeaturedItems items={featuredItems} navigation={navigation} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found. Try a different search!</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#957DAD"]} />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters & Sort</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Size (e.g., M, L, 10)"
              value={filters.size}
              onChangeText={(text) => setFilters({ ...filters, size: text })}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Color (e.g., Red, Blue)"
              value={filters.color}
              onChangeText={(text) => setFilters({ ...filters, color: text })}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Occasion (e.g., Wedding, Party)"
              value={filters.occasion}
              onChangeText={(text) => setFilters({ ...filters, occasion: text })}
            />
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <TouchableOpacity onPress={() => setFilters({ ...filters, sort: 'date' })} style={styles.sortButton}>
                <Text>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilters({ ...filters, sort: 'price-asc' })} style={styles.sortButton}>
                <Text>Price: Low to High</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilters({ ...filters, sort: 'price-desc' })} style={styles.sortButton}>
                <Text>Price: High to Low</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilters({ ...filters, sort: 'rating' })} style={styles.sortButton}>
                <Text>Highest Rating</Text>
              </TouchableOpacity>
            </View>
            <Button title="Apply" onPress={applyFilters} color="#957DAD" />
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  searchSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchContainer: {
    flex: 1,
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
  filterButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  sortContainer: {
    marginVertical: 10,
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sortButton: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featuredContainer: {
    paddingVertical: 15,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  featuredItemCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  featuredItemImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  featuredItemName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  featuredItemPrice: {
    fontSize: 12,
    color: '#7f8c8d',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});

export default HomeScreen;