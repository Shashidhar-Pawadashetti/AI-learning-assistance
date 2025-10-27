import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the combined auth page and open the signup form
    navigate('/login', { state: { mode: 'signup' } });
  }, [navigate]);

  // Fallback UI in case automatic redirect is blocked
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Redirecting to Sign Up…</h2>
        <p>If you are not redirected automatically, <Link to="/login" state={{ mode: 'signup' }}>click here</Link>.</p>
      </div>
    </div>
  );
}
