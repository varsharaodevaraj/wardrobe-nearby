import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const StoryViewerScreen = ({ route, navigation }) => {
  const { stories, startIndex } = route.params;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [imageLoading, setImageLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setImageLoading(true);
    const timer = setTimeout(() => {
      goToNextStory();
    }, 5000);
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
  const isOwner = user?.id === currentStory.user._id;

  const handleDeleteStory = () => {
    Alert.alert(
      "Delete Story",
      "Are you sure you want to delete this story? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api(`/stories/${currentStory._id}`, "DELETE");
              Alert.alert("Success", "Your story has been deleted.");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Could not delete the story.");
            }
          },
        },
      ]
    );
  };

  const handleViewItem = () => {
    if (currentStory.linkedItem) {
      navigation.goBack();
      navigation.navigate("ItemDetail", { item: currentStory.linkedItem });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBarWrapper}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor:
                      index < currentIndex ? "white" : "rgba(255,255,255,0.5)",
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{currentStory.user.name}</Text>
        </View>

        {isOwner && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteStory}
          >
            <Ionicons name="trash-outline" size={26} color="white" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.storyContent}>
        {imageLoading && (
          <ActivityIndicator style={styles.loader} color="white" size="large" />
        )}
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

      {currentStory.linkedItem && (
        <View style={styles.getTheLookContainer}>
          <Text style={styles.getTheLookTitle}>Get The Look</Text>
          <TouchableOpacity style={styles.linkButton} onPress={handleViewItem}>
            <Image source={{ uri: currentStory.linkedItem.imageUrl }} style={styles.linkedItemImage} />
            <View style={styles.linkedItemInfo}>
              <Text style={styles.linkedItemName}>{currentStory.linkedItem.name}</Text>
              <Text style={styles.linkedItemPrice}>₹{currentStory.linkedItem.price_per_day}/day</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2c3e50" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 15,
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
  },
  progressContainer: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    flexDirection: "row",
    height: 3,
    gap: 4,
  },
  progressBarWrapper: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressBar: { height: "100%", borderRadius: 2 },
  userInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  userName: { color: "white", fontSize: 16, fontWeight: "bold" },
  closeButton: { paddingLeft: 10 },
  deleteButton: { paddingHorizontal: 10 },
  storyContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: "100%", resizeMode: "contain" },
  loader: { position: "absolute" },
  navContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  navArea: { flex: 1 },
  getTheLookContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  getTheLookTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 12,
  },
  linkedItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  linkedItemInfo: {
    flex: 1,
  },
  linkedItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  linkedItemPrice: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});

export default StoryViewerScreen;