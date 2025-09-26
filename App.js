import React, { Suspense } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load screens for better performance
const WelcomeScreen = React.lazy(() => import("./screens/WelcomeScreen"));
const LoginScreen = React.lazy(() => import("./screens/LoginScreen"));
const SignUpScreen = React.lazy(() => import("./screens/SignUpScreen"));
const HomeScreen = React.lazy(() => import("./screens/HomeScreen"));
const AddItemScreen = React.lazy(() => import("./screens/AddItemScreen"));
const ItemDetailScreen = React.lazy(() => import("./screens/ItemDetailScreen"));
const ProfileScreen = React.lazy(() => import("./screens/ProfileScreen"));
const AddStoryScreen = React.lazy(() => import("./screens/AddStoryScreen"));
const StoryViewerScreen = React.lazy(() => import("./screens/StoryViewerScreen"));

// Loading component
const LoadingScreen = () => (
  <View style={loadingStyles.container}>
    <ActivityIndicator size="large" color="#957DAD" />
  </View>
);

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainFlow() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <MainStack.Screen name="AddStory" component={AddStoryScreen} options={{ presentation: 'modal' }} />
      <MainStack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ presentation: 'modal' }} />
    </MainStack.Navigator>
  );
}

// This is the main Tab Navigator for logged-in users.
function MainTabs() {
  const insets = useSafeAreaInsets(); // Hook to get safe area dimensions for proper padding

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#957DAD',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          paddingBottom: insets.bottom, // Dynamic padding for iPhone safe area
          height: 60 + insets.bottom,   // Adjust total height accordingly
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Explore" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="AddItem" 
        component={AddItemScreen}
        options={{
          tabBarLabel: 'Add Item',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// This component decides whether to show the login/signup screens or the main app
function AppNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Suspense fallback={<LoadingScreen />}>
        {user ? (
          // If user is logged in, show the main app flow
          <MainFlow />
        ) : (
          // If no user, show the authentication flow
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="SignUp" component={SignUpScreen} />
          </AuthStack.Navigator>
        )}
      </Suspense>
    </NavigationContainer>
  );
}

// This is the root component of your entire application
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