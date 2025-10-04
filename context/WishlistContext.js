import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  // Store the full item objects in the wishlist
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const items = await api('/users/wishlist');
      setWishlistItems(items || []);
    } catch (error) {
      console.error('[WISHLIST_CONTEXT] Error loading wishlist:', error);
      setWishlistItems([]); // Reset on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlistItems([]); // Clear wishlist on logout
    }
  }, [user, loadWishlist]);

  const isInWishlist = useCallback((itemId) => {
    return wishlistItems.some(item => item._id === itemId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (item) => {
    const inWishlist = isInWishlist(item._id);
    setLoading(true);
    try {
      if (inWishlist) {
        await api(`/users/wishlist/${item._id}`, 'DELETE');
        setWishlistItems(prev => prev.filter(i => i._id !== item._id));
      } else {
        await api(`/users/wishlist/${item._id}`, 'POST');
        setWishlistItems(prev => [...prev, item]);
      }
    } catch (error) {
      console.error('[WISHLIST_CONTEXT] Error toggling wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [isInWishlist]);

  const value = {
    wishlistItems,
    loading,
    isInWishlist,
    toggleWishlist,
    loadWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};