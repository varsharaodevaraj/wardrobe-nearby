import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../utils/api";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const profileData = await api(`/users/profile/${user.id}`);
      setUserProfile(profileData);
    } catch (error) {
      console.error("Profile data fetch error:", error);
      Alert.alert("Error", "Could not fetch your profile data.");
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

  const handlePlaceholder = (feature) => {
    Alert.alert(`${feature}`, "This feature is coming soon!");
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#957DAD" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {userProfile?.status === 'super-lender' && (
            <View style={styles.superLenderBadge}>
              <Ionicons name="star" size={12} color="#B7950B" />
              <Text style={styles.superLenderText}>Super Lender</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionItem} onPress={() => navigation.navigate('MyListings')}>
            <Ionicons name="pricetags-outline" size={22} color="#4A235A" />
            <Text style={styles.sectionText}>My Listings</Text>
            <Ionicons name="chevron-forward" size={22} color="#CED4DA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem} onPress={() => navigation.navigate('MyRentals')}>
            <Ionicons name="list-outline" size={22} color="#4A235A" />
            <Text style={styles.sectionText}>My Rentals</Text>
            <Ionicons name="chevron-forward" size={22} color="#CED4DA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem} onPress={() => navigation.navigate('Wishlist')}>
            <Ionicons name="heart-outline" size={22} color="#4A235A" />
            <Text style={styles.sectionText}>My Wishlist</Text>
            <Ionicons name="chevron-forward" size={22} color="#CED4DA" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionItem} onPress={() => handlePlaceholder('Edit Profile')}>
            <Ionicons name="person-outline" size={22} color="#4A235A" />
            <Text style={styles.sectionText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={22} color="#CED4DA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem} onPress={() => handlePlaceholder('Settings')}>
            <Ionicons name="settings-outline" size={22} color="#4A235A" />
            <Text style={styles.sectionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={22} color="#CED4DA" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionItem} onPress={() => handlePlaceholder('Support')}>
            <Ionicons name="help-circle-outline" size={22} color="#4A235A" />
            <Text style={styles.sectionText}>Support</Text>
            <Ionicons name="chevron-forward" size={22} color="#CED4DA" />
          </TouchableOpacity>
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
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#957DAD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { color: "#FFFFFF", fontSize: 36, fontWeight: "bold" },
  userName: { fontSize: 24, fontWeight: "bold", color: "#2c3e50" },
  userEmail: { fontSize: 16, color: "#7f8c8d", marginTop: 4 },
  superLenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderColor: '#FFD700',
    borderWidth: 1,
    marginTop: 10,
  },
  superLenderText: {
    fontSize: 12,
    color: '#B7950B',
    marginLeft: 5,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  sectionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#2c3e50',
  },
  logoutButton: {
    margin: 20,
    marginTop: 30,
    backgroundColor: "#FFF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  logoutButtonText: { color: "#E74C3C", fontSize: 16, fontWeight: "bold" },
});

export default ProfileScreen;