import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // Import useNavigation
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigation = useNavigation(); // Get the navigation object

  const fetchStories = useCallback(async () => {
    try {
      const data = await api('/stories');
      setStories(data);
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchStories();
  }, [fetchStories]));

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color="#CED4DA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* --- MAKE THIS BUTTON NAVIGATE --- */}
        <TouchableOpacity 
          style={styles.storyCircleContainer}
          onPress={() => navigation.navigate('AddStory')} // Navigate to the new screen
        >
          <View style={[styles.storyCircle, styles.addStoryCircle]}>
            <Ionicons name="add" size={32} color="#957DAD" />
          </View>
          <Text style={styles.storyName}>Add Story</Text>
        </TouchableOpacity>

        {stories.map((story) => (
          <TouchableOpacity key={story._id} style={styles.storyCircleContainer}>
            <View style={styles.storyCircle}>
              <Image source={{ uri: story.imageUrl }} style={styles.storyImage} />
            </View>
            <Text style={styles.storyName}>{story.user.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    height: 105,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  storyCircleContainer: {
    marginRight: 15,
    alignItems: 'center',
  },
  storyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#957DAD',
  },
  addStoryCircle: {
    backgroundColor: '#F8F9FA',
    borderColor: '#CED4DA',
  },
  storyImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  storyName: {
    marginTop: 6,
    fontSize: 12,
    color: '#34495e',
    maxWidth: 70,
    textAlign: 'center',
  },
});

export default Stories;