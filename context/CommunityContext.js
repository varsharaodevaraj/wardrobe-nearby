import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CommunityContext = createContext();

export const CommunityProvider = ({ children }) => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [userCommunity, setUserCommunity] = useState(user?.community || null);
  const [loading, setLoading] = useState(false);

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api('/communities');
      setCommunities(data || []);
    } catch (error) {
      console.error('[COMMUNITY_CONTEXT] Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  useEffect(() => {
    setUserCommunity(user?.community || null);
  }, [user]);

  const updateUserCommunity = async (newCommunity) => {
    // In a real app, you would make an API call here to update the user's profile
    setUserCommunity(newCommunity);
    // You might need to update the user object in AuthContext as well
  };

  const value = {
    communities,
    userCommunity,
    updateUserCommunity,
    loading,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};