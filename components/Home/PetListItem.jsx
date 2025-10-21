import { View, Text, Image, TouchableOpacity, Alert, Platform, StyleSheet, Modal } from 'react-native'
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
    const [showMenu, setShowMenu] = useState(false);
    
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
    <View style={{
        padding:10,
        backgroundColor:Colors.WHITE,
        borderRadius:10,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
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
            
            {/* 3-Dot Menu Button - only show for pet owners */}
            {isOwner && (
                <TouchableOpacity 
                    onPress={(e) => {
                        e.stopPropagation();
                        setShowMenu(true);
                    }}
                    style={{
                        position:'absolute',
                        zIndex:10,
                        right:5,
                        top:35,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: 15,
                        padding: 6,
                        width: 30,
                        height: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5
                    }}
                >
                    <MaterialIcons name="more-vert" size={18} color="white" />
                </TouchableOpacity>
            )}

        <Image 
          source={pet?.imageUrl && typeof pet.imageUrl === 'string' && pet.imageUrl.trim() !== '' 
            ? {uri: pet.imageUrl} 
            : require('../../assets/images/placeholder.png')
          }
          style={{
            width:'100%',
            height:120,
            objectFit:'cover',
            borderRadius:8
          }}
          onError={(error) => {
            console.log('Image load error:', error);
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
        {pet?.status==='Adopted' && (
            <Text style={{
                marginTop:4,
                fontFamily:'outfit-medium',
                fontSize:12,
                color: Colors.SECONDARY
            }}>Adopted</Text>
        )}
        </TouchableOpacity>

        {/* Action Menu Modal */}
        <Modal
            visible={showMenu}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowMenu(false)}
        >
            <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowMenu(false)}
            >
                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                            setShowMenu(false);
                            handleEdit();
                        }}
                    >
                        <MaterialIcons name="edit" size={20} color={Colors.PRIMARY} />
                        <Text style={styles.menuText}>Edit Pet</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.menuDivider} />
                    
                    <TouchableOpacity 
                        style={[styles.menuItem, styles.deleteMenuItem]}
                        onPress={() => {
                            setShowMenu(false);
                            handleDelete();
                        }}
                        disabled={isDeleting}
                    >
                        <MaterialIcons name="delete" size={20} color="#FF4444" />
                        <Text style={[styles.menuText, styles.deleteMenuText]}>
                            {isDeleting ? 'Deleting...' : 'Delete Pet'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'outfit',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  deleteMenuItem: {
    // Additional styles for delete item if needed
  },
  deleteMenuText: {
    color: '#FF4444',
  },
});