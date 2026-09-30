import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { Code2, MailCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setBusy(true);
    const { error: err } = await signIn(email.trim(), password);
    if (err) {
      // Supabase returns the same error for a wrong password AND for an
      // account whose email was never confirmed — say so, or users think
      // their password is wrong when they actually just need to confirm.
      setError(
        /invalid login credentials/i.test(err)
          ? "Invalid email or password. If you just signed up, check your inbox for the confirmation email — unconfirmed accounts cannot sign in."
          : err
      );
      setBusy(false);
      return;
    }
    setBusy(false);
    navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    const { error: err, needsEmailConfirmation } = await signUp(email.trim(), password, name.trim());
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }

    if (needsEmailConfirmation) {
      // Email confirmation is enabled on the Supabase project: the account exists
      // but the user is NOT signed in until they click the link in their inbox.
      setBusy(false);
      setConfirmationSent(true);
      return;
    }

    setBusy(false);
    navigate("/");
  };

  const switchTo = (m: "signin" | "signup" | "forgot") => {
    setError("");
    setMode(m);
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setConfirmationSent(false);
    setResetSent(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    const { error: err } = await resetPassword(email.trim());
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    // Always show the sent state — never reveal whether the account exists.
    setResetSent(true);
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15)_0%,rgba(0,0,0,0)_60%)]" />
        <div className="absolute inset-0 stars" />

        <div className="relative z-10 w-full max-w-md">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-violet-500/20">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SyncVerse</span>
          </div>

          <Card className="p-8 glass-strong rounded-2xl shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <MailCheck className="h-7 w-7 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-white">Check your inbox</h2>
            <p className="text-sm text-center text-white/50 mb-6">
              We sent a confirmation link to <span className="text-white/80 font-medium">{email}</span>.
              Confirm your email to activate your account, then sign in.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl h-11 font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all"
              onClick={() => switchTo("signin")}
            >
              Back to sign in
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15)_0%,rgba(0,0,0,0)_60%)]" />
        <div className="absolute inset-0 stars" />

        <div className="relative z-10 w-full max-w-md">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-violet-500/20">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SyncVerse</span>
          </div>

          <Card className="p-8 glass-strong rounded-2xl shadow-2xl">
            {resetSent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <MailCheck className="h-7 w-7 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-center mb-2 text-white">Check your inbox</h2>
                <p className="text-sm text-center text-white/50 mb-6">
                  If an account exists for <span className="text-white/80 font-medium">{email}</span>,
                  we sent a link to reset your password. It expires shortly, so use it soon.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl h-11 font-semibold"
                  onClick={() => switchTo("signin")}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center mb-2 text-white">Reset your password</h2>
                <p className="text-sm text-center text-white/40 mb-6">
                  Enter your email and we'll send you a reset link.
                </p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email" className="text-white/60 text-xs font-medium">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl h-11"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full mt-3 bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl h-11 font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all"
                    disabled={busy}
                  >
                    {busy ? "Sending..." : "Send reset link"}
                  </Button>
                </form>

                <div className="text-sm text-center mt-6">
                  <button
                    onClick={() => switchTo("signin")}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15)_0%,rgba(0,0,0,0)_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.1)_0%,rgba(0,0,0,0)_60%)]" />
      <div className="absolute inset-0 stars" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-violet-500/20">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">SyncVerse</span>
        </div>

        <Card className="p-8 glass-strong rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">
            {mode === "signin" ? "Welcome back" : "Create Account"}
          </h2>
          <p className="text-sm text-center text-white/40 mb-6">
            {mode === "signin" ? "Sign in to continue your journey" : "Start your learning journey today"}
          </p>

          <form onSubmit={mode === "signin" ? handleSignin : handleSignup} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white/60 text-xs font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl h-11"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/60 text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/60 text-xs font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl h-11"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-white/60 text-xs font-medium">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl h-11"
                />
              </div>
            )}

            {mode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchTo("forgot")}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-3 bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl h-11 font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all"
              disabled={busy}
            >
              {busy
                ? (mode === "signin" ? "Signing in..." : "Creating account...")
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          <div className="text-sm text-center text-white/40 mt-6">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => switchTo("signup")} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => switchTo("signin")} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-center mt-4">
            <Link to="/" className="text-white/30 hover:text-white/60 transition-colors">
              ← Back to home
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
