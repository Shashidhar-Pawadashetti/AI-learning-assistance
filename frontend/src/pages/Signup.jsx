import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, fetchSignInMethodsForEmail, getAdditionalUserInfo, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

import { API_URL } from '../config';
import { validateName, validateEmail, validatePassword } from "../utils/validation";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send verification code
  const handleSendCode = async () => {
    setError("");
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/send-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send code");
      alert("Verification code sent to your email!");
    } catch (err) {
      setError(err.message || "Failed to send code");
    } finally {
      setSending(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async () => {
    setError("");
    if (!code) {
      setError("Please enter the verification code");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Invalid code");
      setEmailVerified(true);
      setError("");
      alert("Email verified successfully!");
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  // Step 3: Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!emailVerified) {
      setError("Please verify your email first");
      return;
    }

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const token = await user.getIdToken();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        name: name,
        email: user.email,
        xp: 0,
        level: 1
      }));
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in Firebase Console.');
      } else {
        setError(`Signup failed: ${err.code || err.message}`);
      }
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      // If user provided an email, pre-check existing sign-in methods for this email
      if (email) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes('google.com')) {
          setError('An account with this email already exists with Google. Please use Login.');
          return;
        }
        if (methods.includes('password')) {
          setError('An account with this email exists using Email/Password. Please login instead.');
          return;
        }
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const info = getAdditionalUserInfo(result);

      // If user typed an email and it doesn't match selected Google account, block to avoid confusion
      if (email && user.email && email.toLowerCase() !== user.email.toLowerCase()) {
        // User is currently signed in due to popup success; sign out to keep Signup semantics
        await signOut(auth);
        setError('The Google account email does not match the email you entered. Please use the matching account or clear the email field.');
        return;
      }

      // If the account already existed and user clicked Signup, DO NOT auto-login; show guidance to login instead
      if (info && info.isNewUser === false) {
        await signOut(auth);
        setError('An account with this email already exists. Please login instead.');
        return;
      }
      const token = await user.getIdToken();

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        xp: 0,
        level: 1
      }));

      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Google signup error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by the browser. Allow popups and try again.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const existingEmail = err.customData?.email;
        if (existingEmail) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, existingEmail);
            if (methods.includes('password')) {
              setError('An account with this email exists with Email/Password. Please login with email and password, then link Google in your profile.');
            } else if (methods.length) {
              setError(`An account exists with a different provider: ${methods.join(', ')}. Please use that method to login.`);
            } else {
              setError('An account already exists with the same email using a different sign-in method.');
            }
          } catch (_) {
            setError('An account already exists with the same email using a different sign-in method.');
          }
        } else {
          setError('An account already exists with the same email using a different sign-in method.');
        }
      } else {
        setError(`Google signup failed: ${err.code || err.message}`);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Account ✨</h2>
        <p>Sign up to start your learning journey</p>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        {emailVerified && <p style={{ color: 'green', fontSize: '14px' }}>✓ Email verified</p>}

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ marginBottom: '15px' }}
          />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={emailVerified}
              style={{ flex: 1, margin: 0, padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px' }}
            />
            <button
              type="button"
              className="btn"
              onClick={handleSendCode}
              disabled={sending || emailVerified}
              style={{ width: 'auto', padding: '8px 16px', margin: 0, height: '100%' }}
            >
              {sending ? '...' : emailVerified ? '✓' : 'Verify'}
            </button>
          </div>

          {!emailVerified && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ flex: 1, margin: 0, padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px' }}
              />
              <button
                type="button"
                className="btn"
                onClick={handleVerifyCode}
                disabled={verifying}
                style={{ width: 'auto', padding: '8px 16px', margin: 0, height: '100%' }}
              >
                {verifying ? 'Verifying...' : 'Submit'}
              </button>
            </div>
          )}

          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: '20px', marginTop: !emailVerified ? '0' : '15px' }}
          />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginBottom: '15px' }}>
            <button type="submit" className="btn" style={{ flex: 1, margin: 0, padding: '10px' }}>
              Sign Up
            </button>
            <button type="button" className="btn" style={{ flex: 1, margin: 0, padding: '10px' }} onClick={handleGoogleSignup}>
              Continue with Google
            </button>
          </div>
        </form>

        <p className="signup-text" style={{ marginTop: 12 }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
