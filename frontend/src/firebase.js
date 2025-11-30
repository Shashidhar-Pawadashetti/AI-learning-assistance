import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate all required fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
    console.error('❌ Missing Firebase configuration:', missingFields.join(', '));
    console.error('Please create a .env file with all required VITE_FIREBASE_* variables');
    console.error('See .env.example for reference');
    throw new Error('Firebase configuration incomplete. Check console for details.');
}

// Initialize Firebase
let app, auth, googleProvider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log('✓ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
}

export { app, auth, googleProvider };
