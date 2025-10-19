import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setLogoutCallback } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const userJson = await SecureStore.getItemAsync('user');
        if (token && userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error("[AUTH] Error loading user from storage:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api('/auth/login', 'POST', { email, password });
      const loggedInUser = data.user;
      await SecureStore.setItemAsync('token', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } catch (error) {
      console.error("[AUTH] Login Error:", error);
      throw error;
    }
  };
  
  // --- THIS IS THE CORRECTED FUNCTION ---
  const signup = async (name, email, password, community) => {
    try {
      // It now correctly includes 'community' in the API call
      await api('/auth/signup', 'POST', { name, email, password, community });
    } catch (error) {
      console.error("[AUTH] Signup Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error("[AUTH] Error clearing storage during logout:", error);
    }
    setUser(null);
  };
  
  const updateUserInContext = async (newUserData) => {
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error("[AUTH] Error updating user in context:", error);
    }
  };

  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);