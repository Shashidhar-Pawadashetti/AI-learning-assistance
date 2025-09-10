import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();

    if (name.trim() && email.trim() && password.trim()) {
      // Save user in localStorage
      localStorage.setItem("user", JSON.stringify({ name, email, xp: 0, level: 1 }));
      navigate("/dashboard"); // redirect to dashboard after signup
    } else {
      alert("Please fill all fields");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Account ✨</h2>
        <p>Sign up to start your learning journey</p>

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
        <p className="signup-text">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
