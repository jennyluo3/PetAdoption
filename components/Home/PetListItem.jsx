import { View, Text, Image, TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import Colors from '../../constants/Colors'
import { useRouter } from 'expo-router'
import { useUser } from '@clerk/clerk-expo'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import MarkFav from './../../components/MarkFav'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

export default function PetListItem({pet, onPetUpdated}) {
    const router=useRouter();
    const { user } = useUser();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showActions, setShowActions] = useState(false);
    
    console.log('PetListItem rendered with pet:', pet);
    console.log('User:', user);
    
    // Check if current user is the owner of this pet
    const isOwner = user?.primaryEmailAddress?.emailAddress === pet?.email;
    
    const showAlert = (message) => {
        if (Platform.OS === 'web') {
            alert(message);
        } else {
            Alert.alert('Alert', message);
        }
    };

    const handleDelete = async () => {
        console.log('Delete button clicked');
        console.log('Pet data:', pet);
        console.log('User email:', user?.primaryEmailAddress?.emailAddress);
        console.log('Pet email:', pet?.email);
        console.log('Is owner:', isOwner);
        
        if (!isOwner) {
            showAlert('You can only delete your own pets');
            return;
        }

        // Use documentId for deletion (more reliable than pet.id)
        const petId = pet.documentId || pet.id;
        if (!petId) {
            showAlert('Pet ID not found. Cannot delete.');
            return;
        }

        // Use different confirmation method for web vs native
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Are you sure you want to delete ${pet.name}? This action cannot be undone.`);
            if (confirmed) {
                try {
                    console.log('Starting delete process...');
                    console.log('Deleting pet with ID:', petId);
                    setIsDeleting(true);
                    
                    await deleteDoc(doc(db, 'Pets', petId));
                    console.log('Pet deleted successfully from database');
                    
                    showAlert('Pet deleted successfully');
                    if (onPetUpdated) {
                        console.log('Calling onPetUpdated callback...');
                        onPetUpdated();
                    }
                } catch (error) {
                    console.error('Error deleting pet:', error);
                    showAlert(`Error deleting pet: ${error.message}`);
                } finally {
                    setIsDeleting(false);
                }
            }
        } else {
            Alert.alert(
                'Delete Pet',
                `Are you sure you want to delete ${pet.name}? This action cannot be undone.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                console.log('Starting delete process...');
                                console.log('Deleting pet with ID:', petId);
                                setIsDeleting(true);
                                
                                await deleteDoc(doc(db, 'Pets', petId));
                                console.log('Pet deleted successfully from database');
                                
                                showAlert('Pet deleted successfully');
                                if (onPetUpdated) {
                                    console.log('Calling onPetUpdated callback...');
                                    onPetUpdated();
                                }
                            } catch (error) {
                                console.error('Error deleting pet:', error);
                                showAlert(`Error deleting pet: ${error.message}`);
                            } finally {
                                setIsDeleting(false);
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleEdit = () => {
        if (!isOwner) {
            showAlert('You can only edit your own pets');
            return;
        }
        
        router.push({
            pathname: '/edit-pet',
            params: pet
        });
    };
  return (
    <View 
    onMouseEnter={() => setShowActions(true)}
    onMouseLeave={() => setShowActions(false)}
    style={{
        padding:10,
        marginRight:15,
        backgroundColor:Colors.WHITE,
        borderRadius:10,
        position: 'relative'
    }}>
        <TouchableOpacity 
        onPress={()=>router.push({
            pathname:'/pet-details',
            params:pet
        })}
        style={{ flex: 1 }}>
            {/* Favorite Icon - positioned at top-right */}
            <View style={{
                position:'absolute',
                zIndex:15,
                right:5,
                top:5
            }}>
                <MarkFav pet={pet} color={'white'}/>
            </View>
            
            {/* Edit/Delete Buttons - positioned to avoid favorite icon */}
            <View style={{
                position:'absolute',
                zIndex:10,
                right:10,
                top:60,
                flexDirection: 'row',
                gap: 8,
                opacity: (isOwner && showActions) ? 1 : 0,
                transform: [{ scale: (isOwner && showActions) ? 1 : 0.8 }],
                transition: 'all 0.3s ease'
            }}>
                {isOwner && (
                    <>
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation();
                                handleEdit();
                            }}
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                borderRadius: 18,
                                padding: 6,
                                width: 32,
                                height: 32,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5
                            }}
                        >
                            <MaterialIcons name="edit" size={18} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            style={{
                                backgroundColor: 'rgba(255,0,0,0.8)',
                                borderRadius: 18,
                                padding: 6,
                                width: 32,
                                height: 32,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5
                            }}
                        >
                            <MaterialIcons name="delete" size={18} color="white" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        <Image source={{uri:pet?.imageUrl}}
        style={{
            width:150,
            height:135,
            objectFit:'cover',
            borderRadius:10
        }}
        />
        <Text style={{
            fontFamily:'outfit-medium',
            fontSize:18
        }}>{pet?.name}</Text>
        <View style={{
            display:'flex',
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center'
        }}>
            <Text style={{
                color:Colors.GRAY,
                fontFamily:'outfit'
            }}>{pet?.breed}</Text>
            <Text style={{
                fontFamily:'outfit',
                color:Colors.PRIMARY,
                paddingHorizontal:7,
                borderRadius:10,
                fontSize:11,
                backgroundColor:Colors.LIGHT_PRIMARY,

            }}>{pet.age} YRS</Text>
        </View>
        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  petCard: {
    padding: 10,
    marginRight: 15,
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }
  },
  actionButtons: {
    position: 'absolute',
    zIndex: 10,
    right: 10,
    top: 60,
    flexDirection: 'row',
    gap: 8,
    transition: 'all 0.3s ease'
  },
  actionButton: {
    borderRadius: 20,
    padding: 8,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    transition: 'all 0.2s ease'
  },
  editButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    ':hover': {
      backgroundColor: 'rgba(0,0,0,0.9)',
      transform: 'scale(1.1)'
    }
  },
  deleteButton: {
    backgroundColor: 'rgba(255,0,0,0.8)',
    ':hover': {
      backgroundColor: 'rgba(255,0,0,0.9)',
      transform: 'scale(1.1)'
    }
  }
});