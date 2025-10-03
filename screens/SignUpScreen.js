import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledTextInput from '../components/StyledTextInput';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/emailValidation';

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { signup } = useAuth();

  // Real-time email validation
  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.trim().length > 0) {
      const validation = validateEmail(text);
      setEmailError(validation.isValid ? '' : validation.error);
    } else {
      setEmailError('');
    }
  };

  const handleSignUp = async () => {
    // Validate all fields
    if (!name.trim()) {
      return Alert.alert("Missing Information", "Please enter your full name.");
    }

    if (name.trim().length < 2) {
      return Alert.alert("Invalid Name", "Name must be at least 2 characters long.");
    }

    if (!email.trim()) {
      return Alert.alert("Missing Information", "Please enter your email address.");
    }

    if (!password) {
      return Alert.alert("Missing Information", "Please enter a password.");
    }

    if (password.length < 6) {
      return Alert.alert("Weak Password", "Password must be at least 6 characters long.");
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return Alert.alert("Invalid Email", emailValidation.error);
    }

    setLoading(true);
    try {
      await signup(name.trim(), emailValidation.email, password);
      
      // Show success message and navigate to login
      Alert.alert(
        "Account Created Successfully!", 
        "Your account has been created. Please log in to continue.",
        [
          {
            text: "Go to Login",
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
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
          
          <StyledTextInput 
            label="Full Name" 
            value={name} 
            onChangeText={setName}
            placeholder="Enter your full name"
          />
          
          <View>
            <StyledTextInput 
              label="Email Address" 
              value={email} 
              onChangeText={handleEmailChange}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>
          
          <StyledTextInput 
            label="Password" 
            value={password} 
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry 
          />
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
  errorText: { 
    fontSize: 14, 
    color: '#e74c3c', 
    marginTop: 5, 
    marginBottom: 10,
    textAlign: 'left' 
  },
});

export default SignUpScreen;