// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCuXvdC81nR5VU6STTfeF-vQcZ04ifmX6E",
    authDomain: "ailearningassistantstudybuddy.firebaseapp.com",
    projectId: "ailearningassistantstudybuddy",
    storageBucket: "ailearningassistantstudybuddy.firebasestorage.app",
    messagingSenderId: "1091858157763",
    appId: "1:1091858157763:web:a4294a8178e7bdf5fa1276",
    measurementId: "G-HEJ2Q6KK64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
