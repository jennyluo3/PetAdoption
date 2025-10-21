import { View, Text, Image } from 'react-native'
import React from 'react'
import Colors from '../../constants/Colors'
import MarkFav from '../MarkFav';
export default function PetInfo({pet}) {
  return pet&&(
    <View>
      
      <Image source={{uri:pet?.imageUrl}}
      style={{
        width:'100%',
        height:400,
        objectFit:'cover'
      }}
      />
      <View style={{
        padding:20,
        display:'flex',
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center'
      }}>
        <View>
            <Text style={{
                fontFamily:'outfit-bold',
                fontSize:27
            }}>{pet?.name}  </Text>

            <Text style={{
                fontFamily:'outfit',
                fontSize:16,
                color:Colors.GRAY
            }}>{pet?.adress || pet?.address}</Text>
        </View>
          <MarkFav pet={pet}/>
      </View>
      {pet?.status==='Adopted' && (
        <View style={{ paddingHorizontal:20, paddingBottom:10 }}>
          <Text style={{ fontFamily:'outfit-medium', color:Colors.SECONDARY }}>
            Adopted by: {pet?.adoptedByName || pet?.adoptedByEmail || 'Unknown'}
          </Text>
        </View>
      )}
    </View>
  )
}