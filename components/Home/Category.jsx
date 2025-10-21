import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import {db} from './../../config/FirebaseConfig'
import Colors from './../../constants/Colors'
export default function Category({category}) {

    const [categoryList,setCategortList]=useState([]);
    const [selectedCategory,setSelectedategory]=useState('All');
    useEffect(()=>{
        GetCategories();
    },[])

    /**
     * Used to Get Category List from DB
     */
    const GetCategories=async()=>{
        try {
            // Prefer local category icons to match the reference UI
            const localCategories = [
                { name: 'Dogs', image: require('../../assets/images/Cdog.jpg') },
                { name: 'Fish', image: require('../../assets/images/Cfish.png') },
                { name: 'Cats', image: require('../../assets/images/Ccat.png') },
                { name: 'Birds', image: require('../../assets/images/Cbird.png') },
            ];

            // Attempt to append any categories from Firestore if available
            const categoriesFromDb = [];
            try{
                const snapshot = await getDocs(collection(db,'Category'));
                snapshot.forEach((doc)=>{
                    const data = doc.data();
                    categoriesFromDb.push({ name: data?.name, imageUrl: data?.imageUrl });
                });
            }catch(dbErr){
                // Ignore DB errors; local icons will still render
            }

            // Merge while avoiding duplicates by name (local priority)
            const merged = [...localCategories];
            categoriesFromDb.forEach(c=>{
                if (!merged.find(m=>m.name===c.name)) {
                    merged.push(c);
                }
            });

            // Prepend All option
            setCategortList([{ name:'All' }, ...merged]);
        } catch (error) {
            // Final fallback to local only
            setCategortList([
                { name:'All' },
                { name: 'Dogs', image: require('../../assets/images/Cdog.jpg') },
                { name: 'Fish', image: require('../../assets/images/Cfish.png') },
                { name: 'Cats', image: require('../../assets/images/Ccat.png') },
                { name: 'Birds', image: require('../../assets/images/Cbird.png') },
            ]);
        }
    }

  return (
    <View style={{
        marginTop:20,
    }}>
      <Text style={{
        fontFamily:'outfit-medium',
        fontSize:20
      }}>Category</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 10 }}
        style={{ marginTop: 10 }}
      >
        {categoryList.map((item, index) => (
          <TouchableOpacity 
              key={index}
              onPress={()=>{
                  setSelectedategory(item.name);
                  category(item.name)
              }}
              style={{ marginRight: 12 }}
          > 
              <View style={[styles.conatiner,
              selectedCategory==item.name&&styles.selectedCategoryContainer]}
              >
                  {item?.image || item?.imageUrl ? (
                    <Image 
                      source={item?.image ? item.image : {uri:item?.imageUrl}}
                      style={{ width:40, height:40 }}
                    />
                  ) : (
                    <Text style={{ fontFamily:'outfit', fontSize:16 }}>All</Text>
                  )}
              </View>
              <Text style={{
                  textAlign:'center',
                  fontFamily:'outfit'
              }}>{item?.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </View>
  )
}

const styles = StyleSheet.create({
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    categoryItem: {
        width: '23%', // 4 items per row with some spacing
        marginBottom: 10,
    },
    conatiner:{
        backgroundColor:Colors.LIGHT_PRIMARY,
        padding:15,
        alignItems:'center',
        borderWidth:1,
        borderRadius:15,
        borderColor:Colors.PRIMARY,
        margin:5
    },
    selectedCategoryContainer:{
        backgroundColor:Colors.SECONDARY,
        borderColor:Colors.SECONDARY
    }
})