import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API_BASE_URL from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const token = await user.getIdToken();

      // Sync with backend to get/create user profile
      const response = await fetch(`${API_BASE_URL}/firebase-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0]
        })
      });

      const data = await response.json();
      const userData = data.user || {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        xp: 0,
        level: 1
      };

      // Store user info in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in Firebase Console.');
      } else {
        setError(`Login failed: ${err.code || err.message}`);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      // Sync with backend
      const response = await fetch(`${API_BASE_URL}/firebase-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User'
        })
      });

      const data = await response.json();
      const userData = data.user || {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        xp: 0,
        level: 1
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by the browser. Allow popups and try again.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email using a different sign-in method.');
      } else {
        setError(`Google sign-in failed: ${err.code || err.message}`);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back 👋</h2>
        <p>Please login to continue</p>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="btn">
            Login
          </button>
        </form>
        <button type="button" className="btn" style={{ marginTop: 12 }} onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="signup-text" style={{ marginTop: 12 }}>
          Don’t have an account? <a href="/Signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
