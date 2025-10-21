import { View, Text, ScrollView, Image, StyleSheet, Dimensions, Animated } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import {db} from './../../config/FirebaseConfig'
import Colors from '../../constants/Colors'

export default function Slider() {

    const [sliderList,setSliderList]=useState([]);
    useEffect(()=>{
        GetSliders(); 
    },[])

    const GetSliders=async()=>{
        try{
            setSliderList([]);
            const snapshot=await getDocs(collection(db,'Sliders'));
            snapshot.forEach((doc)=>{
                setSliderList(sliderList=>[...sliderList,doc.data()])
            })
        }catch(err){
            // swallow error; we'll still show local banner
        }
    }

  const itemWidth = Dimensions.get('screen').width*0.9;

  // Auto-rotate banners every 5 seconds
  const localBanners = [
    require('../../assets/images/home.png'),
    require('../../assets/images/home1.png')
  ];

  // Only cycle between the two local banners below the user's name
  const allBanners = localBanners;
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (allBanners.length === 0) return;
    const id = setInterval(() => {
      const nextIndex = (currentIndex + 1) % allBanners.length;
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(()=>{
        setCurrentIndex(nextIndex);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, 3000);
    return () => clearInterval(id);
  }, [currentIndex, allBanners.length]);

  useEffect(() => {
    // Reset to first slide on mount
    setCurrentIndex(0);
  }, []);

  return (
    <View style={{
        marginTop:15
    }}>
        <Animated.Image
          source={allBanners[currentIndex]}
          style={[styles.sliderImage,{ width: itemWidth, opacity: fadeAnim }]}
        />
        {/* Pagination dots */}
        <View style={{ flexDirection:'row', justifyContent:'center', marginTop:8 }}>
            {allBanners.map((_, idx)=> (
                <View
                    key={`dot-${idx}`}
                    style={{
                        width:8,
                        height:8,
                        borderRadius:4,
                        marginHorizontal:4,
                        backgroundColor: idx===currentIndex ? Colors.PRIMARY : '#e0e0e0'
                    }}
                />
            ))}
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    sliderImage:{
        width:Dimensions.get('screen').width*0.9,
        height:170,
        borderRadius:15,
        marginRight:15
    }
})