import React, { useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface RegisterPageProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({
  onBackToLogin,
  onRegisterSuccess,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Basic validation
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            email: email,
            password: password,
            phone: phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to create your account."
        );
      }

      setSuccess(
        "Account created successfully! You can now sign in."
      );

      // Small delay so the user can see success message
      setTimeout(() => {
        onRegisterSuccess();
      }, 1200);

    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to LifeLoan server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07100c] text-[#dde4dd] flex items-center justify-center px-6 py-10">

      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] shadow-lg shadow-[#10b981]/20">
            <ShieldCheck className="h-6 w-6 text-[#003824]" />
          </div>

          <div>
            <h1 className="font-serif text-3xl font-bold text-[#dde4dd]">
              Life<span className="text-[#4edea3]">Loan</span>
            </h1>

            <p className="text-xs text-[#819087]">
              AI-powered financial intelligence
            </p>
          </div>
        </div>

        {/* Registration Card */}
        <div className="rounded-3xl border border-[#26332c] bg-[#0d1712] p-8 shadow-2xl">

          {/* Back */}
          <button
            onClick={onBackToLogin}
            className="mb-6 flex items-center gap-2 text-sm text-[#819087] transition hover:text-[#4edea3]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </button>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="font-serif text-4xl font-semibold text-[#dde4dd]">
              Create your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#819087]">
              Join LifeLoan and get personalized AI-powered
              insights for your financial journey.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#bbcabf]">
                Full name
              </label>

              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819087]" />

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-[#29362f] bg-[#09120e] py-3.5 pl-11 pr-4 text-sm text-[#dde4dd] outline-none transition placeholder:text-[#56635b] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#bbcabf]">
                Email address
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819087]" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#29362f] bg-[#09120e] py-3.5 pl-11 pr-4 text-sm text-[#dde4dd] outline-none transition placeholder:text-[#56635b] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#bbcabf]">
                Phone number
              </label>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819087]" />

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full rounded-xl border border-[#29362f] bg-[#09120e] py-3.5 pl-11 pr-4 text-sm text-[#dde4dd] outline-none transition placeholder:text-[#56635b] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#bbcabf]">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819087]" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-[#29362f] bg-[#09120e] py-3.5 pl-11 pr-12 text-sm text-[#dde4dd] outline-none transition placeholder:text-[#56635b] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#819087] hover:text-[#4edea3]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#bbcabf]">
                Confirm password
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819087]" />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border border-[#29362f] bg-[#09120e] py-3.5 pl-11 pr-12 text-sm text-[#dde4dd] outline-none transition placeholder:text-[#56635b] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#819087] hover:text-[#4edea3]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-3 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-3 text-sm text-[#4edea3]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Create Account */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] py-4 text-sm font-bold text-[#003824] transition hover:bg-[#18c992] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </form>

          {/* Sign In */}
          <div className="mt-7 border-t border-[#242c27] pt-6 text-center">
            <p className="text-sm text-[#819087]">
              Already have a LifeLoan account?
            </p>

            <button
              onClick={onBackToLogin}
              className="mt-2 text-sm font-semibold text-[#4edea3] hover:text-[#6ff0bb]"
            >
              Sign in instead →
            </button>
          </div>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#56635b]">
          Your financial information is protected by secure authentication.
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;