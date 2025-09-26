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

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // This single function fetches all necessary data for the profile screen
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch user's listings, incoming requests, and outgoing requests in parallel
      const [listingsData, incomingData, outgoingData] = await Promise.all([
        api(`/items/user/${user.id}`),
        api("/rentals/incoming"),
        api("/rentals/outgoing"),
      ]);
      setMyListings(listingsData);
      setIncomingRequests(incomingData);
      setOutgoingRequests(outgoingData);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      Alert.alert("Error", "Could not fetch your profile data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // useFocusEffect ensures the data is fresh every time the user visits this screen
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Handles the owner's decision to accept or decline a request
  const handleRequestUpdate = async (rentalId, status) => {
    try {
      await api(`/rentals/${rentalId}/status`, "PUT", { status });
      Alert.alert("Success", `Request has been ${status}.`);
      fetchData(); // Refresh the screen data
    } catch (error) {
      Alert.alert("Error", `Failed to ${status} the request.`);
    }
  };

  // A small, reusable component to display the status of a rental
  const StatusPill = ({ status }) => {
    const statusStyles = {
      pending: { backgroundColor: "#F1C40F" },
      accepted: { backgroundColor: "#2ECC71" },
      declined: { backgroundColor: "#E74C3C" },
      completed: { backgroundColor: "#3498DB" },
    };
    return (
      <View style={[styles.statusPill, statusStyles[status]]}>
        <Text style={styles.statusPillText}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        {/* User Info Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Section for owners to manage requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Rental Requests</Text>
          {loading ? (
            <ActivityIndicator color="#957DAD" />
          ) : incomingRequests.length > 0 ? (
            incomingRequests.map((req) => (
              <View key={req._id} style={styles.requestRow}>
                <Image
                  source={{ uri: req.item.imageUrl }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{req.item.name}</Text>
                  <Text style={styles.itemSubtext}>
                    Requested by {req.borrower.name}
                  </Text>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleRequestUpdate(req._id, "declined")}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleRequestUpdate(req._id, "accepted")}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              You have no new rental requests.
            </Text>
          )}
        </View>

        {/* Section for borrowers to see their request statuses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Rental Requests</Text>
          {loading ? (
            <ActivityIndicator color="#957DAD" />
          ) : outgoingRequests.length > 0 ? (
            outgoingRequests.map((req) => (
              <View key={req._id} style={styles.itemRow}>
                <Image
                  source={{ uri: req.item.imageUrl }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{req.item.name}</Text>
                  <Text style={styles.itemSubtext}>
                    Owner: {req.owner.name}
                  </Text>
                </View>
                <StatusPill status={req.status} />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              You haven't requested any items yet.
            </Text>
          )}
        </View>

        {/* Section for owners to see their own listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          {loading ? (
            <ActivityIndicator color="#957DAD" />
          ) : myListings.length > 0 ? (
            myListings.map((item) => (
              <View key={item._id} style={styles.itemRow}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CED4DA" />
              </View>
            ))
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
};

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
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusPillText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});

export default ProfileScreen;