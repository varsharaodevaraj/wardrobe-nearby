import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StyledTextInput from '../components/StyledTextInput';
import StarRating from '../components/StarRating';
import api from '../utils/api';

const PostUserReviewScreen = ({ route, navigation }) => {
    const { rental } = route.params;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            return Alert.alert("Rating Required", "Please select a star rating.");
        }
        setLoading(true);
        try {
            // Corrected API call with the correct route and object syntax
            await api('/reviews/user-review', 'POST', {
                rentalId: rental._id,
                rating,
                comment,
            });

            Alert.alert("Review Submitted", "Thank you for your feedback!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            Alert.alert("Error", error.message || "Failed to submit your review.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Your Experience</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subHeader}>How was your experience with this transaction?</Text>
                
                <View style={styles.ratingContainer}>
                    <StarRating rating={rating} onRatingChange={setRating} size={40} />
                </View>

                <StyledTextInput 
                    label="Add a comment (optional)" 
                    value={comment} 
                    onChangeText={setComment} 
                    multiline 
                    numberOfLines={4}
                    placeholder="Describe your experience with the user..."
                />
                
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Submit Review</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#2c3e50' },
    content: { padding: 20 },
    subHeader: { fontSize: 16, color: '#34495e', textAlign: 'center', marginBottom: 20 },
    ratingContainer: { alignItems: 'center', marginVertical: 20 },
    submitButton: { backgroundColor: '#957DAD', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default PostUserReviewScreen;