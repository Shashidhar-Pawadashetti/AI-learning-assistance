import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [dark]);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      navigate('/');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Logout error:', err);
    }
  };

  return (
    <nav className="navbar">
      <h1 className="logo">Study Buddy</h1>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Notes</Link>
        <Link to="/quiz">Quiz</Link>
        <Link to="/achievements">Achievements</Link>
        <Link to="/dashboard">Dashboard</Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} style={{ marginLeft: '25px', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', font: 'inherit', textDecoration: 'none' }}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
        <button className="toggle-btn" onClick={() => setDark(!dark)}>
          {dark ? "🌞" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
