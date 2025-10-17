import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { RentalProvider } from "./context/RentalContext";
import { ChatProvider, useChatContext } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CommunityProvider } from "./context/CommunityContext";
import ErrorBoundary from "./components/ErrorBoundary";
import MessageBadge from "./components/MessageBadge";

// Screen imports
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import HomeScreen from "./screens/HomeScreen";
import AddItemScreen from "./screens/AddItemScreen";
import ItemDetailScreen from "./screens/ItemDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import MyRentalsScreen from "./screens/MyRentalsScreen";
import WishlistScreen from "./screens/WishlistScreen";
import MyListingsScreen from "./screens/MyListingsScreen";
import EditItemScreen from "./screens/EditItemScreen";
import PostUserReviewScreen from "./screens/PostUserReviewScreen";


const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainFlow() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="EditItem" component={EditItemScreen} />
      <MainStack.Screen name="Chat" component={ChatScreen} />
      <MainStack.Screen name="MyRentals" component={MyRentalsScreen} />
      <MainStack.Screen name="Wishlist" component={WishlistScreen} />
      <MainStack.Screen name="MyListings" component={MyListingsScreen} />
      <MainStack.Screen name="PostUserReview" component={PostUserReviewScreen} />
    </MainStack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { totalUnreadCount } = useChatContext();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#957DAD',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 5),
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
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ tabBarLabel: 'List Item', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Messages"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="chatbubble-outline" size={size} color={color} />
              <MessageBadge count={totalUnreadCount} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

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

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <CommunityProvider>
            <WishlistProvider>
              <RentalProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <AppNavigator />
                  </ChatProvider>
                </NotificationProvider>
              </RentalProvider>
            </WishlistProvider>
          </CommunityProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}