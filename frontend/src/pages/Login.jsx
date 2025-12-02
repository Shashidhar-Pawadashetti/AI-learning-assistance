import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import storeUserData from '../utils/storeUserData';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      storeUserData(token, user.uid, user.displayName || user.email?.split('@')[0] || 'User', user.email, 0, 1);
      navigate('/dashboard');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Login error:', err);
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
      storeUserData(token, user.uid, user.displayName || user.email?.split('@')[0] || 'User', user.email, 0, 1);
      navigate('/dashboard');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Google sign-in error:', err);
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px', margin: 0, marginBottom: '15px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px' }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', margin: 0, marginBottom: '20px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px' }}
          />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginBottom: '15px' }}>
            <button type="submit" className="btn" style={{ flex: 1, margin: 0, padding: '10px' }}>
              Login
            </button>
            <button type="button" className="btn" style={{ flex: 1, margin: 0, padding: '10px' }} onClick={handleGoogleLogin}>
              Continue with Google
            </button>
          </div>
        </form>

        <p className="signup-text" style={{ marginTop: 12 }}>
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
