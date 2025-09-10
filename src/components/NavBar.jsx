import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [dark]);

  return (
    <nav className="navbar">
      <h1 className="logo">AI Learning Assistant</h1>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Notes</Link>
        <Link to="/quiz">Quiz</Link>
        <Link to="/achievements">Achievements</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/Login">Login</Link>
        <Link to="/Signup">Signup</Link>
        <button className="toggle-btn" onClick={() => setDark(!dark)}>
          {dark ? "🌞" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
