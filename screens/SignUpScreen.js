import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import StyledTextInput from "../components/StyledTextInput";
import { useAuth } from "../context/AuthContext";
import { useCommunity } from "../context/CommunityContext";
import api from "../utils/api";

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [community, setCommunity] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const { signup } = useAuth();
  const {
    communities,
    loading: communitiesLoading,
    fetchCommunities,
  } = useCommunity();
  const [localCommunities, setLocalCommunities] = useState([]);

  useEffect(() => {
    // Initialize local communities and keep it in sync with the context
    setLocalCommunities([...communities].sort());
  }, [communities]);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password || !community) {
      return Alert.alert(
        "Missing Information",
        "Please fill in all fields, including your community."
      );
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password, community);
      Alert.alert("Account Created!", "Please log in to continue.", [
        { text: "Go to Login", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      Alert.alert(
        "Sign-Up Failed",
        error.message || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestCommunity = async () => {
    if (suggestion.trim().length < 3) {
      return Alert.alert(
        "Invalid Name",
        "Community name must be at least 3 characters long."
      );
    }
    setLoading(true);
    const newCommunityName = suggestion.trim();

    try {
      await api("/communities/suggest", "POST", { name: newCommunityName });
      await fetchCommunities(); // Refresh the main list from the server
      Alert.alert(
        "Community Added",
        `"${newCommunityName}" has been added and selected for you.`
      );

      setCommunity(newCommunityName); // Automatically select it
      setSuggestion("");
      setModalVisible(false);
    } catch (error) {
      if (error.message.includes("already exists")) {
        Alert.alert(
          "Community Found",
          `"${newCommunityName}" was already in our system and has been selected for you.`
        );
        // Ensure it's in the local list just in case
        if (!localCommunities.includes(newCommunityName)) {
          setLocalCommunities((prev) => [...prev, newCommunityName].sort());
        }
        setCommunity(newCommunityName);
        setSuggestion("");
        setModalVisible(false);
      } else {
        Alert.alert("Error", error.message || "Could not submit suggestion.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Create Account</Text>
        <StyledTextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
        />
        <StyledTextInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <StyledTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Community / College *</Text>
          {communitiesLoading ? (
            <ActivityIndicator color="#957DAD" />
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={community}
                onValueChange={(itemValue) => setCommunity(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="-- Select your community --" value="" />
                {localCommunities.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.suggestLink}>
            My college/community not listed?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkButton}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Suggest a Community</Text>
            <StyledTextInput
              label="College or Community Name"
              value={suggestion}
              onChangeText={setSuggestion}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSuggestCommunity}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Submit Suggestion</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scrollViewContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 40,
  },
  pickerContainer: { marginBottom: 20 },
  label: { marginBottom: 8, fontSize: 16, color: "#34495e", fontWeight: "500" },
  pickerWrapper: {
    backgroundColor: "#ecf0f1",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: { height: 50, width: "100%" },
  suggestLink: {
    textAlign: "center",
    color: "#957DAD",
    textDecorationLine: "underline",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#E0BBE4",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#4A235A", fontSize: 18, fontWeight: "bold" },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  linkText: { fontSize: 16, color: "#7f8c8d" },
  linkButton: { fontSize: 16, color: "#E0BBE4", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  cancelButton: { padding: 10, alignItems: "center" },
  cancelButtonText: { color: "#7f8c8d" },
});

export default SignUpScreen;
