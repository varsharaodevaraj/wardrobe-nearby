import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Switch, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
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
  const { user, logout } = useAuth();
  const { userCommunity } = useCommunity();
  const [items, setItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [communityFilter, setCommunityFilter] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!user?.id) return;

    if (!refreshing) {
        setLoading(true);
    }

    try {
      let queryString = `?search=${encodeURIComponent(searchQuery)}`;
      if (communityFilter && userCommunity) {
        queryString += `&community=true`;
      }
      
      // *** THIS IS THE CORRECTED API CALL ***
      const [itemsData, featuredData] = await Promise.all([
        api(`/items${queryString}`), // Corrected: Added '/items' before the query string
        api('/items/featured')
      ]);

      setItems(itemsData || []);
      setFeaturedItems(featuredData || []);

    } catch (error) {
      console.error("Failed to fetch items:", error);
      if (error.message && error.message.includes('Session expired')) {
        console.log("[HOME] Session expired, user will be logged out");
      } else {
        console.error("Non-auth error fetching items:", error.message);
      }
      setItems([]);
      setFeaturedItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, communityFilter, userCommunity, user?.id, refreshing]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchItems();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery, communityFilter]); // Removed fetchItems from dependency array to prevent loop
  
  useFocusEffect(useCallback(() => { 
    fetchItems(); 
  }, [fetchItems]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  useEffect(() => {
    if (refreshing) {
      fetchItems();
    }
  }, [refreshing, fetchItems]);

  const renderItem = useCallback(({ item }) => <ItemCard item={item} />, []);
  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={28} color="#E74C3C" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {userCommunity && (
          <View style={styles.communityToggle}>
            <Text style={styles.communityLabel}>Campus Closet ({userCommunity})</Text>
            <Switch
              value={communityFilter}
              onValueChange={setCommunityFilter}
              trackColor={{ false: "#CED4DA", true: "#E0BBE4" }}
              thumbColor={communityFilter ? "#957DAD" : "#f4f3f4"}
            />
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#957DAD" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={<FeaturedItems items={featuredItems} navigation={navigation} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#957DAD"]} />
          }
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
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
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
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  searchIcon: {
    marginLeft: 15,
  },
  communityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  communityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    flex: 1,
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