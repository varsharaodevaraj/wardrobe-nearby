import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import HomeScreen from "./screens/HomeScreen";
import AddItemScreen from "./screens/AddItemScreen";
import ItemDetailScreen from "./screens/ItemDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main App Tabs (for logged in users)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E0BBE4',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 12, fontWeight: 'bold' }}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="AddItem" 
        component={AddItemScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 12, fontWeight: 'bold' }}>➕</Text>,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 12, fontWeight: 'bold' }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// Create the navigation component that uses auth state
function AppNavigator() {
  const { user } = useAuth();

  console.log("[APP] User state:", user ? "Authenticated" : "Not authenticated");

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is logged in - show main app with tabs
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
          </>
        ) : (
          // User is not logged in - show auth screens
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}