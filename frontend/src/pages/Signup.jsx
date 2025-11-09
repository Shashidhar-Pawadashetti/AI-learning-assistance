import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('User created:', user.email);
      
      await sendEmailVerification(user);
      console.log('Verification email sent to:', user.email);
      
      const token = await user.getIdToken();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        name: name,
        email: user.email
      }));
      window.dispatchEvent(new Event('storage'));
      
      alert('Account created! Verification email sent to your inbox.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError(error.message || 'Signup failed. Please try again.');
      }
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      }));
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to sign up with Google. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Account ✨</h2>
        <p>Sign up to start your learning journey</p>
        {error && <p style={{color: 'red', fontSize: '14px'}}>{error}</p>}

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            Sign Up
          </button>
        </form>

        <div style={{ margin: '20px 0', color: '#999' }}>OR</div>

        <button onClick={handleGoogleSignup} className="btn" style={{ background: '#fff', color: '#333', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '0 auto' }}>
          <span>🔐</span> Sign up with Google
        </button>
        
        <p className="signup-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}