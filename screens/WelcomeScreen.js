import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';

const AppLogo = () => (
    <Image
        style={styles.logo}
        source={{ uri: 'https://placehold.co/200x200/FFFFFF/E0BBE4/png?text=WN' }}
        accessibilityLabel="Wardrobe Nearby Logo"
    />
);

// STEP 1: Add { navigation } here to receive the navigation prop.
const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <AppLogo />
        <Text style={styles.title}>Wardrobe Nearby</Text>
        <Text style={styles.subtitle}>Borrow. Lend. Impress.</Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* STEP 2: Use navigation.navigate() in the onPress event. */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')} // This tells the app to go to the "Login" screen
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.signUpButton]}
          onPress={() => navigation.navigate('SignUp')} // This tells the app to go to the "SignUp" screen
        >
          <Text style={[styles.buttonText, styles.signUpButtonText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#E0BBE4',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  buttonText: {
    color: '#4A235A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0BBE4',
  },
  signUpButtonText: {
    color: '#4A235A',
  },
});

export default WelcomeScreen;