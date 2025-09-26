import React, { createContext, useState, useContext } from 'react';

const API_URL = 'http://10.51.8.5:3000/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  console.log("[AUTH_CONTEXT] Current user state:", user);

  const login = async (email, password) => {
    try {
      console.log(`[AUTH] Attempting to login to: ${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      console.log("[AUTH] Login successful!");
      setUser({ id: data.user.id, name: data.user.name, email });
    } catch (error) {
      console.error("[AUTH] Login Error:", error);
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Please check your internet connection and make sure the server is running.');
      }
      throw error;
    }
  };
  
  const signup = async (name, email, password) => {
    try {
      console.log(`[AUTH] Attempting to signup to: ${API_URL}/auth/signup`);
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Sign up failed');
      }
      console.log("[AUTH] Signup successful, now logging in...");
      await login(email, password);
    } catch (error) {
      console.error("[AUTH] Signup Error:", error);
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Please check your internet connection and make sure the server is running.');
      }
      throw error;
    }
  };

  const logout = () => { setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);