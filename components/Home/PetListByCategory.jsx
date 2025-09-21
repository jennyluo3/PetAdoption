import { View, Text, FlatList, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import Category from './Category'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import PetListItem from './PetListItem'

export default function PetListByCategory() {

  const [petList,setPetList]=useState([]);
  const [loader,setLoader]=useState(false);
  useEffect(()=>{
    GetAllPets()
  },[])
  /**
   * Used to get all pets (no category filter)
   */
  const GetAllPets=async()=>{
    setLoader(true)
    setPetList([]);
    try {
      console.log('Fetching all pets...');
      console.log('Firebase db instance:', db);
      console.log('Platform:', Platform.OS);
      
      const petsRef = collection(db, 'Pets');
      const querySnapshot = await getDocs(petsRef);

      console.log('Query snapshot size:', querySnapshot.size);
      
      const pets = [];
      querySnapshot.forEach(doc=>{
        console.log('Pet data:', doc.data());
        pets.push({
          ...doc.data(),
          documentId: doc.id // Add document ID for deletion
        });
      });
      setPetList(pets);
      
      console.log('Total pets found:', querySnapshot.size);
      console.log('Pets array:', pets);
    } catch (error) {
      console.error('Error fetching all pets:', error);
    }
    setLoader(false);
  }

  /**
   * Used to get Pet List on Category Selection
   * @param {*} category 
   */
  const GetPetList=async(category)=>{
    setLoader(true)
    setPetList([]);
    try {
      console.log('Fetching pets for category:', category);
      console.log('Firebase db instance:', db);
      
      // If category is "All", get all pets
      if (category === 'All') {
        await GetAllPets();
        return;
      }
      
      const q=query(collection(db,'Pets'),where('category','==',category));
      const querySnapshot=await getDocs(q);

      console.log('Query snapshot size:', querySnapshot.size);
      
      const pets = [];
      querySnapshot.forEach(doc=>{
        console.log('Pet data:', doc.data());
        pets.push({
          ...doc.data(),
          documentId: doc.id // Add document ID for deletion
        });
      });
      setPetList(pets);
      
      console.log('Total pets found:', querySnapshot.size);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
    setLoader(false);

  }

  return (
    <View>
      <Category category={(value)=>GetPetList(value)}/>
 
      <FlatList
        data={petList}
        style={{marginTop:10}}
        horizontal={true}
        refreshing={loader}
        showsHorizontalScrollIndicator={false}
        onRefresh={()=>GetAllPets()}
        renderItem={({item,index})=>(
          <PetListItem pet={item} onPetUpdated={() => GetAllPets()} />
        )}
      />
    </View>
  )
}