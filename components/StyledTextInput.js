import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

const StyledTextInput = ({ label, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#A9A9A9"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20, width: '100%' },
  label: { marginBottom: 8, fontSize: 16, color: '#34495e', fontWeight: '500' },
  input: { backgroundColor: '#ecf0f1', borderRadius: 10, padding: 15, fontSize: 16 },
});

export default StyledTextInput;