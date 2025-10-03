import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setLogoutCallback } from '../utils/api'; // Import our new API client

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To show a loading screen on app startup

  // This effect runs once when the app starts
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const userJson = await SecureStore.getItemAsync('user');

        if (token && userJson) {
          console.log("[AUTH] Token and user found in storage, setting user state.");
          // Set user immediately - invalid tokens will be handled by API calls
          setUser(JSON.parse(userJson));
        } else {
          console.log("[AUTH] No token/user found in storage.");
        }
      } catch (error) {
        console.error("[AUTH] Error loading user from storage:", error);
        // If there's an error, clear any potentially corrupted data
        try {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
        } catch (clearError) {
          console.error("[AUTH] Error clearing corrupted storage:", clearError);
        }
      } finally {
        setLoading(false);
      }
    };

    // Register the logout callback with the API utility
    setLogoutCallback(logout);

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api('/auth/login', 'POST', { email, password });
      // Now we get user data AND a token from the server
      const loggedInUser = { id: data.user.id, name: data.user.name, email };

      // Save the token and user data to secure storage
      await SecureStore.setItemAsync('token', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(loggedInUser));

      setUser(loggedInUser);
    } catch (error) {
      console.error("[AUTH] Login Error:", error);
      throw error;
    }
  };
  
  const signup = async (name, email, password) => {
    try {
      await api('/auth/signup', 'POST', { name, email, password });
      // Note: User must now log in manually after signup
      console.log("[AUTH] User registered successfully. Please log in to continue.");
    } catch (error) {
      console.error("[AUTH] Signup Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("[AUTH] Logging out user");
    // Delete the token and user data from storage
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error("[AUTH] Error clearing storage during logout:", error);
    }
    setUser(null);
  };

  // If the app is still checking for a token, we can show a loading screen
  if (loading) {
    // You can replace this with a proper splash screen component later
    return null; 
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);