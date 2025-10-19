import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';

const AllReviewsScreen = ({ route, navigation }) => {
  const { itemId, averageRating, totalReviews } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReviews = useCallback(async (page = 1, sort = sortBy) => {
    setLoading(true);
    try {
      const data = await api(`/reviews/item/${itemId}?page=${page}&limit=10&sort=${sort}`);
      setReviews(page === 1 ? data.reviews : [...reviews, ...data.reviews]);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [itemId, sortBy, reviews]);

  useEffect(() => {
    fetchReviews(1, 'newest');
  }, []);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    fetchReviews(1, newSort);
  };

  const renderSortButton = (sortType, label) => (
    <TouchableOpacity
      style={[styles.sortButton, sortBy === sortType && styles.sortButtonActive]}
      onPress={() => handleSortChange(sortType)}
    >
      <Text style={[styles.sortButtonText, sortBy === sortType && styles.sortButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
        <StarRating rating={averageRating} size={20} disabled />
        <Text style={styles.totalReviews}>({totalReviews} reviews)</Text>
      </View>

      <View style={styles.sortContainer}>
        {renderSortButton('newest', 'Most Recent')}
        {renderSortButton('highest', 'Highest Rated')}
        {renderSortButton('lowest', 'Lowest Rated')}
      </View>

      {loading && reviews.length === 0 ? (
        <ActivityIndicator size="large" color="#957DAD" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (pagination.hasMore) {
              fetchReviews(currentPage + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading && reviews.length > 0 ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#2c3e50' },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  ratingText: { fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  totalReviews: { fontSize: 14, color: '#7f8c8d', marginLeft: 8 },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  sortButton: { padding: 8, borderRadius: 15 },
  sortButtonActive: { backgroundColor: '#E0BBE4' },
  sortButtonText: { color: '#2c3e50' },
  sortButtonTextActive: { color: '#4A235A', fontWeight: 'bold' },
  listContent: { padding: 15 },
});

export default AllReviewsScreen;