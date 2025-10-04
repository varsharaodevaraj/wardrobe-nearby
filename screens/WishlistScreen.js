import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWishlist } from '../context/WishlistContext';
import { useFocusEffect } from '@react-navigation/native';
import ItemCard from '../components/ItemCard';
import { Ionicons } from '@expo/vector-icons';

const WishlistScreen = ({ navigation }) => {
  const { wishlistItems, loading, loadWishlist } = useWishlist();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWishlist().then(() => setRefreshing(false));
  }, [loadWishlist]);
  
  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [loadWishlist])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist ({wishlistItems.length})</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#957DAD" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={({ item }) => <ItemCard item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color="#CED4DA" />
              <Text style={styles.emptyText}>Your wishlist is empty.</Text>
              <Text style={styles.emptySubtext}>Tap the heart on items to save them here.</Text>
            </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default WishlistScreen;