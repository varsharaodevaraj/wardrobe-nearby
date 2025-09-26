import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const StoryViewerScreen = ({ route, navigation }) => {
  const { stories, startIndex } = route.params;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setImageLoading(true);
    const timer = setTimeout(() => {
        goToNextStory();
    }, 5000); // 5 seconds per story
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const goToNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const goToPreviousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const currentStory = stories[currentIndex];

  // --- NEW: Function to handle navigating to the linked item ---
  const handleViewItem = () => {
    if (currentStory.linkedItem) {
      // First, close the story viewer modal
      navigation.goBack();
      // Then, navigate to the ItemDetail screen with the linked item's data
      navigation.navigate('ItemDetail', { item: currentStory.linkedItem });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
            {stories.map((_, index) => (
                <View key={index} style={styles.progressBarWrapper}>
                    <View style={[ styles.progressBar, { backgroundColor: index < currentIndex ? 'white' : 'rgba(255,255,255,0.5)' }]} />
                </View>
            ))}
        </View>
        <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentStory.user.name}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.storyContent}>
        {imageLoading && <ActivityIndicator style={styles.loader} color="white" size="large" />}
        <Image 
            source={{ uri: currentStory.imageUrl }} 
            style={styles.image} 
            onLoadEnd={() => setImageLoading(false)}
        />
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.navArea} onPress={goToPreviousStory} />
        <TouchableOpacity style={styles.navArea} onPress={goToNextStory} />
      </View>
      
      {/* --- NEW: Conditionally render the "View Item" button --- */}
      {currentStory.linkedItem && (
        <TouchableOpacity style={styles.linkButton} onPress={handleViewItem}>
            <Ionicons name="pricetag-outline" size={20} color="#2c3e50" style={{marginRight: 10}} />
            <Text style={styles.linkButtonText}>View Item</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: 15, paddingTop: 60 },
  progressContainer: { flexDirection: 'row', width: '100%', height: 3, marginBottom: 10, gap: 4 },
  progressBarWrapper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progressBar: { height: '100%', borderRadius: 2 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  closeButton: { position: 'absolute', top: 50, right: 15 },
  storyContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
  loader: { position: 'absolute' },
  navContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  navArea: { flex: 1 },
  // --- NEW STYLES ---
  linkButton: {
    position: 'absolute',
    bottom: 50,
    left: '25%',
    right: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    borderRadius: 30,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

export default StoryViewerScreen;