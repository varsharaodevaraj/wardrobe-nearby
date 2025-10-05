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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useCommunity } from "../context/CommunityContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Picker } from '@react-native-picker/picker';
import api from "../utils/api";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { userCommunity, communities, updateUserCommunity, loading: communityLoading } = useCommunity();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(userCommunity || "");

  const fetchData = useCallback(async () => {
    // Data fetching can be added here if more profile data is needed
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleCommunitySave = async () => {
    await updateUserCommunity(selectedCommunity);
    setModalVisible(false);
  };
  
  const handleLeaveCommunity = () => {
    Alert.alert(
      "Leave Community",
      "Are you sure you want to leave your community? Your items will no longer be associated with it.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: async () => {
          await updateUserCommunity(null);
          setModalVisible(false);
        }}
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#957DAD" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.status === 'super-lender' && (
            <View style={styles.superLenderBadge}>
              <Ionicons name="star" size={12} color="#B7950B" />
              <Text style={styles.superLenderText}>Super Lender</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Community</Text>
          <View style={styles.communityContainer}>
            {userCommunity ? (
              <>
                <Text style={styles.communityName}>{userCommunity}</Text>
                <TouchableOpacity onPress={() => { setSelectedCommunity(userCommunity); setModalVisible(true); }}>
                  <Text style={styles.changeButton}>Change</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.noCommunityText}>You haven't joined a community yet.</Text>
                <TouchableOpacity style={styles.joinButton} onPress={() => { setSelectedCommunity(""); setModalVisible(true); }}>
                  <Text style={styles.joinButtonText}>Join Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
        
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Community</Text>
            <Picker
              selectedValue={selectedCommunity}
              onValueChange={(itemValue) => setSelectedCommunity(itemValue)}
            >
              <Picker.Item label="-- Select a community --" value="" />
              {communities.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
            <TouchableOpacity style={styles.saveButton} onPress={handleCommunitySave} disabled={communityLoading}>
              {communityLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </TouchableOpacity>
            {userCommunity && (
              <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCommunity} disabled={communityLoading}>
                <Text style={styles.leaveButtonText}>Leave Community</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { alignItems: "center", paddingVertical: 20, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E9ECEF" },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#957DAD", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  avatarText: { color: "#FFFFFF", fontSize: 36, fontWeight: "bold" },
  userName: { fontSize: 24, fontWeight: "bold", color: "#2c3e50" },
  userEmail: { fontSize: 16, color: "#7f8c8d", marginTop: 4 },
  superLenderBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderColor: '#FFD700', borderWidth: 1, marginTop: 10 },
  superLenderText: { fontSize: 12, color: '#B7950B', marginLeft: 5, fontWeight: '600' },
  section: { marginTop: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E9ECEF' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#34495e', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  sectionText: { flex: 1, fontSize: 16, marginLeft: 15, color: '#2c3e50' },
  communityContainer: { padding: 20 },
  communityName: { fontSize: 16, color: '#2c3e50', fontWeight: '500' },
  changeButton: { fontSize: 14, color: '#957DAD', marginTop: 5, fontWeight: 'bold' },
  noCommunityText: { fontSize: 16, color: '#7f8c8d', fontStyle: 'italic' },
  joinButton: { backgroundColor: '#957DAD', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'flex-start', marginTop: 10 },
  joinButtonText: { color: 'white', fontWeight: 'bold' },
  logoutButton: { margin: 20, marginTop: 30, backgroundColor: "#FFF", paddingVertical: 15, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: '#E74C3C' },
  logoutButtonText: { color: "#E74C3C", fontSize: 16, fontWeight: "bold" },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  saveButton: { backgroundColor: '#957DAD', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  leaveButton: { marginTop: 10, padding: 15, borderRadius: 10, alignItems: 'center' },
  leaveButtonText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { marginTop: 10, padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelButtonText: { color: '#7f8c8d', fontSize: 16 },
});

export default ProfileScreen;