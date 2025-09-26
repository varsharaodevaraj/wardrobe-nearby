import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledTextInput from '../components/StyledTextInput';
import { useAuth } from '../context/AuthContext';

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      return Alert.alert("Missing Information", "Please fill in all fields.");
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      // Navigation will happen automatically due to auth state change in App.js
      console.log("[SIGNUP] User signed up successfully, navigation handled by App.js");
    } catch (error) {
      Alert.alert("Sign-Up Failed", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your style journey</Text>
          <StyledTextInput label="Full Name" value={name} onChangeText={setName} />
          <StyledTextInput label="Email Address" value={email} onChangeText={setEmail} />
          <StyledTextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>
          
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkButton}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#7f8c8d', textAlign: 'center', marginBottom: 40 },
  button: { backgroundColor: '#E0BBE4', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#4A235A', fontSize: 18, fontWeight: 'bold' },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { fontSize: 16, color: '#7f8c8d' },
  linkButton: { fontSize: 16, color: '#E0BBE4', fontWeight: 'bold' },
});

export default SignUpScreen;