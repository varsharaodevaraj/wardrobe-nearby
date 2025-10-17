import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const MyRentalsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [acceptedRentals, setAcceptedRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const [incomingRes, outgoingRes, acceptedRes] = await Promise.all([
        api('/rentals/incoming'),
        api('/rentals/outgoing'),
        api('/rentals/my-rentals')
      ]);

      setIncomingRequests(incomingRes || []);
      setOutgoingRequests(outgoingRes || []);
      setAcceptedRentals(acceptedRes || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load rental data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const navigateToReview = (rental) => {
      navigation.navigate('PostUserReview', { rental });
  };
  
  const handleStatusUpdate = async (rentalId, status) => {
    const message = status === 'accepted' ? 'Accept this rental request?' : status === 'declined' ? 'Decline this rental request?' : 'Mark this rental as completed?';
    Alert.alert('Confirm Action', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
          try {
            await api(`/rentals/${rentalId}/status`, 'PUT', { status });
            Alert.alert('Success', `Request has been ${status}.`);
            fetchData(false);
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update status.');
          }
        }
      }
    ]);
  };

  const handleRevokeRequest = async (rentalId) => {
    Alert.alert("Revoke Request", "Are you sure you want to cancel this rental request?", [
        { text: "No", style: "cancel" },
        { text: "Yes, Revoke", style: "destructive", onPress: async () => {
            try {
                await api(`/rentals/request/${rentalId}`, 'DELETE');
                Alert.alert("Success", "Your rental request has been revoked.");
                fetchData(false);
            } catch (error) {
                Alert.alert("Error", error.message || "Could not revoke request.");
            }
        }}
    ]);
  };

  const renderRequestCard = (request, type) => {
    const isIncoming = type === 'incoming';
    const isOutgoing = type === 'outgoing';
    const displayUser = isIncoming ? request.borrower : request.owner;
    
    const canReview = request.status === 'completed' && (
      (request.owner._id === user.id && !request.hasLenderReviewed) ||
      (request.borrower._id === user.id && !request.hasRenterReviewed)
    );

    return (
      <View key={request._id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Image source={{ uri: request.item?.imageUrl || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
          <View style={styles.requestInfo}>
            <Text style={styles.itemName}>{request.item?.name || 'Unknown'}</Text>
            <Text style={styles.userName}>{isIncoming ? 'From: ' : 'To: '}{displayUser?.name || 'Unknown'}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, styles[`status_${request.status}`]]}>
                <Text style={[styles.statusText, styles[`statusText_${request.status}`]]}>{request.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(request.requestDate).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {request.status === 'pending' && isIncoming && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleStatusUpdate(request._id, 'accepted')}>
              <Ionicons name="checkmark-circle" size={18} color="white" /><Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={() => handleStatusUpdate(request._id, 'declined')}>
              <Ionicons name="close-circle" size={18} color="white" /><Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {request.status === 'pending' && isOutgoing && (
            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.revokeButton]} onPress={() => handleRevokeRequest(request._id)}>
                    <Ionicons name="close-circle" size={18} color="white" /><Text style={styles.actionButtonText}>Revoke Request</Text>
                </TouchableOpacity>
            </View>
        )}
        
        {request.status === 'accepted' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={() => handleStatusUpdate(request._id, 'completed')}>
              <Ionicons name="checkmark-done-circle" size={18} color="white" /><Text style={styles.actionButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {canReview && (
            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.reviewButton]} onPress={() => navigateToReview(request)}>
                    <Ionicons name="star-half" size={18} color="white" /><Text style={styles.actionButtonText}>Review User</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>
    );
  };
  
  const renderTabContent = () => {
    let data, emptyMessage, type;
    switch (activeTab) {
      case 'incoming':
        data = incomingRequests;
        emptyMessage = 'No incoming rental requests';
        type = 'incoming';
        break;
      case 'outgoing':
        data = outgoingRequests;
        emptyMessage = 'No outgoing rental requests';
        type = 'outgoing';
        break;
      case 'accepted':
        data = acceptedRentals;
        emptyMessage = 'No active or completed rentals';
        type = 'accepted';
        break;
      default:
        data = [];
        emptyMessage = '';
        type = '';
    }

    if (data.length === 0 && !loading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        renderItem={({item}) => renderRequestCard(item, type)}
        keyExtractor={(item) => item._id}
        style={styles.requestsList}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#957DAD']} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Rentals</Text>
            <View style={styles.placeholder} />
        </View>

        <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'incoming' && styles.activeTab]} onPress={() => setActiveTab('incoming')}>
              <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>Incoming ({incomingRequests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'outgoing' && styles.activeTab]} onPress={() => setActiveTab('outgoing')}>
              <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>Outgoing ({outgoingRequests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'accepted' && styles.activeTab]} onPress={() => setActiveTab('accepted')}>
              <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>History ({acceptedRentals.length})</Text>
            </TouchableOpacity>
        </View>

        {loading && !refreshing ? <ActivityIndicator size="large" color="#957DAD" style={{flex: 1}} /> : renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  placeholder: { width: 34 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#957DAD' },
  tabText: { fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
  activeTabText: { color: '#957DAD', fontWeight: 'bold' },
  requestsList: { flex: 1, padding: 15 },
  requestCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  requestHeader: { flexDirection: 'row', marginBottom: 10 },
  itemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15 },
  requestInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  userName: { fontSize: 14, color: '#7f8c8d', marginBottom: 8 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  status_pending: { backgroundColor: '#FFF3CD' },
  status_accepted: { backgroundColor: '#D4EDDA' },
  status_declined: { backgroundColor: '#F8D7DA' },
  status_completed: { backgroundColor: '#CCE5FF' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusText_pending: { color: '#856404' },
  statusText_accepted: { color: '#155724' },
  statusText_declined: { color: '#721c24' },
  statusText_completed: { color: '#004085' },
  dateText: { fontSize: 12, color: '#95a5a6' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flex: 1, justifyContent: 'center' },
  acceptButton: { backgroundColor: '#27AE60' },
  declineButton: { backgroundColor: '#E74C3C' },
  completeButton: { backgroundColor: '#3498DB', flex: 1 },
  actionButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginTop: 20, marginBottom: 10, textAlign: 'center' },
  revokeButton: { backgroundColor: '#E74C3C', flex: 1 },
  reviewButton: { backgroundColor: '#F39C12', flex: 1 },
});

export default MyRentalsScreen;