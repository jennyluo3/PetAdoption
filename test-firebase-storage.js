// Test Firebase Storage Connection
// Run this in your browser console to test Firebase Storage

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAYZVkk4PpYO4uzKJegxST0hQ6hQggdFec",
  authDomain: "petadoption-b6aaf.firebaseapp.com",
  projectId: "petadoption-b6aaf",
  storageBucket: "petadoption-b6aaf.firebasestorage.app",
  messagingSenderId: "565257630317",
  appId: "1:565257630317:web:377513ca37181843ec0564"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Test function
async function testFirebaseStorage() {
  try {
    console.log('Testing Firebase Storage connection...');
    
    // Create a test blob
    const testData = 'Hello Firebase Storage!';
    const blob = new Blob([testData], { type: 'text/plain' });
    
    // Create a reference
    const testRef = ref(storage, 'test/test-file.txt');
    
    // Upload the blob
    console.log('Uploading test file...');
    const snapshot = await uploadBytes(testRef, blob);
    console.log('Upload successful:', snapshot);
    
    // Get download URL
    const downloadURL = await getDownloadURL(testRef);
    console.log('Download URL:', downloadURL);
    
    console.log('✅ Firebase Storage is working correctly!');
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
    return false;
  }
}

// Run the test
testFirebaseStorage();
