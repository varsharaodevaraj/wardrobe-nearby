import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from "./context/AuthContext";
import { FollowProvider } from "./context/FollowContext";
import { RentalProvider } from "./context/RentalContext";
import { ChatProvider } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Import all screens
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import HomeScreen from "./screens/HomeScreen";
import AddItemScreen from "./screens/AddItemScreen";
import ItemDetailScreen from "./screens/ItemDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AddStoryScreen from "./screens/AddStoryScreen";
import StoryViewerScreen from "./screens/StoryViewerScreen";
import EditItemScreen from "./screens/EditItemScreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import MyRentalsScreen from "./screens/MyRentalsScreen";

// Enhanced screens (optional - for testing new features)
import AddItemScreenEnhanced from "./screens/AddItemScreenEnhanced";
import ItemDetailScreenEnhanced from "./screens/ItemDetailScreenEnhanced";

// Import simple connectivity test
import { quickNetworkCheck } from "./config/simpleNetworkTest";

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// This stack contains the main app tabs and all screens accessible to a logged-in user
function MainFlow() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="ItemDetail" component={ItemDetailScreenEnhanced} />
      <MainStack.Screen name="ItemDetailBasic" component={ItemDetailScreen} />
      <MainStack.Screen name="EditItem" component={EditItemScreen} />
      <MainStack.Screen name="AddStory" component={AddStoryScreen} options={{ presentation: 'modal' }} />
      <MainStack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ presentation: 'modal' }} />
      <MainStack.Screen name="Chat" component={ChatScreen} />
      <MainStack.Screen name="MyRentals" component={MyRentalsScreen} />
    </MainStack.Navigator>
  );
}

// This is the main Tab Navigator for logged-in users
function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#957DAD',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
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
        name="Messages" 
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
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

// This component decides whether to show the auth flow or the main app
function AppNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {user ? (
        <MainFlow />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

// This is the root component of your entire application
export default function App() {
  // Run connectivity test on app startup
  React.useEffect(() => {
    console.log('🚀 [APP] WardrobeNearby starting up...');
    
    // Simple network connectivity test
    setTimeout(() => {
      quickNetworkCheck().then(result => {
        if (result.success) {
          console.log('🎉 [APP] Network connectivity verified on startup');
        } else {
          console.warn('⚠️  [APP] Network connectivity issues on startup:', result.error);
        }
      });
    }, 2000);
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <FollowProvider>
            <RentalProvider>
              <NotificationProvider>
                <ChatProvider>
                  <AppNavigator />
                </ChatProvider>
              </NotificationProvider>
            </RentalProvider>
          </FollowProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}