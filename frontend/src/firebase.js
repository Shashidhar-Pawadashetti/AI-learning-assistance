import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCXDuWMF8DKy6bvjqVjuy1cO-0MzGmvtgw",
  authDomain: "ai-learning-assistant-c9be5.firebaseapp.com",
  projectId: "ai-learning-assistant-c9be5",
  storageBucket: "ai-learning-assistant-c9be5.firebasestorage.app",
  messagingSenderId: "409926866393",
  appId: "1:409926866393:web:12900b6a013cdaf798b5c8",
  measurementId: "G-1MMMQKQ57W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
