import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import "../styles/pages/login.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Toggle between login and register in the same page
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Navigate to home AFTER isLoggedIn has actually been committed to React state.
  // Calling navigate() inline right after login() causes a race condition where
  // ProtectedRoute still sees isLoggedIn=false and bounces the user back here.
  // This effect also handles users who visit /login while already logged in.
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? "/auth/register" : "/auth/login";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      // Set the token in context + localStorage — the useEffect above will
      // navigate to "/" once isLoggedIn flips to true
      login(data.token);
    } catch {
      setError("Could not reach the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="Login">
      <form className="login-card container" onSubmit={handleSubmit}>

        <div className="login-title letters">
          {isRegister ? "Create account" : "Welcome back"}
        </div>

        <div className="login-fields">
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? "..." : isRegister ? "Register" : "Log in"}
        </button>

        <div className="login-toggle">
          {isRegister ? "Already have an account?" : "No account yet?"}{" "}
          <button type="button" onClick={() => { setError(null); setIsRegister(!isRegister); }}>
            {isRegister ? "Log in" : "Register"}
          </button>
        </div>

      </form>
    </div>
  );
}
