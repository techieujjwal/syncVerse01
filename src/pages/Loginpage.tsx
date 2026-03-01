import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Code2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      setError(err);
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
    const { error: err } = await signUp(email.trim(), password, name.trim());
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    setBusy(false);
    navigate("/");
  };

  const switchTo = (m: "signin" | "signup") => {
    setError("");
    setMode(m);
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

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
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl h-11"
                />
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
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
