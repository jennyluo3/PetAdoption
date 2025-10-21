import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import Colors from './../../constants/Colors';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth, useSignIn, useUser } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Only warm up browser on native platforms (not web)
    if (Platform.OS !== 'web') {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);
};

// Required for Expo WebBrowser session handling (web only)
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const { height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Define onPress callback before any conditional returns
  const onPress = useCallback(async () => {
    try {
      console.log('Get Started button clicked - starting OAuth flow...');
      console.log('Platform:', Platform.OS);
      
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Platform.OS === 'web' 
          ? `${window.location.origin}/(tabs)/home`
          : Linking.createURL('/(tabs)/home', { scheme: 'myapp' }),
      });

      console.log('OAuth flow completed. Session ID:', createdSessionId);

      if (createdSessionId) {
        console.log('Activating session...');
        await setActive({ session: createdSessionId });
        console.log('Google login successful, session activated.');
      } else {
        console.warn('Google OAuth flow did not create a session.');
        // For mobile, try to redirect anyway if no session was created
        if (Platform.OS !== 'web') {
          console.log('Mobile: Redirecting to home despite no session...');
          router.replace('/(tabs)/home');
        }
      }
    } catch (err) {
      console.error('OAuth error', err);
      console.error('Error details:', err.message);
      console.error('Error stack:', err.stack);
      
      // Handle specific error cases
      if (err.message.includes("already signed in") || err.message.includes("already authenticated")) {
        console.log('User already signed in, redirecting to home...');
        router.replace('/(tabs)/home');
        return;
      }
      
      // Show user-friendly error message for other errors
      if (Platform.OS === 'web') {
        alert(`Login failed: ${err.message}`);
      } else {
        Alert.alert('Login Error', `Failed to login: ${err.message}`);
      }
    }
  }, [startOAuthFlow, router]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isLoaded && user) {
      console.log('User already authenticated, redirecting to home...');
      router.replace('/(tabs)/home');
    }
  }, [user, isLoaded, router]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE 
      }}>
        <Text style={{ fontFamily: 'outfit-medium', fontSize: 18 }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Don't render login screen if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <ScrollView
      style={{ backgroundColor: Colors.WHITE }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View
        style={{
          minHeight: screenHeight,
          justifyContent: 'space-between',
        }}
      >
        {/* Top Image */}
        <Image
          source={require('./../../assets/images/login.png')}
          style={{
            width: '100%',
            height: 400, // Reduced height for better visibility
            resizeMode: 'contain',
          }}
        />

        {/* Text and Button Section */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'outfit-bold',
              fontSize: 30,
              textAlign: 'center',
            }}
          >
            Ready to make a new friend?
          </Text>

          <Text
            style={{
              fontFamily: 'outfit',
              fontSize: 18,
              textAlign: 'center',
              color: Colors.GRAY,
              marginTop: 10,
            }}
          >
            Let's adopt the pet you like and make their life happy again
          </Text>

          {/* Get Started Button */}
          <Pressable
            onPress={() => {
              console.log('Button pressed!');
              onPress();
            }}
            style={{
              padding: 14,
              marginTop: 40,
              backgroundColor: Colors.PRIMARY,
              width: '100%',
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontFamily: 'outfit-medium',
                fontSize: 20,
                textAlign: 'center',
                color: Colors.WHITE,
              }}
            >
              Get Started
            </Text>
          </Pressable>

        </View>
      </View>
    </ScrollView>
  );
}