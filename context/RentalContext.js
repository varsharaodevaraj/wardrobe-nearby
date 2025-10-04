import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const RentalContext = createContext();

export const RentalProvider = ({ children }) => {
  const { user } = useAuth();
  // Track rental request states for different items
  const [rentalStates, setRentalStates] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Check if user has already requested a specific item
  const checkRentalStatus = useCallback(async (itemId) => {
    try {
      setLoading(true);
      const requests = await api('/rentals/outgoing?status=pending');
      const hasRequested = requests.some(
        request => request.item._id === itemId
      );
      
      setRentalStates(prev => new Map(prev).set(itemId, hasRequested));
      return hasRequested;
    } catch (error) {
      console.error('[RENTAL_CONTEXT] Error checking rental status:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit a rental request
  const submitRentalRequest = useCallback(async (itemId, customMessage = '') => {
    try {
      setLoading(true);
      
      // Check if already requested first
      const currentStatus = rentalStates.get(itemId);
      if (currentStatus) {
        return { 
          success: false, 
          message: 'You have already sent a request for this item. Please wait for the owner to respond.' 
        };
      }
      
      const requestData = {
        itemId,
        customMessage: customMessage.trim() || 'Hi! I\'m interested in renting this item.'
      };

      console.log('[RENTAL_CONTEXT] Submitting rental request:', requestData);
      await api('/rentals/request', 'POST', requestData);
      
      // Update the state to reflect that request has been sent
      setRentalStates(prev => new Map(prev).set(itemId, true));
      
      return { success: true, message: 'Rental request sent successfully!' };
    } catch (error) {
      console.error('[RENTAL_CONTEXT] Error submitting rental request:', error);
      
      // If the error is about already requesting, update our local state
      if (error.message && error.message.includes('already sent a request')) {
        setRentalStates(prev => new Map(prev).set(itemId, true));
      }
      
      return { 
        success: false, 
        message: error.message || 'Failed to send rental request. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  }, [rentalStates]);

  // Get rental status for a specific item
  const getRentalStatus = useCallback((itemId) => {
    return rentalStates.get(itemId) || false;
  }, [rentalStates]);

  // Clear rental status (useful for testing or when request is cancelled)
  const clearRentalStatus = useCallback((itemId) => {
    setRentalStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  }, []);

  // Load all rental statuses for current user
  const loadAllRentalStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const requests = await api('/rentals/outgoing?status=pending');
      const newStates = new Map();
      
      requests.forEach(request => {
        newStates.set(request.item._id, true);
      });
      
      setRentalStates(newStates);
      return newStates;
    } catch (error) {
      console.error('[RENTAL_CONTEXT] Error loading rental statuses:', error);
      return new Map();
    } finally {
      setLoading(false);
    }
  }, []);

  // Load rental statuses when user changes
  useEffect(() => {
    if (user) {
      loadAllRentalStatuses();
    } else {
      // Clear rental states when user logs out
      setRentalStates(new Map());
    }
  }, [user, loadAllRentalStatuses]);

  const value = {
    // State
    loading,
    
    // Functions
    checkRentalStatus,
    submitRentalRequest,
    getRentalStatus,
    clearRentalStatus,
    loadAllRentalStatuses,
  };

  return (
    <RentalContext.Provider value={value}>
      {children}
    </RentalContext.Provider>
  );
};

export const useRental = () => {
  const context = useContext(RentalContext);
  if (!context) {
    throw new Error('useRental must be used within a RentalProvider');
  }
  return context;
};

export default RentalContext;
