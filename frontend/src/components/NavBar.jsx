import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setIsLoggedIn(!!token);
      setUser(userData);
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
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Notes</Link>
        <Link to="/quiz">Quiz</Link>
        <Link to="/achievements">Achievements</Link>
        <Link to="/dashboard">Dashboard</Link>
        {isLoggedIn ? (
          isLoggedIn && user?.name && (
            <div className="profile-dropdown">
              <div className="user-info" onClick={() => setProfileOpen(!profileOpen)}>
                <span>{user.name}</span>
                <span>Lvl {user.level || 1}</span>
                <span>{user.xp || 0} XP</span>
              </div>
              {profileOpen && (
                <div className="dropdown-menu">
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          )
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}
