import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import PetInfo from '../../components/PetDetails/PetInfo';
import PetSubInfo from '../../components/PetDetails/PetSubInfo';
import AboutPet from '../../components/PetDetails/AboutPet';
import OwnerInfo from '../../components/PetDetails/OwnerInfo';
import Colors from '../../constants/Colors';
import { useUser } from '@clerk/clerk-expo';
import { collection, doc, getDocs, query, setDoc, where, updateDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';

export default function PetDetails() {
    const routePet=useLocalSearchParams();
    const [pet,setPet]=useState(routePet);
    const navigation=useNavigation();
    const {user}=useUser();
    const router=useRouter();
    useEffect(()=>{
        navigation.setOptions({
            headerTransparent:true,
            headerTitle:''
        })
    },[])

    /**
     * Used to Initiate the chat between two users
     */
    const InitiateChat=async()=>{
        if(!user){
            if(Platform.OS==='web') alert('Please login to adopt');
            else Alert.alert('Login required','Please login to adopt');
            return;
        }

        // Only the owner can change adoption status
        const isOwner = user?.primaryEmailAddress?.emailAddress === pet?.email;
        if (isOwner) {
            try{
                const petDocId = pet?.documentId || pet?.id;
                if(petDocId && pet?.status!=='Adopted'){
                    await updateDoc(doc(db,'Pets',petDocId),{
                        status:'Adopted',
                        adoptedByName:user?.fullName||'',
                        adoptedByEmail:user?.primaryEmailAddress?.emailAddress||''
                    });
                    setPet(prev=>({
                        ...prev,
                        status:'Adopted',
                        adoptedByName:user?.fullName||'',
                        adoptedByEmail:user?.primaryEmailAddress?.emailAddress||''
                    }));
                }
            }catch(err){
                console.log('Failed to update adoption status',err);
            }
        }

        const docId1=user?.primaryEmailAddress?.emailAddress+'_'+pet?.email;
        const docId2=pet?.email+'_'+user?.primaryEmailAddress?.emailAddress;

        const q=query(collection(db,'Chat'),where('id','in',[docId1,docId2]));
        const querySnapshot=await getDocs(q);
        querySnapshot.forEach(doc=>{
            console.log(doc.data());
            router.push({
                pathname:'/chat',
                params:{id:doc.id}
            })
        })

        if(querySnapshot.docs?.length==0)
        {
            await setDoc(doc(db,'Chat',docId1),{
                id:docId1,
                users:[
                    {
                        email:user?.primaryEmailAddress?.emailAddress,
                        imageUrl:user?.imageUrl,
                        name:user?.fullName
                    },
                    {
                        email:pet?.email,
                        imageUrl:pet?.userImage,
                        name:pet?.username
                    }
                ],
                userIds:[user?.primaryEmailAddress?.emailAddress,pet?.email]
            });
            router.push({
                pathname:'/chat',
                params:{id:docId1}
            })
        }

    }
  return (
    <View>
        <ScrollView>
        {/* Pet Info  */}
            <PetInfo pet={pet} />
        {/* Pet SubInfo  */}
            <PetSubInfo pet={pet} />
        {/* about  */}
            <AboutPet pet={pet} />
        {/* owner details   */}
            <OwnerInfo pet={pet} />
            <View style={{height:70}}>

            </View>
           
        </ScrollView>
        {/* Adopt me button  */}
        <View style={styles?.bottomContainer}>
            <TouchableOpacity 
            disabled={pet?.status==='Adopted'}
            onPress={InitiateChat}
            style={[styles.adoptBtn, pet?.status==='Adopted' && {opacity:0.6}]}>
                <Text style={{
                    textAlign:'center',
                    fontFamily:'outfit-medium',
                    fontSize:20
                }}>
                    {pet?.status==='Adopted'
                        ? 'Already Adopted'
                        : (user?.primaryEmailAddress?.emailAddress===pet?.email ? 'Mark as Adopted' : 'Adopt Me')}
                </Text>
            </TouchableOpacity>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    adoptBtn:{
        padding:15,
        backgroundColor:Colors.PRIMARY
    },
    bottomContainer:{
        position:'absolute',
        width:'100%',
        bottom:0
    }
})