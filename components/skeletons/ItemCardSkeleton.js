import React from 'react';
import { View, StyleSheet } from 'react-native';

const SkeletonPiece = ({ style }) => <View style={[styles.skeleton, style]} />;

const ItemCardSkeleton = () => {
  return (
    <View style={styles.cardContainer}>
      <SkeletonPiece style={styles.image} />
      <View style={styles.infoContainer}>
        <SkeletonPiece style={{ width: '70%', height: 20, marginBottom: 8 }} />
        <SkeletonPiece style={{ width: '40%', height: 16, marginBottom: 12 }} />
        <SkeletonPiece style={{ width: '90%', height: 14, marginBottom: 6 }} />
        <SkeletonPiece style={{ width: '80%', height: 14, marginBottom: 12 }} />
        <View style={styles.footer}>
          <SkeletonPiece style={{ width: '30%', height: 18 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderRadius: 0,
  },
  infoContainer: {
    padding: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});

export default ItemCardSkeleton;