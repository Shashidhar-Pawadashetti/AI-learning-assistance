import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup, fetchSignInMethodsForEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

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

      // Temporarily disabled for testing
      // if (!user.emailVerified) {
      //   setError('Please verify your email before logging in. Check your inbox.');
      //   await auth.signOut();
      //   return;
      // }

      const token = await user.getIdToken();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        name: user.displayName || email.split('@')[0],
        email: user.email
      }));
      window.dispatchEvent(new Event('storage'));
      navigate('/dashboard');
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleGoogleLogin = async () => {
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
      console.error('Login error:', error);
      setError(error.message || 'Failed to login with Google. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back 👋</h2>
        <p>Please login to continue</p>
        {error && <p style={{color: 'red', fontSize: '14px'}}>{error}</p>}

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

        <div style={{ margin: '20px 0', color: '#999' }}>OR</div>

        <button onClick={handleGoogleLogin} className="btn" style={{ background: '#fff', color: '#333', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '0 auto' }}>
          <span>🔐</span> Sign in with Google
        </button>
        
        <p className="signup-text">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}