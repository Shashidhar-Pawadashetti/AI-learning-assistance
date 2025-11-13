// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuXvdC81nR5VU6STTfeF-vQcZ04ifmX6E",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ailearningassistantstudybuddy.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ailearningassistantstudybuddy",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ailearningassistantstudybuddy.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1091858157763",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1091858157763:web:a4294a8178e7bdf5fa1276",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HEJ2Q6KK64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
