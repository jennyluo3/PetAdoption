import { View, Text, ActivityIndicator } from 'react-native'
import React, { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from './../../constants/Colors'
import { useUser } from '@clerk/clerk-expo'

export default function TabLayout() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      console.log('No user found, redirecting to login...');
      router.replace('/login');
    }
  }, [isLoaded, user, router]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={{ marginTop: 10, fontFamily: 'outfit' }}>Loading...</Text>
      </View>
    );
  }

  // If no user, don't render tabs (will redirect)
  if (!user) {
    return null;
  }
  return (
    <Tabs
    screenOptions={{
      tabBarActiveTintColor:Colors.PRIMARY
    }}
    >
        <Tabs.Screen name='home'
          options={{
            title:'Home',
            headerShown:false,
            tabBarIcon:({color})=><Ionicons name="home" size={24} color={color} />
          }}
        />
        <Tabs.Screen name='favorite'
         options={{
          title:'Favorite',
          headerShown:false,
          tabBarIcon:({color})=><Ionicons name="heart" size={24} color={color} />
        }}
        />
        <Tabs.Screen name='inbox'
        options={{
          title:'Inbox',
          headerShown:false,
          tabBarIcon:({color})=><Ionicons name="chatbubble" size={24} color={color} />
        }}/>
        <Tabs.Screen name='profile'
        options={{
          title:'Profile',
          headerShown:false,
          tabBarIcon:({color})=><Ionicons name="people-circle" size={24} color={color} />
        }}/>

    </Tabs>
  )
}