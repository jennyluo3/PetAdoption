import { View, Text, Image, TextInput, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, Platform, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router'
import Colors from './../../constants/Colors'
import { Picker } from '@react-native-picker/picker';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../config/FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@clerk/clerk-expo';

export default function EditPet() {
    const router = useRouter();
    const navigation = useNavigation();
    const { user } = useUser();
    const params = useLocalSearchParams();
    
    const [formData, setFormData] = useState({
        name: params.name || '',
        category: params.category || 'Dogs',
        breed: params.breed || '',
        age: params.age || '',
        sex: params.sex || 'Male',
        weight: params.weight || '',
        adress: params.adress || '',
        About: params.About || '',
        status: params.status || 'Available',
        adoptedByName: params.adoptedByName || '',
        adoptedByEmail: params.adoptedByEmail || ''
    });

    const [gender, setGender] = useState(params.sex || 'Male');
    const [categoryList, setCategoryList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(params.category || 'Dogs');
    const [image, setImage] = useState(params.imageUrl || '');
    const [loader, setLoader] = useState(false);

    // Cross-platform alert function
    const showAlert = (message) => {
        if (Platform.OS === 'web') {
            alert(message);
        } else {
            Alert.alert('Alert', message);
        }
    };

    useEffect(() => {
        GetCategories();
        // Clean header title so it doesn't show index/edit
        navigation.setOptions({
            headerTitle: 'Edit Pet',
            headerBackTitleVisible: false
        });
    }, []);

    const GetCategories = async () => {
        try {
            setCategoryList([]);
            const snapshot = await getDocs(collection(db, 'Category'));
            
            if (snapshot.empty) {
                const defaultCategories = [
                    { name: 'Dogs' }, { name: 'Cats' }, { name: 'Birds' }, { name: 'Fish' }, { name: 'Other' }
                ];
                setCategoryList(defaultCategories);
                console.log('Using default categories:', defaultCategories);
            } else {
                snapshot.forEach((doc) => {
                    setCategoryList(categoryList => [...categoryList, doc.data()]);
                });
                console.log('Loaded categories from database');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            const defaultCategories = [
                { name: 'Dogs' }, { name: 'Cats' }, { name: 'Birds' }, { name: 'Fish' }, { name: 'Other' }
            ];
            setCategoryList(defaultCategories);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const imagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showAlert('Error selecting image');
        }
    };

    const onSubmit = () => {
        console.log('Form submitted. Form data keys:', Object.keys(formData).length);
        console.log('Form data:', formData);
        
        // Check if all required fields are filled
        const requiredFields = ['name', 'category', 'breed', 'age', 'sex', 'weight', 'adress', 'About', 'status'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            showAlert(`Please fill in: ${missingFields.join(', ')}`);
            return;
        }
        
        if (!image) {
            showAlert('Please select an image');
            return;
        }
        
        UpdatePet();
    };

    const UpdatePet = async () => {
        try {
            setLoader(true);
            console.log('Updating pet data...');
            console.log('Pet ID:', params.id);
            console.log('Form data:', formData);
            console.log('User object:', user);
            
            // Check if user is authenticated
            if (!user) {
                console.error('User not authenticated');
                setLoader(false);
                showAlert('Please log in to edit a pet');
                return;
            }

            // Check if user is the owner
            if (user.primaryEmailAddress?.emailAddress !== params.email) {
                console.error('User is not the owner of this pet');
                setLoader(false);
                showAlert('You can only edit your own pets');
                return;
            }

            let imageUrl = image;
            
            // If image is a new file (not base64), try Firebase Storage first, then base64
            if (image && !image.startsWith('data:image/') && !image.startsWith('http')) {
                try {
                    console.log('Processing new image...');
                    const response = await fetch(image);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    console.log('Image blob created, size:', blob.size);
                    
                    // Try Firebase Storage first
                    try {
                        console.log('Attempting Firebase Storage upload...');
                        const timestamp = Date.now();
                        const filename = `pets/${timestamp}_${Math.random().toString(36).substring(2)}.jpg`;
                        const storageRef = ref(storage, filename);
                        
                        const snapshot = await uploadBytes(storageRef, blob);
                        console.log('Upload successful:', snapshot);
                        
                        imageUrl = await getDownloadURL(storageRef);
                        console.log('Download URL obtained:', imageUrl);
                        
                    } catch (storageError) {
                        console.warn('Firebase Storage failed, using base64:', storageError);
                        
                        // Fallback to base64
                        const reader = new FileReader();
                        const base64Promise = new Promise((resolve, reject) => {
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                        });
                        reader.readAsDataURL(blob);
                        imageUrl = await base64Promise;
                        console.log('Image converted to base64, length:', imageUrl.length);
                    }
                } catch (error) {
                    console.error('Error processing image:', error);
                    setLoader(false);
                    showAlert(`Error processing image: ${error.message}`);
                    return;
                }
            }

            const petData = {
                ...formData,
                imageUrl: imageUrl,
                username: user?.fullName || 'Unknown User',
                email: user?.primaryEmailAddress?.emailAddress || 'unknown@example.com',
                userImage: user?.imageUrl || '',
                platform: Platform.OS,
                isBase64: imageUrl?.startsWith('data:image/'),
                updatedAt: new Date().toISOString()
            };
            
            console.log('Pet data to update:', {
                ...petData,
                imageUrl: imageUrl?.substring(0, 100) + '...'
            });
            
            await updateDoc(doc(db, 'Pets', params.id), petData);
            
            console.log('Pet data updated successfully!');
            setLoader(false);
            showAlert('Pet updated successfully!');
            router.replace('/(tabs)/home');
        } catch (error) {
            console.error('Error updating pet data:', error);
            setLoader(false);
            showAlert(`Error updating pet data: ${error.message}`);
        }
    };

    return (
        <ScrollView style={{ padding: 20 }}>
            <Text style={{
                fontFamily: 'outfit-medium',
                fontSize: 20,
                marginBottom: 20
            }}>Edit Pet Information</Text>

            <Pressable onPress={imagePicker}>
                {!image ? (
                    <Image source={require('./../../assets/images/placeholder.png')}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 10
                        }}
                    />
                ) : (
                    <Image source={{ uri: image }}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 10
                        }}
                    />
                )}
            </Pressable>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Pet Name *</Text>
                <TextInput style={styles.input}
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)} />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Pet Category *</Text>
                <Picker
                    selectedValue={selectedCategory}
                    style={styles.input}
                    onValueChange={(itemValue, itemIndex) => {
                        setSelectedCategory(itemValue);
                        handleInputChange('category', itemValue);
                    }}>
                    {categoryList.map((category, index) => (
                        <Picker.Item key={index} label={category.name} value={category.name} />
                    ))}
                </Picker>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Breed *</Text>
                <TextInput style={styles.input}
                    value={formData.breed}
                    onChangeText={(value) => handleInputChange('breed', value)} />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Age *</Text>
                <TextInput style={styles.input}
                    value={formData.age}
                    keyboardType='number-pad'
                    onChangeText={(value) => handleInputChange('age', value)} />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender *</Text>
                <Picker
                    selectedValue={gender}
                    style={styles.input}
                    onValueChange={(itemValue, itemIndex) => {
                        setGender(itemValue);
                        handleInputChange('sex', itemValue);
                    }}>
                    <Picker.Item label="Male" value="Male" />
                    <Picker.Item label="Female" value="Female" />
                </Picker>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Weight *</Text>
                <TextInput style={styles.input}
                    value={formData.weight}
                    keyboardType='number-pad'
                    onChangeText={(value) => handleInputChange('weight', value)} />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Address *</Text>
                <TextInput style={styles.input}
                    value={formData.adress}
                    onChangeText={(value) => handleInputChange('adress', value)} />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Status *</Text>
                <Picker
                    selectedValue={formData.status}
                    style={styles.input}
                    onValueChange={(val)=>handleInputChange('status', val)}
                >
                    <Picker.Item label="Available" value="Available" />
                    <Picker.Item label="Adopted" value="Adopted" />
                </Picker>
            </View>

            {formData.status==='Adopted' && (
                <View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Adopted By (Name)</Text>
                        <TextInput style={styles.input}
                            value={formData.adoptedByName}
                            onChangeText={(v)=>handleInputChange('adoptedByName', v)} />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Adopted By (Email)</Text>
                        <TextInput style={styles.input}
                            value={formData.adoptedByEmail}
                            onChangeText={(v)=>handleInputChange('adoptedByEmail', v)} />
                    </View>
                </View>
            )}

            <View style={styles.inputContainer}>
                <Text style={styles.label}>About *</Text>
                <TextInput style={styles.input}
                    value={formData.About}
                    numberOfLines={5}
                    multiline={true}
                    onChangeText={(value) => handleInputChange('About', value)} />
            </View>

            <TouchableOpacity
                style={styles.button}
                disabled={loader}
                onPress={onSubmit}>
                {loader ? (
                    <ActivityIndicator color={Colors.WHITE} />
                ) : (
                    <Text style={styles.buttonText}>Update Pet</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        marginTop: 20
    },
    label: {
        fontFamily: 'outfit-medium',
        fontSize: 16,
        marginBottom: 10
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.GRAY,
        borderRadius: 10,
        padding: 15,
        fontFamily: 'outfit'
    },
    button: {
        backgroundColor: Colors.PRIMARY,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20
    },
    buttonText: {
        color: Colors.WHITE,
        fontFamily: 'outfit-medium',
        fontSize: 16
    }
});
