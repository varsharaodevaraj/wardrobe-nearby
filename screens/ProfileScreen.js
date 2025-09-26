import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";

// Fallback image for items without images
const FALLBACK_IMAGE = 'https://dummyimage.com/200x200/E0BBE4/4A235A&text=No+Image';

const ProfileScreen = React.memo(() => {
  const { user, logout } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [listingsData, requestsData] = await Promise.all([
        api(`/items/user/${user.id}`),
        api("/rentals/incoming"),
      ]);
      
      // Filter out any null/undefined items to prevent errors
      const validListings = Array.isArray(listingsData) ? listingsData.filter(item => item) : [];
      const validRequests = Array.isArray(requestsData) ? requestsData.filter(request => 
        request && request.item && request.borrower
      ) : [];
      
      setMyListings(validListings);
      setIncomingRequests(validRequests);
    } catch (error) {
      console.error("Profile data fetch error:", error);
      Alert.alert("Error", "Could not fetch your profile data.");
      // Set empty arrays on error to prevent crashes
      setMyListings([]);
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // --- NEW: Function to handle accepting or declining a request ---
  const handleRequestUpdate = async (rentalId, status) => {
    try {
      await api(`/rentals/${rentalId}/status`, "PUT", { status });
      Alert.alert("Success", `Request has been ${status}.`);
      // Refresh the data to remove the request from the list
      fetchData();
    } catch (error) {
      Alert.alert("Error", `Failed to ${status} the request.`);
    }
  };

  const renderItemRow = (item) => {
    // Add null check to prevent errors
    if (!item) return null;
    
    return (
      <View key={item._id} style={styles.itemRow}>
        <Image 
          source={{ uri: item.imageUrl || FALLBACK_IMAGE }} 
          style={styles.itemImage}
          onError={(error) => {
            console.warn('Image loading error for item:', item.name, error);
          }}
          defaultSource={{ uri: FALLBACK_IMAGE }}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name || 'Unknown Item'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#CED4DA" />
      </View>
    );
  };

  // --- NEW: Component for rendering an incoming request with buttons ---
  const renderRequestRow = (request) => {
    // Add comprehensive null checks to prevent errors
    if (!request || !request.item || !request.borrower) {
      console.warn('Invalid request data:', request);
      return null;
    }
    
    return (
      <View key={request._id} style={styles.requestRow}>
        <Image 
          source={{ 
            uri: request.item.imageUrl || FALLBACK_IMAGE 
          }} 
          style={styles.itemImage}
          onError={(error) => {
            console.warn('Image loading error for request item:', request.item.name, error);
          }}
          defaultSource={{ uri: FALLBACK_IMAGE }}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{request.item.name || 'Unknown Item'}</Text>
          <Text style={styles.itemSubtext}>
            Requested by {request.borrower.name || 'Unknown User'}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleRequestUpdate(request._id, "declined")}
          >
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleRequestUpdate(request._id, "accepted")}
          >
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Rental Requests</Text>
          {loading ? (
            <ActivityIndicator color="#957DAD" />
          ) : incomingRequests.filter(request => request && request.item && request.borrower).length > 0 ? (
            incomingRequests
              .filter(request => request && request.item && request.borrower)
              .map(renderRequestRow)
          ) : (
            <Text style={styles.emptyText}>
              You have no new rental requests.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          {loading ? (
            <ActivityIndicator color="#957DAD" />
          ) : myListings.filter(item => item).length > 0 ? (
            myListings
              .filter(item => item)
              .map((item) => renderItemRow(item))
          ) : (
            <Text style={styles.emptyText}>
              You haven't listed any items yet.
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#957DAD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: { color: "#FFFFFF", fontSize: 32, fontWeight: "bold" },
  userName: { fontSize: 22, fontWeight: "bold", color: "#2c3e50" },
  userEmail: { fontSize: 16, color: "#7f8c8d" },
  section: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    minHeight: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34495e",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, color: "#2c3e50", fontWeight: "500" },
  itemSubtext: { fontSize: 14, color: "#7f8c8d", marginTop: 4 },
  emptyText: {
    paddingHorizontal: 20,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 10,
  },
  buttonContainer: { flexDirection: "row" },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  acceptButton: { backgroundColor: "#2ECC71" },
  declineButton: { backgroundColor: "#E74C3C" },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    backgroundColor: "#E74C3C",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  logoutButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});

export default ProfileScreen;