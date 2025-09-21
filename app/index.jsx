import { useUser } from "@clerk/clerk-expo";
import { Link, Redirect, useNavigation, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

export default function Index() {

  const { user } = useUser();
  
  // Temporary bypass for testing - remove this in production
  const TEST_MODE = false; // Set to false when authentication is working

  const rootNavigationState=useRootNavigationState()
  const navigation=useNavigation();
  useEffect(()=>{
    CheckNavLoaded();
    navigation.setOptions({
      headerShown:false
    })

    
  },[])

  const CheckNavLoaded=()=>{
    if(!rootNavigationState.key)
      return null;
  }

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      
      {TEST_MODE ? (
        <Redirect href={'/(tabs)/home'} />
      ) : (
        user ?
          <Redirect href={'/(tabs)/home'} />
          : <Redirect href={'/login'} />
      )}
        
       
    </View>
  );
}
