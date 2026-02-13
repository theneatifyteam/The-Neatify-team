import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        navigate("/services", { replace: true });
      }
    });
  }, [navigate]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else navigate("/services");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Customer Login</h2>

        {/* Email */}
        <div className="input-wrapper">
          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="eye-button"
            onClick={() => setShowPassword(!showPassword)}
          >
           {showPassword ? <FiEye /> : <FiEyeOff />}

          </button>
        </div>

        {/* Login Button */}
        <button className="auth-button" onClick={handleLogin}>
          Login
        </button>

        <p
          className="auth-text"
          onClick={() => navigate("/forgot-password")}
          style={{ cursor: "pointer", marginTop: "15px" }}
        >
          Forgot Password?
        </p>

        <p className="auth-text">
          New account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{ color: "#f4c430", fontWeight: "600" }}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;