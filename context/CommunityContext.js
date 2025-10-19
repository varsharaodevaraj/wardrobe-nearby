import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CommunityContext = createContext();

export const CommunityProvider = ({ children }) => {
  const { user, updateUserInContext } = useAuth(); // Get updater function
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
    try {
      setLoading(true);
      const { user: updatedUser } = await api('/users/community', 'PUT', { community: newCommunity });
      await updateUserInContext(updatedUser);
      setUserCommunity(updatedUser.community);
    } catch (error) {
        console.error('[COMMUNITY_CONTEXT] Error updating community:', error);
    } finally {
        setLoading(false);
    }
  };

  const value = {
    communities,
    userCommunity,
    updateUserCommunity,
    loading,
    fetchCommunities, // Expose the fetch function
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