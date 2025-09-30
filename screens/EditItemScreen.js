import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StyledTextInput from "../components/StyledTextInput";
import api from "../utils/api";

const EditItemScreen = ({ route, navigation }) => {
  // Receive the item to edit from the navigation parameters
  const { item } = route.params;

  // Initialize state with the existing item's data
  const [itemName, setItemName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price_per_day.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemName || !category || !description || !price) {
      return Alert.alert("Incomplete Form", "Please fill in all fields.");
    }
    setLoading(true);
    try {
      const updatedData = {
        name: itemName,
        category,
        description,
        price_per_day: parseFloat(price),
      };

      // Call the new PUT endpoint with the item's ID
      await api(`/items/${item._id}`, "PUT", updatedData);

      Alert.alert("Success!", "Your item has been updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("[EDIT_ITEM] Error:", error);
      Alert.alert("Error", error.message || "Failed to update item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Edit Your Item</Text>

        <StyledTextInput
          label="Item Name"
          value={itemName}
          onChangeText={setItemName}
        />
        <StyledTextInput
          label="Category"
          value={category}
          onChangeText={setCategory}
        />
        <StyledTextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <StyledTextInput
          label="Price per day (₹)"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollViewContent: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: "#957DAD",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: { backgroundColor: "#CED4DA" },
  submitButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});

export default EditItemScreen;