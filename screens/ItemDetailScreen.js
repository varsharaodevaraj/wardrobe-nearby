import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// The 'route' prop is automatically passed by React Navigation.
// It contains the data we passed from the previous screen.
const ItemDetailScreen = ({ route, navigation }) => {
  // We extract the 'item' object from the route's parameters.
  const { item } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.description}>
            This is a beautiful, high-quality {item.name.toLowerCase()} perfect for any special occasion. It is maintained in excellent condition and is sure to make you stand out. Rent this stunning piece from a local wardrobe today!
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Price and Rent Button */}
      <View style={styles.footer}>
        <Text style={styles.price}>{`₹${item.price_per_day} / day`}</Text>
        <TouchableOpacity style={styles.rentButton}>
          <Text style={styles.rentButtonText}>Rent Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: 400,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  category: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  rentButton: {
    backgroundColor: '#E0BBE4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  rentButtonText: {
    color: '#4A235A',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ItemDetailScreen;