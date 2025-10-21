import { View, Text, Image, TextInput, StyleSheet, ScrollView, TouchableOpacity, Pressable, ToastAndroid, ActivityIndicator, Platform, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation, useRouter } from 'expo-router'
import Colors from './../../constants/Colors'
import { Picker } from '@react-native-picker/picker';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, storage } from '../../config/FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@clerk/clerk-expo';

export default function AddNewPet() {
    const navigation=useNavigation();
    const [formData,setFormData]=useState(
        { category:'Dogs',sex:'Male', status:'Available'}
    );

    // Cross-platform alert function
    const showAlert = (message) => {
        if (Platform.OS === 'web') {
            alert(message);
        } else {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        }
    };
    const [gender,setGender]=useState('Male');
    const [categoryList,setCategortList]=useState([]);
    const [selectedCategory,setSelectedategory]=useState('Dogs');
    const [image,setImage]=useState();
    const [loader,setLoader]=useState(false);
    const {user}=useUser();
    const router=useRouter();
    useEffect(()=>{
        navigation.setOptions({
            headerTitle:'Add New Pet'
        })
        GetCategories();
    },[])

    /**
     * Used to Get Category List from DB
     */
    const GetCategories=async()=>{
        try {
            setCategortList([]);
            const snapshot=await getDocs(collection(db,'Category'));
            
            if(snapshot.empty) {
                // If no categories in database, use default categories
                const defaultCategories = [
                    {name: 'Dogs'},
                    {name: 'Cats'},
                    {name: 'Birds'},
                    {name: 'Fish'},
                    {name: 'Other'}
                ];
                setCategortList(defaultCategories);
                console.log('Using default categories:', defaultCategories);
            } else {
                snapshot.forEach((doc)=>{
                    setCategortList(categoryList=>[...categoryList,doc.data()])
                });
                console.log('Loaded categories from database');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to default categories
            const defaultCategories = [
                {name: 'Dogs'},
                {name: 'Cats'},
                {name: 'Birds'},
                {name: 'Fish'},
                {name: 'Other'}
            ];
            setCategortList(defaultCategories);
        }
    }

    /**
     * used to pick image from gallery
     */
    const imagePicker=async()=>{
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });
      
          console.log(result);
      
          if (!result.canceled) {
            setImage(result.assets[0].uri);
          }
    }

    const handleInputChange=(fieldName,fieldValue)=>{
        setFormData(prev=>({
            ...prev,
            [fieldName]:fieldValue
        }))
    }

    const onSubmit=()=>{
        console.log('Form submitted. Form data keys:', Object.keys(formData).length);
        console.log('Form data:', formData);
        
        // Check if all required fields are filled
        const requiredFields = ['name', 'category', 'breed', 'age', 'sex', 'weight', 'adress', 'About', 'status'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if(missingFields.length > 0) {
            showAlert(`Please fill in: ${missingFields.join(', ')}`);
            return;
        }
        
        if(!image) {
            showAlert('Please select an image');
            return;
        }
        
        UploadImage();
    }

    /**
     * Used to upload Pet Image to Firebase Storage (server)
     */
    const UploadImage=async()=>{
        try {
            setLoader(true)
            console.log('Starting image upload...');
            console.log('Image URI:', image);

            if (!image) {
                throw new Error('No image selected');
            }

            // Try Firebase Storage first, fall back to base64 if it fails
            try {
                console.log('Attempting Firebase Storage upload...');
                
                const response = await fetch(image);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status}`);
                }
                
                const blob = await response.blob();
                console.log('Image blob created, size:', blob.size);
                
                // Create a unique filename
                const timestamp = Date.now();
                const filename = `pets/${timestamp}_${Math.random().toString(36).substring(2)}.jpg`;
                const storageRef = ref(storage, filename);
                
                console.log('Uploading to Firebase Storage...');
                const snapshot = await uploadBytes(storageRef, blob);
                console.log('Upload successful:', snapshot);
                
                const downloadUrl = await getDownloadURL(storageRef);
                console.log('Download URL obtained:', downloadUrl);
                
                await SaveFormData(downloadUrl);
                return;
                
            } catch (storageError) {
                console.warn('Firebase Storage failed, falling back to base64:', storageError);
                
                // Fallback to base64 storage
                try {
                    const response = await fetch(image);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    console.log('Image blob created for base64, size:', blob.size);
                    
                    // Convert blob to base64
                    const reader = new FileReader();
                    const base64Promise = new Promise((resolve, reject) => {
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                    });
                    reader.readAsDataURL(blob);
                    const base64 = await base64Promise;
                    
                    console.log('Image converted to base64, length:', base64.length);
                    await SaveFormData(base64);
                    return;
                } catch (base64Error) {
                    console.error('Both Firebase Storage and base64 failed:', base64Error);
                    setLoader(false);
                    showAlert(`Error processing image: ${base64Error.message}`);
                    return;
                }
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setLoader(false);
            showAlert(`Error uploading image: ${error.message}`);
        }
    }

    const SaveFormData=async(imageUrl)=>{
        try {
            const docId=Date.now().toString();
            console.log('Saving pet data to Firebase...');
            console.log('Document ID:', docId);
            console.log('Form data:', formData);
            console.log('Image URL type:', typeof imageUrl);
            console.log('Image URL length:', imageUrl?.length);
            console.log('User object:', user);
            
            // Check if user is authenticated
            if (!user) {
                console.error('User not authenticated');
                setLoader(false);
                showAlert('Please log in to add a pet');
                return;
            }
            
            const petData = {
                ...formData,
                imageUrl: imageUrl,
                username: user?.fullName || 'Unknown User',
                email: user?.primaryEmailAddress?.emailAddress || 'unknown@example.com',
                userImage: user?.imageUrl || '',
                id: docId,
                // Add platform info for debugging
                platform: Platform.OS,
                isBase64: imageUrl?.startsWith('data:image/')
            };
            
            console.log('Pet data to save:', {
                ...petData,
                imageUrl: imageUrl?.substring(0, 100) + '...' // Truncate for logging
            });
            
            await setDoc(doc(db,'Pets',docId), petData);
            
            console.log('Pet data saved successfully!');
            setLoader(false);
            showAlert('Pet added successfully!');
            router.replace('/(tabs)/home');
        } catch (error) {
            console.error('Error saving pet data:', error);
            setLoader(false);
            showAlert(`Error saving pet data: ${error.message}`);
        }
    }
  return (
    <ScrollView style={{
        padding:20
    }}>
      <Text style={{
        fontFamily:'outfit-medium',
        fontSize:20
      }}>Add New Pet for adoption</Text>

      <Pressable onPress={imagePicker}>
       {!image? <Image source={require('./../../assets/images/placeholder.png')}
        style={{
            width:100,
            height:100,
            borderRadius:15, 
            borderWidth:1,
            borderColor:Colors.GRAY
        }}
        />:
        <Image source={{uri:image}}
        style={{
            width:100,
            height:100,
            borderRadius:15, 
           
           
        }} />}
      </Pressable>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pet Name *</Text>
        <TextInput style={styles.input} 
        onChangeText={(value)=>handleInputChange('name',value)} />
      </View>

      <View style={styles.inputContainer}>
            <Text style={styles.label}>Pet Category *</Text>
            <Picker
                selectedValue={selectedCategory} 
                style={styles.input}
                onValueChange={(itemValue, itemIndex) =>{
                    setSelectedategory(itemValue);
                    handleInputChange('category',itemValue)
                 }}>
                    {categoryList.map((category,index)=>(
                          <Picker.Item key={index} label={category.name} value={category.name} />
                    ))}
                
            </Picker>
        </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Breed *</Text>
        <TextInput style={styles.input} 
        onChangeText={(value)=>handleInputChange('breed',value)} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Age *</Text>
        <TextInput style={styles.input} 
         keyboardType='number-pad'
        onChangeText={(value)=>handleInputChange('age',value)} />
      </View>
       <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender *</Text>
            <Picker
                selectedValue={gender} 
                style={styles.input}
                onValueChange={(itemValue, itemIndex) =>{
                    setGender(itemValue);
                    handleInputChange('sex',itemValue)
                 }}>
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                </Picker>
        </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Weight *</Text>
        <TextInput style={styles.input} 
            keyboardType='number-pad'
        onChangeText={(value)=>handleInputChange('weight',value)} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address *</Text>
        <TextInput style={styles.input} 
        onChangeText={(value)=>handleInputChange('adress',value)} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Status *</Text>
        <Picker
            selectedValue={formData.status}
            style={styles.input}
            onValueChange={(val)=>handleInputChange('status',val)}
        >
            <Picker.Item label="Available" value="Available" />
            <Picker.Item label="Adopted" value="Adopted" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>About *</Text>
        <TextInput style={styles.input} 
        numberOfLines={5}
        multiline={true}
        onChangeText={(value)=>handleInputChange('About',value)} />
      </View>

      <TouchableOpacity
       style={styles.button}
       disabled={loader} 
      onPress={onSubmit}>
       {loader?<ActivityIndicator size={'large'}  />:
        <Text style={{fontFamily:'outfit-medium',textAlign:'center'}}>Submit</Text>
    }
      </TouchableOpacity>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
    inputContainer:{
        marginVertical:5
    },
    input:{
        padding:10,
        backgroundColor:Colors.WHITE,
        borderRadius:7,
        fontFamily:'outfit'
    },
    label:{
        marginVertical:5,
        fontFamily:'outfit'
    },
    button:{
        padding:15,
        backgroundColor:Colors.PRIMARY,
        borderRadius:7,
        marginVertical:10,
        marginBottom:50
    }
})