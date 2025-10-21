

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { useAuth } from '@clerk/clerk-expo'
import Header from '../../components/Home/Header'
import Slider from '../../components/Home/Slider'
import PetListByCategory from '../../components/Home/PetListByCategory'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Colors from '../../constants/Colors'
import { Link } from 'expo-router'

export default function Home() {
  return (
    <ScrollView 
      style={{ flex: 1, marginTop: 20 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }} // extra space at bottom
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Header />

      {/* Slider */}
      <Slider />

      {/* PetList + Category */}
      <PetListByCategory />

      {/* Add New Pet Option */}
      <Link href={'/add-new-pet'} style={styles.addNewPetContainer}>
        <MaterialIcons name="pets" size={24} color={Colors.PRIMARY} />
        <Text style={styles.addNewPetText}>Add New Pet</Text>
      </Link>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  addNewPetContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: Colors.LIGHT_PRIMARY,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 15,
    borderStyle: 'dashed',
    justifyContent: 'center'
  },
  addNewPetText: {
    fontFamily: 'outfit-medium',
    color: Colors.PRIMARY,
    fontSize: 18
  }
})
