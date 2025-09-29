import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const Stories = React.memo(() => {
  const [groupedStories, setGroupedStories] = useState([]); // State will now hold grouped stories
  const [loading, setLoading] = useState(false); // Start with false to prevent initial spinner
  const [hasLoaded, setHasLoaded] = useState(false);
  const navigation = useNavigation();

  const fetchAndGroupStories = useCallback(async (forceRefresh = false) => {
    try {
      if (!hasLoaded || forceRefresh) setLoading(true); // Show spinner on first load or force refresh
      const flatStories = await api('/stories');

      // --- OPTIMIZED GROUPING LOGIC ---
      if (flatStories && flatStories.length > 0) {
        // 1. Group stories by user using a reducer
        const storyGroups = flatStories.reduce((acc, story) => {
          const userId = story.user._id;
          if (!acc[userId]) {
            // If this is the first story from this user, create a new group
            acc[userId] = {
              user: story.user,
              stories: [],
            };
          }
          // Add the current story to this user's group
          acc[userId].stories.push(story);
          return acc;
        }, {});

        // 2. Convert the groups object back into an array for rendering
        const groupedArray = Object.values(storyGroups);
        setGroupedStories(groupedArray);
      } else {
        setGroupedStories([]);
      }

    } catch (error) {
      console.error("Failed to fetch stories:", error);
      setGroupedStories([]); // Set empty array on error
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  // Fetch stories when component focuses - always refresh to show new stories
  useFocusEffect(useCallback(() => {
    fetchAndGroupStories(!hasLoaded); // Force refresh on subsequent visits
  }, [fetchAndGroupStories, hasLoaded]));

  // --- NEW: Function to open the story viewer with a user's collection of stories ---
  const handleStoryPress = (storyGroup) => {
    if (storyGroup.stories.length > 0) {
      navigation.navigate('StoryViewer', { 
        stories: storyGroup.stories, // Pass the whole array of this user's stories
        startIndex: 0 // Start from the first story
      });
    }
  };

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator color="#CED4DA" /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.storyCircleContainer} onPress={() => navigation.navigate('AddStory')}>
          <View style={[styles.storyCircle, styles.addStoryCircle]}>
            <Ionicons name="add" size={32} color="#957DAD" />
          </View>
          <Text style={styles.storyName}>Add Story</Text>
        </TouchableOpacity>

        {/* --- RENDER THE GROUPED STORIES --- */}
        {groupedStories.map((group) => (
          <TouchableOpacity 
            key={group.user._id} 
            style={styles.storyCircleContainer}
            onPress={() => handleStoryPress(group)}
          >
            <View style={styles.storyCircle}>
              {/* Show the image from the user's most recent story */}
              <Image source={{ uri: group.stories[0].imageUrl }} style={styles.storyImage} />
            </View>
            <Text style={styles.storyName}>{group.user.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', backgroundColor: '#FFFFFF' },
  loaderContainer: { height: 105, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { paddingHorizontal: 15, alignItems: 'center' },
  storyCircleContainer: { marginRight: 15, alignItems: 'center' },
  storyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    // --- UPDATED BORDER STYLE FOR "UNVIEWED" LOOK ---
    borderWidth: 3,
    borderColor: '#C13584', // Instagram-like pink/purple
  },
  addStoryCircle: { backgroundColor: '#F8F9FA', borderColor: '#CED4DA' },
  storyImage: { width: 60, height: 60, borderRadius: 30 },
  storyName: { marginTop: 6, fontSize: 12, color: '#34495e', maxWidth: 70, textAlign: 'center' },
});

export default Stories;