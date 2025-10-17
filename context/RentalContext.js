import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const RentalContext = createContext();

export const RentalProvider = ({ children }) => {
  const { user } = useAuth();
  const [rentalStates, setRentalStates] = useState(new Map());
  const [loading, setLoading] = useState(false);

  const checkRentalStatus = useCallback(async (itemId) => {
    if (!user) return false;
    try {
      setLoading(true);
      const requests = await api('/rentals/outgoing');
      const hasRequested = requests.some(
        request => request.item._id === itemId && (request.status === 'pending' || request.status === 'accepted')
      );
      
      setRentalStates(prev => new Map(prev).set(itemId, hasRequested));
      return hasRequested;
    } catch (error) {
      console.error('[RENTAL_CONTEXT] Error checking rental status:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const submitRentalRequest = useCallback(async (itemId, customMessage = '') => {
    try {
      setLoading(true);
      
      const currentStatus = rentalStates.get(itemId);
      if (currentStatus) {
        return { 
          success: false, 
          message: 'You have already sent a request for this item.' 
        };
      }
      
      const requestData = {
        itemId,
        customMessage: customMessage.trim() || 'Hi! I\'m interested in renting this item.'
      };

      console.log('[RENTAL_CONTEXT] Submitting rental request:', requestData);
      // The API call will throw an error if the request already exists on the server.
      await api('/rentals/request', 'POST', requestData);
      
      // Only update the state after the API call succeeds
      setRentalStates(prev => new Map(prev).set(itemId, true));
      
      return { success: true, message: 'Rental request sent successfully!' };
    } catch (error) {
      console.error('[RENTAL_CONTEXT] Error submitting rental request:', error);
      
      // If the error is about already requesting, update our local state to be in sync.
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

  const getRentalStatus = useCallback((itemId) => {
    return rentalStates.get(itemId) || false;
  }, [rentalStates]);

  const clearRentalStatus = useCallback((itemId) => {
    setRentalStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  }, []);

  const loadAllRentalStatuses = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const requests = await api('/rentals/outgoing');
      const newStates = new Map();
      
      requests.forEach(request => {
        if (request.status === 'pending' || request.status === 'accepted') {
          newStates.set(request.item._id, true);
        }
      });
      
      setRentalStates(newStates);
    } catch (error) {
      console.error('[RENTAL_CONTEXT] Error loading rental statuses:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAllRentalStatuses();
    } else {
      setRentalStates(new Map());
    }
  }, [user, loadAllRentalStatuses]);

  const value = {
    loading,
    submitRentalRequest,
    getRentalStatus,
    checkRentalStatus,
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