import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';

const UserReviewsScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'about' ? `/reviews/user/${userId}/about` : `/reviews/user/${userId}/written`;
      const data = await api(endpoint);
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch user reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>Reviews About You</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'written' && styles.activeTab]}
          onPress={() => setActiveTab('written')}
        >
          <Text style={[styles.tabText, activeTab === 'written' && styles.activeTabText]}>Reviews You've Written</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#957DAD" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No reviews found.</Text>}
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
  tabContainer: { flexDirection: 'row', backgroundColor: 'white' },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#957DAD' },
  tabText: { color: '#7f8c8d' },
  activeTabText: { color: '#957DAD', fontWeight: 'bold' },
  listContent: { padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#7f8c8d' },
});

export default UserReviewsScreen;