import React, { useState } from "react";
import RegisterPage from "./RegisterPage";

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // SHOW REGISTRATION PAGE
  // ==========================================
  if (showRegister) {
    return (
      <RegisterPage
        onBackToLogin={() => {
          setShowRegister(false);
        }}
        onRegisterSuccess={() => {
          setShowRegister(false);
        }}
      />
    );
  }

  // ==========================================
  // LOGIN
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid email or password."
        );
      }

      // Store JWT token
    // ==========================================
// STORE JWT TOKEN
// ==========================================

localStorage.setItem(
  "lifeloan_token",
  data.access_token
);


// ==========================================
// STORE USER ID
// ==========================================

localStorage.setItem(
  "user_id",
  String(data.user_id)
);


// ==========================================
// STORE LOGIN STATE
// ==========================================

localStorage.setItem(
  "lifeloan_logged_in",
  "true"
);
      // Notify parent
      if (onLoginSuccess) {
        onLoginSuccess();
      }

    } catch (err: any) {
      console.error("Login error:", err);

      setError(
        err.message ||
          "Unable to connect to LifeLoan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* =================================================
          ANIMATED AI NETWORK BACKGROUND
          ================================================= */}

      <div className="network-background">

        <svg
          className="network-svg"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
        >

          {/* ============================================
              NETWORK CONNECTIONS
              ============================================ */}

          <g className="network-lines">

  {/* Top network */}
  <line x1="40" y1="90" x2="180" y2="190" />
  <line x1="180" y1="190" x2="300" y2="250" />
  <line x1="180" y1="190" x2="350" y2="80" />
  <line x1="350" y1="80" x2="520" y2="110" />
  <line x1="350" y1="80" x2="580" y2="40" />
  <line x1="520" y1="110" x2="760" y2="230" />
  <line x1="580" y1="40" x2="760" y2="230" />
  <line x1="760" y1="230" x2="900" y2="80" />
  <line x1="900" y1="80" x2="1010" y2="120" />
  <line x1="900" y1="80" x2="1100" y2="40" />
  <line x1="1010" y1="120" x2="1260" y2="260" />
  <line x1="1100" y1="40" x2="1260" y2="260" />
  <line x1="1260" y1="260" x2="1420" y2="180" />
  <line x1="1420" y1="180" x2="1510" y2="140" />
  <line x1="1420" y1="180" x2="1560" y2="60" />

  {/* Upper-middle network */}
  <line x1="180" y1="190" x2="410" y2="470" />
  <line x1="300" y1="250" x2="410" y2="470" />
  <line x1="350" y1="80" x2="650" y2="360" />
  <line x1="520" y1="110" x2="650" y2="360" />
  <line x1="650" y1="360" x2="760" y2="230" />
  <line x1="760" y1="230" x2="900" y2="470" />
  <line x1="900" y1="80" x2="900" y2="470" />
  <line x1="1010" y1="120" x2="900" y2="470" />
  <line x1="900" y1="470" x2="1160" y2="380" />
  <line x1="1010" y1="120" x2="1160" y2="380" />
  <line x1="1160" y1="380" x2="1260" y2="260" />
  <line x1="1260" y1="260" x2="1430" y2="500" />

  {/* Middle network */}
  <line x1="410" y1="470" x2="650" y2="360" />
  <line x1="410" y1="470" x2="680" y2="650" />
  <line x1="650" y1="360" x2="900" y2="470" />
  <line x1="650" y1="360" x2="680" y2="650" />
  <line x1="900" y1="470" x2="680" y2="650" />
  <line x1="900" y1="470" x2="1050" y2="700" />
  <line x1="900" y1="470" x2="1160" y2="380" />
  <line x1="1160" y1="380" x2="1280" y2="610" />
  <line x1="1160" y1="380" x2="1430" y2="500" />
  <line x1="1430" y1="500" x2="1280" y2="610" />

  {/* Lower-left network */}
  <line x1="410" y1="470" x2="180" y2="620" />
  <line x1="180" y1="620" x2="80" y2="520" />
  <line x1="80" y1="520" x2="40" y2="700" />
  <line x1="180" y1="620" x2="420" y2="760" />
  <line x1="420" y1="760" x2="680" y2="650" />
  <line x1="420" y1="760" x2="600" y2="850" />
  <line x1="600" y1="850" x2="680" y2="650" />
  <line x1="680" y1="650" x2="900" y2="470" />

  {/* Lower-right network */}
  <line x1="680" y1="650" x2="1050" y2="700" />
  <line x1="1050" y1="700" x2="1280" y2="610" />
  <line x1="1050" y1="700" x2="1150" y2="850" />
  <line x1="1150" y1="850" x2="1280" y2="610" />
  <line x1="1280" y1="610" x2="1500" y2="760" />
  <line x1="1280" y1="610" x2="1430" y2="500" />
  <line x1="1500" y1="760" x2="1560" y2="600" />
  <line x1="1560" y1="600" x2="1430" y2="500" />

  {/* Outer connections */}
  <line x1="40" y1="90" x2="40" y2="300" />
  <line x1="40" y1="300" x2="180" y2="190" />
  <line x1="1510" y1="140" x2="1560" y2="300" />
  <line x1="1560" y1="300" x2="1430" y2="500" />
  <line x1="40" y1="700" x2="180" y2="620" />
  <line x1="600" y1="850" x2="900" y2="850" />
  <line x1="900" y1="850" x2="1050" y2="700" />
  <line x1="1500" y1="760" x2="1560" y2="850" />

</g>


          {/* ============================================
              NETWORK NODES
              ============================================ */}

         <g className="network-nodes">

  {/* Top */}
  <circle cx="40" cy="90" r="4" />
  <circle cx="180" cy="190" r="5" />
  <circle cx="300" cy="250" r="7" />
  <circle cx="350" cy="80" r="4" />
  <circle cx="520" cy="110" r="6" />
  <circle cx="580" cy="40" r="4" />
  <circle cx="760" cy="230" r="7" />
  <circle cx="900" cy="80" r="5" />
  <circle cx="1010" cy="120" r="6" />
  <circle cx="1100" cy="40" r="4" />
  <circle cx="1260" cy="260" r="7" />
  <circle cx="1420" cy="180" r="5" />
  <circle cx="1510" cy="140" r="4" />
  <circle cx="1560" cy="60" r="4" />

  {/* Middle */}
  <circle cx="410" cy="470" r="7" />
  <circle cx="650" cy="360" r="5" />
  <circle cx="900" cy="470" r="8" />
  <circle cx="1160" cy="380" r="6" />
  <circle cx="1430" cy="500" r="7" />

  {/* Lower */}
  <circle cx="80" cy="520" r="4" />
  <circle cx="180" cy="620" r="6" />
  <circle cx="40" cy="700" r="4" />
  <circle cx="420" cy="760" r="7" />
  <circle cx="600" cy="850" r="4" />
  <circle cx="680" cy="650" r="6" />
  <circle cx="900" cy="850" r="4" />
  <circle cx="1050" cy="700" r="7" />
  <circle cx="1150" cy="850" r="4" />
  <circle cx="1280" cy="610" r="6" />
  <circle cx="1500" cy="760" r="7" />
  <circle cx="1560" cy="600" r="4" />
  <circle cx="1560" cy="850" r="4" />

</g>
          


          {/* ============================================
              MOVING DATA PARTICLES
              ============================================ */}

          <g className="network-particles">

            {/* Particle 1 */}
            <circle
              className="network-particle particle-1"
              cx="80"
              cy="130"
              r="3"
            />

            {/* Particle 2 */}
            <circle
              className="network-particle particle-2"
              cx="300"
              cy="250"
              r="3"
            />

            {/* Particle 3 */}
            <circle
              className="network-particle particle-3"
              cx="410"
              cy="470"
              r="3"
            />

            {/* Particle 4 */}
            <circle
              className="network-particle particle-4"
              cx="900"
              cy="470"
              r="3"
            />

            {/* Particle 5 */}
            <circle
              className="network-particle particle-5"
              cx="1050"
              cy="700"
              r="3"
            />

            {/* Particle 6 */}
            <circle
              className="network-particle particle-6"
              cx="1260"
              cy="260"
              r="3"
            />

          </g>

        </svg>

      </div>


      {/* =================================================
          BACKGROUND GLOWS
          ================================================= */}

      <div className="login-glow login-glow-one" />

      <div className="login-glow login-glow-two" />


      {/* =================================================
          MAIN LOGIN CONTAINER
          ================================================= */}

      <div className="login-container">


        {/* =================================================
            LOGO
            ================================================= */}

        <div className="login-brand">

          <div className="login-logo">
            ✦
          </div>

          <div>

            <h1>
              LifeLoan
            </h1>

            <p>
              AI-powered financial intelligence
            </p>

          </div>

        </div>


        {/* =================================================
            LOGIN CARD
            ================================================= */}

        <div className="login-card">

          <div className="login-heading-centered">

            <h2>
              Welcome User
            </h2>

            <p>
              Sign in to continue to your
              LifeLoan dashboard.
            </p>

          </div>


          {/* =================================================
              LOGIN FORM
              ================================================= */}

          <form onSubmit={handleLogin}>

            {/* Email */}

            <div className="login-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="login-input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                />

              </div>

            </div>


            {/* Password */}

            <div className="login-field">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert(
                      "Password recovery will be available soon."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>


              <div className="login-input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                />


                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? "◉"
                    : "◌"}
                </button>

              </div>

            </div>


            {/* Error */}

            {error && (

              <div className="login-error">

                <span>
                  !
                </span>

                <p>
                  {error}
                </p>

              </div>

            )}


            {/* Login Button */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (

                <>
                  <span className="login-spinner" />
                  Signing in...
                </>

              ) : (

                <>
                  Sign in
                  <span>→</span>
                </>

              )}

            </button>

          </form>


          {/* =================================================
              DIVIDER
              ================================================= */}

          <div className="login-divider">

            <span />

            <p>
              OR
            </p>

            <span />

          </div>


          {/* =================================================
              REGISTER
              ================================================= */}

          <div className="register-section">

            <p>
              Don't have a LifeLoan account?
            </p>

            <button
              type="button"
              className="create-account"
              onClick={() => {
                setError("");
                setShowRegister(true);
              }}
            >
              Create an account
              <span>→</span>
            </button>

          </div>

        </div>


        {/* =================================================
            SECURITY INFORMATION
            ================================================= */}

        <div className="login-security">

          <span>
            ✦
          </span>

          <p>
            Your financial information is protected
            by secure authentication.
          </p>

        </div>


        {/* =================================================
            FOOTER
            ================================================= */}

        <div className="login-footer">

          © 2026 LifeLoan · Intelligent borrowing,
          made simpler.

        </div>

      </div>

    </div>
  );
};

export default Login;