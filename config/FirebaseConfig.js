// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Note: Removed Firebase Auth since we're using Clerk for authentication

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYZVkk4PpYO4uzKJegxST0hQ6hQggdFec",
  authDomain: "petadoption-b6aaf.firebaseapp.com",
  projectId: "petadoption-b6aaf",
  storageBucket: "petadoption-b6aaf.firebasestorage.app",
  messagingSenderId: "565257630317",
  appId: "1:565257630317:web:377513ca37181843ec0564"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (excluding Auth since we use Clerk)
export const db = getFirestore(app);
export const storage = getStorage(app);
// Removed auth export since we're using Clerk

// Optional: Initialize Analytics (uncomment if needed)
// const analytics = getAnalytics(app);