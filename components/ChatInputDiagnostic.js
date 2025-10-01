import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const ChatInputDiagnostic = () => {
  const [testMessage, setTestMessage] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat Input Diagnostic</Text>
      
      <TextInput
        style={styles.input}
        value={testMessage}
        onChangeText={(text) => {
          console.log('[DIAGNOSTIC] Input changed to:', text);
          setTestMessage(text);
        }}
        placeholder="Test typing here..."
        placeholderTextColor="#999"
        multiline
      />
      
      <Text style={styles.display}>Current value: "{testMessage}"</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          console.log('[DIAGNOSTIC] Clear button pressed');
          setTestMessage('');
        }}
      >
        <Text style={styles.buttonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    minHeight: 40,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  display: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ChatInputDiagnostic;
