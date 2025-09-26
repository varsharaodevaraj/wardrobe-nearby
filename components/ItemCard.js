import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// We receive 'item' as a prop.
const ItemCard = React.memo(({ item }) => {
  const navigation = useNavigation();
  const [imageError, setImageError] = useState(false);

  // --- HANDLE PRESS EVENT ---
  const handlePress = useCallback(() => {
    // Navigate to the 'ItemDetail' screen and pass the 'item' object as a parameter.
    navigation.navigate('ItemDetail', { item: item });
  }, [navigation, item]);

  const handleImageError = useCallback((e) => {
    console.log('[ITEMCARD] Image load error for:', item.imageUrl, e.nativeEvent.error);
    console.log('[ITEMCARD] Switching to fallback image');
    setImageError(true);
  }, [item.imageUrl]);

  // Fallback image for when the main image fails to load
  const fallbackImageUrl = 'https://dummyimage.com/600x400/E0BBE4/4A235A&text=No+Image';
  
  // Check if the URL is from placehold.co (which can be unreliable)
  const isUnreliableUrl = item.imageUrl && item.imageUrl.includes('placehold.co');
  const displayUrl = isUnreliableUrl || imageError ? fallbackImageUrl : item.imageUrl;

  return (
    // --- ATTACH ONPRESS HANDLER ---
    <TouchableOpacity style={styles.cardContainer} onPress={handlePress}>
      <Image 
        source={{ uri: displayUrl }} 
        style={styles.image}
        onLoad={() => console.log('[ITEMCARD] Image loaded successfully:', displayUrl)}
        onError={handleImageError}
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>{`₹${item.price_per_day} / day`}</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: 200,
    },
    infoContainer: {
        padding: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
    },
    category: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 8,
        textAlign: 'right',
    },
});

export default ItemCard;