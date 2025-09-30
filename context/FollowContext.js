import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';
import { Alert } from 'react-native';

const FollowContext = createContext();

export const FollowProvider = ({ children }) => {
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load initial following status
  const loadFollowingStatus = useCallback(async () => {
    try {
      setLoading(true);
      // We could add an endpoint to get all followed users at once
      // For now, we'll build this set as we check individual users
    } catch (error) {
      console.error('[FOLLOW_CONTEXT] Error loading following status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is following someone
  const isFollowing = useCallback((userId) => {
    return followingUsers.has(userId);
  }, [followingUsers]);

  // Follow a user
  const followUser = useCallback(async (userId, userName) => {
    if (followingUsers.has(userId)) {
      return; // Already following
    }

    try {
      setLoading(true);
      await api(`/users/follow/${userId}`, 'POST');
      
      setFollowingUsers(prev => new Set([...prev, userId]));
      
      Alert.alert("Following", `You are now following ${userName}!`);
      return true;
    } catch (error) {
      console.error('[FOLLOW_CONTEXT] Error following user:', error);
      Alert.alert("Error", "Could not follow user. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [followingUsers]);

  // Unfollow a user
  const unfollowUser = useCallback(async (userId, userName) => {
    if (!followingUsers.has(userId)) {
      return; // Not following
    }

    try {
      setLoading(true);
      await api(`/users/unfollow/${userId}`, 'POST');
      
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      Alert.alert("Unfollowed", `You have unfollowed ${userName}.`);
      return true;
    } catch (error) {
      console.error('[FOLLOW_CONTEXT] Error unfollowing user:', error);
      Alert.alert("Error", "Could not unfollow user. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [followingUsers]);

  // Check follow status for a specific user (and update local state)
  const checkFollowStatus = useCallback(async (userId) => {
    try {
      const followStatus = await api(`/users/following-status/${userId}`);
      
      if (followStatus.isFollowing) {
        setFollowingUsers(prev => new Set([...prev, userId]));
      } else {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
      
      return followStatus.isFollowing;
    } catch (error) {
      console.error('[FOLLOW_CONTEXT] Error checking follow status:', error);
      return false;
    }
  }, []);

  // Toggle follow status
  const toggleFollow = useCallback(async (userId, userName) => {
    const currentlyFollowing = followingUsers.has(userId);
    
    if (currentlyFollowing) {
      return await unfollowUser(userId, userName);
    } else {
      return await followUser(userId, userName);
    }
  }, [followingUsers, followUser, unfollowUser]);

  const value = {
    isFollowing,
    followUser,
    unfollowUser,
    toggleFollow,
    checkFollowStatus,
    loading,
    loadFollowingStatus,
  };

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};