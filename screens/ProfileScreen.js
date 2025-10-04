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
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../utils/api";

// --- Internal components for each section to keep the code clean ---

const FollowersSection = ({ followers, following }) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Social Connections</Text>
      <View style={styles.socialStats}>
        <TouchableOpacity 
          style={styles.socialStatItem}
          onPress={() => setShowFollowers(!showFollowers)}
        >
          <Text style={styles.socialStatNumber}>{followers.length}</Text>
          <Text style={styles.socialStatLabel}>Followers</Text>
          {followers.length > 0 && (
            <Ionicons 
              name={showFollowers ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#7f8c8d" 
            />
          )}
        </TouchableOpacity>
        <View style={styles.socialStatDivider} />
        <TouchableOpacity 
          style={styles.socialStatItem}
          onPress={() => setShowFollowing(!showFollowing)}
        >
          <Text style={styles.socialStatNumber}>{following.length}</Text>
          <Text style={styles.socialStatLabel}>Following</Text>
          {following.length > 0 && (
            <Ionicons 
              name={showFollowing ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#7f8c8d" 
            />
          )}
        </TouchableOpacity>
      </View>
      
      {showFollowers && followers.length > 0 && (
        <View style={styles.followersContainer}>
          <Text style={styles.followersTitle}>Your Followers:</Text>
          {followers.slice(0, 10).map((follower) => (
            <View key={follower._id} style={styles.followerItem}>
              <View style={styles.followerAvatar}>
                <Text style={styles.followerInitial}>
                  {follower.name ? follower.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <Text style={styles.followerName}>{follower.name || 'Unknown User'}</Text>
            </View>
          ))}
          {followers.length > 10 && (
            <Text style={styles.moreFollowers}>
              +{followers.length - 10} more followers
            </Text>
          )}
        </View>
      )}

      {showFollowing && following.length > 0 && (
        <View style={styles.followersContainer}>
          <Text style={styles.followersTitle}>Following:</Text>
          {following.slice(0, 10).map((follow) => (
            <View key={follow._id} style={styles.followerItem}>
              <View style={styles.followerAvatar}>
                <Text style={styles.followerInitial}>
                  {follow.name ? follow.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <Text style={styles.followerName}>{follow.name || 'Unknown User'}</Text>
            </View>
          ))}
          {following.length > 10 && (
            <Text style={styles.moreFollowers}>
              +{following.length - 10} more users
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const MyRentalsSection = ({ rentals, onContact }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>My Rentals</Text>
    {rentals.length > 0 ? (
      rentals
        .filter((r) => r && r.item)
        .map((rental) => (
          <View key={rental._id} style={styles.itemRow}>
            <Image
              source={{ uri: rental.item.imageUrl }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{rental.item.name}</Text>
              <Text style={styles.itemSubtext}>
                Rented from {rental.owner.name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => onContact(rental.owner.email, rental.item.name)}
            >
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        ))
    ) : (
      <Text style={styles.emptyText}>You have no active rentals.</Text>
    )}
  </View>
);

const IncomingRequestsSection = ({ requests, onUpdate }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Incoming Rental Requests</Text>
    {requests.length > 0 ? (
      requests
        .filter((req) => req && req.item)
        .map((req) => (
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
                onPress={() => onUpdate(req._id, "declined")}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onUpdate(req._id, "accepted")}
              >
                <Ionicons name="checkmark" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))
    ) : (
      <Text style={styles.emptyText}>You have no new rental requests.</Text>
    )}
  </View>
);

const OutgoingRequestsSection = ({ requests, onRevoke }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>My Rental Requests</Text>
    {requests.length > 0 ? (
      requests
        .filter((req) => req && req.item)
        .map((req) => (
          <View key={req._id} style={styles.itemRow}>
            <Image
              source={{ uri: req.item.imageUrl }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{req.item.name}</Text>
              <Text style={styles.itemSubtext}>Owner: {req.owner.name}</Text>
            </View>
            {req.status === "pending" ? (
              <TouchableOpacity
                style={styles.revokeButton}
                onPress={() => onRevoke(req._id)}
              >
                <Text style={styles.revokeButtonText}>Revoke</Text>
              </TouchableOpacity>
            ) : (
              <StatusPill status={req.status} />
            )}
          </View>
        ))
    ) : (
      <Text style={styles.emptyText}>You haven't requested any items yet.</Text>
    )}
  </View>
);

const MyListingsSection = ({ listings, onDelete, onNavigate }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>My Listings</Text>
    {listings.length > 0 ? (
      listings.map((item) => (
        <TouchableOpacity
          key={item._id}
          style={styles.itemRow}
          onPress={() => onNavigate("ItemDetail", { item })}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          <View style={styles.listingActions}>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => onNavigate("EditItem", { item })}
            >
              <Ionicons name="create-outline" size={22} color="#3498DB" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => onDelete(item._id, item.name)}
            >
              <Ionicons name="trash-outline" size={22} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))
    ) : (
      <Text style={styles.emptyText}>You haven't listed any items yet.</Text>
    )}
  </View>
);

const StatusPill = ({ status }) => {
  const statusStyles = {
    pending: { backgroundColor: "#F1C40F" },
    accepted: { backgroundColor: "#2ECC71" },
    declined: { backgroundColor: "#E74C3C" },
  };
  return (
    <View style={[styles.statusPill, statusStyles[status]]}>
      <Text style={styles.statusPillText}>{status}</Text>
    </View>
  );
};

// --- The Main ProfileScreen Component ---

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [data, setData] = useState({
    listings: [],
    incoming: [],
    outgoing: [],
    rentals: [],
    followers: [],
    following: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [listingsData, incomingData, outgoingData, rentalsData, userProfileData] =
        await Promise.all([
          api(`/items/user/${user.id}`),
          api("/rentals/incoming"),
          api("/rentals/outgoing"),
          api("/rentals/my-rentals"),
          api(`/users/profile/${user.id}`),
        ]);
      setData({
        listings: listingsData,
        incoming: incomingData,
        outgoing: outgoingData,
        rentals: rentalsData,
        followers: userProfileData.followers || [],
        following: userProfileData.following || [],
      });
    } catch (error) {
      console.error("Profile data fetch error:", error);
      
      // Handle authentication errors gracefully
      if (error.message && error.message.includes('Session expired')) {
        // Don't show alert for session expired - user will be redirected to login
        console.log("[PROFILE] Session expired, user will be logged out");
      } else {
        Alert.alert("Error", "Could not fetch your profile data.");
      }
      
      // Set empty data on error to prevent crashes
      setData({
        listings: [],
        incoming: [],
        outgoing: [],
        rentals: [],
        followers: [],
        following: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRequestUpdate = async (rentalId, status) => {
    try {
      await api(`/rentals/${rentalId}/status`, "PUT", { status });
      Alert.alert("Success", `Request has been ${status}.`);
      fetchData();
    } catch (error) {
      Alert.alert("Error", `Failed to ${status} the request.`);
    }
  };

  const handleDeleteItem = (itemId, itemName) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api(`/items/${itemId}`, "DELETE");
              Alert.alert("Success", "Your item has been deleted.");
              fetchData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete the item.");
            }
          },
        },
      ]
    );
  };

  const handleRevokeRequest = (rentalId) => {
    Alert.alert(
      "Revoke Request",
      "Are you sure you want to revoke this rental request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await api(`/rentals/request/${rentalId}`, "DELETE");
              Alert.alert("Success", "Your request has been revoked.");
              fetchData();
            } catch (error) {
              Alert.alert("Error", "Could not revoke the request.");
            }
          },
        },
      ]
    );
  };

  const handleContactOwner = (ownerEmail, itemName) => {
    const url = `mailto:${ownerEmail}?subject=Rental Inquiry for: ${itemName}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open email app.")
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('MyRentals')}
          >
            <Ionicons name="list-circle-outline" size={24} color="#957DAD" />
            <Text style={styles.quickActionText}>Manage Rentals</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#957DAD"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <FollowersSection
              followers={data.followers}
              following={data.following}
            />
            <MyRentalsSection
              rentals={data.rentals}
              onContact={handleContactOwner}
            />
            <IncomingRequestsSection
              requests={data.incoming}
              onUpdate={handleRequestUpdate}
            />
            <OutgoingRequestsSection
              requests={data.outgoing}
              onRevoke={handleRevokeRequest}
            />
            <MyListingsSection
              listings={data.listings}
              onDelete={handleDeleteItem}
              onNavigate={navigation.navigate}
            />
          </>
        )}

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
    position: "relative",
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
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    borderRadius: 12,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
  },
  quickActionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  section: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    minHeight: 70,
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
  status_pending: { backgroundColor: "#F1C40F" },
  status_accepted: { backgroundColor: "#2ECC71" },
  status_declined: { backgroundColor: "#E74C3C" },
  contactButton: {
    backgroundColor: "#3498DB",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 12 },
  listingActions: { flexDirection: "row", alignItems: "center" },
  actionIcon: { 
    padding: 8, 
    borderRadius: 20, 
    backgroundColor: '#f8f9fa',
    marginLeft: 10 
  },
  revokeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#ecf0f1",
  },
  revokeButtonText: { color: "#E74C3C", fontWeight: "600", fontSize: 12 },
  socialStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  socialStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  socialStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  socialStatLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  socialStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  followersContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  followersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 6,
  },
  followerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0BBE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  followerInitial: {
    color: '#4A235A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followerName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  moreFollowers: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },

});

export default ProfileScreen;