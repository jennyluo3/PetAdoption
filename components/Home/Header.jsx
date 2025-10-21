import { View, Text, Image } from 'react-native'
import React from 'react'
import { useUser } from '@clerk/clerk-expo'

export default function Header() {
    const {user, isLoaded}=useUser();
    
    // Debug logging
    console.log('Header - User data:', user);
    console.log('Header - Is loaded:', isLoaded);
    console.log('Header - User fullName:', user?.fullName);
    console.log('Header - User firstName:', user?.firstName);
    console.log('Header - User lastName:', user?.lastName);
    
    // Show loading state if user data isn't loaded yet
    if (!isLoaded) {
        return (
            <View style={{
                display:'flex',
                flexDirection:'row',
                justifyContent:'space-between',
                alignItems:'center'
            }}>
                <View>
                    <Text style={{
                        fontFamily:'outfit',
                        fontSize:18
                    }}>Welcome,</Text>
                    <Text style={{
                        fontFamily:'outfit-medium',
                        fontSize:25
                    }}>Loading...</Text>
                </View>
                <View style={{
                    width:40,
                    height:40,
                    borderRadius:99,
                    backgroundColor:'#ccc'
                }} />
            </View>
        );
    }
    
    // Get display name - try multiple sources
    const displayName = user?.fullName || 
                       (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                       user?.firstName ||
                       user?.username ||
                       'User';
    
    return (
        <View style={{
            display:'flex',
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center'
        }}>
            <View>
                <Text style={{
                    fontFamily:'outfit',
                    fontSize:18
                }}>Welcome,</Text>
                <Text style={{
                    fontFamily:'outfit-medium',
                    fontSize:25
                }}>{displayName}</Text>
            </View>
            {user?.imageUrl ? (
                <Image source={{uri:user?.imageUrl}} 
                style={{
                    width:40,
                    height:40,
                    borderRadius:99
                }} />
            ) : (
                <View style={{
                    width:40,
                    height:40,
                    borderRadius:99,
                    backgroundColor:'#ccc',
                    justifyContent:'center',
                    alignItems:'center'
                }}>
                    <Text style={{color:'white', fontSize:16}}>
                        {displayName.charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}
        </View>
    )
}