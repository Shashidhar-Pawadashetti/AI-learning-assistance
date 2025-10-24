import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <h1 className="logo">AI Learning Assistant</h1>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Notes</Link>
        <Link to="/quiz">Quiz</Link>
        <Link to="/achievements">Achievements</Link>
        <Link to="/dashboard">Dashboard</Link>
        {isLoggedIn ? (
          <a onClick={handleLogout} style={{marginLeft: '25px', cursor: 'pointer'}}>Logout</a>
        ) : (
          <>
            <Link to="/Login">Login</Link>
            <Link to="/Signup">Signup</Link>
          </>
        )}
        <button className="toggle-btn" onClick={() => setDark(!dark)}>
          {dark ? "🌞" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
