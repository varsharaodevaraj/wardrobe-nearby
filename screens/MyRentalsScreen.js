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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import RentalNotification from '../components/RentalNotification';

const { width } = Dimensions.get('window');

const MyRentalsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming'); // incoming, outgoing, accepted
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [acceptedRentals, setAcceptedRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState({ visible: false, type: '', itemName: '' });

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
      console.error('Error fetching rental data:', error);
      Alert.alert('Error', 'Failed to load rental data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateToReview = (itemId) => {
    navigation.navigate('ItemDetail', { 
      item: { _id: itemId },
      focusReview: true // Flag to focus on review section
    });
  };

  const navigateToRentals = () => {
    // Already on MyRentals screen, just close notification
    setNotification({ ...notification, visible: false });
  };

  const handleStatusUpdate = async (rentalId, status) => {
    try {
      const message = status === 'accepted' 
        ? 'Are you sure you want to accept this rental request?'
        : status === 'declined'
        ? 'Are you sure you want to decline this rental request?'
        : 'Are you sure you want to mark this rental as completed?';

      Alert.alert(
        'Confirm Action',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                const response = await api(`/rentals/${rentalId}/status`, 'PUT', { status });
                
                // Show notification for different status updates
                if (status === 'accepted') {
                  const rental = [...incomingRequests, ...outgoingRequests, ...acceptedRentals]
                    .find(r => r._id === rentalId);
                  
                  setNotification({
                    visible: true,
                    type: 'accepted',
                    itemName: rental?.item?.name || 'Item',
                    itemId: rental?.item?._id
                  });
                } else if (status === 'completed') {
                  const rental = acceptedRentals.find(r => r._id === rentalId);
                  setNotification({
                    visible: true,
                    type: 'completed',
                    itemName: rental?.item?.name || 'Item',
                    itemId: rental?.item?._id
                  });
                } else {
                  Alert.alert('Success', `Request has been ${status}.`);
                }
                
                fetchData(false); // Refresh data without loader
              } catch (error) {
                console.error('Error updating status:', error);
                Alert.alert('Error', error.message || 'Failed to update request status.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error);
    }
  };

  const renderRequestCard = (request, type) => {
    const isIncoming = type === 'incoming';
    const isAccepted = type === 'accepted';
    const displayUser = isIncoming ? request.borrower : request.owner;
    
    return (
      <View key={request._id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Image 
            source={{ uri: request.item?.imageUrl || 'https://via.placeholder.com/100' }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          <View style={styles.requestInfo}>
            <Text style={styles.itemName}>{request.item?.name || 'Unknown Item'}</Text>
            <Text style={styles.userName}>
              {isIncoming ? 'Requested by: ' : 'From: '}{displayUser?.name || 'Unknown User'}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge, 
                styles[`status_${request.status}`]
              ]}>
                <Text style={[
                  styles.statusText,
                  styles[`statusText_${request.status}`]
                ]}>
                  {request.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(request.requestDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {request.status === 'pending' && isIncoming && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleStatusUpdate(request._id, 'accepted')}
            >
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleStatusUpdate(request._id, 'declined')}
            >
              <Ionicons name="close-circle" size={18} color="white" />
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'accepted' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusUpdate(request._id, 'completed')}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="white" />
              <Text style={styles.actionButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    let data = [];
    let emptyMessage = '';
    let type = activeTab;

    switch (activeTab) {
      case 'incoming':
        data = incomingRequests;
        emptyMessage = 'No incoming rental requests';
        break;
      case 'outgoing':
        data = outgoingRequests;
        emptyMessage = 'No outgoing rental requests';
        break;
      case 'accepted':
        data = acceptedRentals;
        emptyMessage = 'No accepted rentals';
        break;
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>{emptyMessage}</Text>
          <Text style={styles.emptyMessage}>
            {activeTab === 'incoming' 
              ? 'Rental requests from other users will appear here'
              : activeTab === 'outgoing'
              ? 'Your rental requests to other users will appear here'
              : 'Accepted rentals will appear here'
            }
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.requestsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData(false);
            }}
            colors={['#957DAD']}
          />
        }
      >
        {data.map(request => renderRequestCard(request, type))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#957DAD" />
        <Text style={styles.loadingText}>Loading rental data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rental Status Notification */}
      <RentalNotification
        visible={notification.visible}
        type={notification.type}
        itemName={notification.itemName}
        onNavigateToReview={() => navigateToReview(notification.itemId)}
        onNavigateToRentals={navigateToRentals}
        onDismiss={() => setNotification({ ...notification, visible: false })}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rentals</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
            Incoming ({incomingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'outgoing' && styles.activeTab]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>
            Outgoing ({outgoingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            Active ({acceptedRentals.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  placeholder: {
    width: 34,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#957DAD',
  },
  tabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#957DAD',
    fontWeight: 'bold',
  },
  requestsList: {
    flex: 1,
    padding: 15,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
  },
  requestInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userName: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_pending: {
    backgroundColor: '#FFF3CD',
  },
  status_accepted: {
    backgroundColor: '#D4EDDA',
  },
  status_declined: {
    backgroundColor: '#F8D7DA',
  },
  status_completed: {
    backgroundColor: '#CCE5FF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText_pending: {
    color: '#856404',
  },
  statusText_accepted: {
    color: '#155724',
  },
  statusText_declined: {
    color: '#721c24',
  },
  statusText_completed: {
    color: '#004085',
  },
  dateText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#27AE60',
  },
  declineButton: {
    backgroundColor: '#E74C3C',
  },
  completeButton: {
    backgroundColor: '#3498DB',
    flex: 1,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MyRentalsScreen;
