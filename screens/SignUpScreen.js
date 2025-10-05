import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
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
    if (!name.trim() || !email.trim() || !password) {
      return Alert.alert("Missing Information", "Please fill in all fields.");
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      Alert.alert(
        "Account Created!", 
        "Please log in to continue.",
        [{ text: "Go to Login", onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert("Sign-Up Failed", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Create Account</Text>
        <StyledTextInput label="Full Name" value={name} onChangeText={setName} />
        <StyledTextInput label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 40 },
  button: { backgroundColor: '#E0BBE4', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#4A235A', fontSize: 18, fontWeight: 'bold' },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { fontSize: 16, color: '#7f8c8d' },
  linkButton: { fontSize: 16, color: '#E0BBE4', fontWeight: 'bold' },
});

export default SignUpScreen;