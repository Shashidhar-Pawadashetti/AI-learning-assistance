import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (email.trim() && password.trim()) {
      // Fake login success
      localStorage.setItem("user", JSON.stringify({ email }));
      navigate("/dashboard"); // redirect to Dashboard after login
    } else {
      alert("Please enter both email and password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back 👋</h2>
        <p>Please login to continue</p>

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
        <p className="signup-text">
          Don’t have an account? <a href="/Signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
