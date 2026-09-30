import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, KeyRound, CheckCircle2, LinkIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Password reset landing page.
 *
 * The recovery email links here with a one-time code (?code=...). The Supabase
 * client is configured with detectSessionInUrl: true, so it exchanges that code
 * for a session automatically on load. Once the session exists, the user sets a
 * new password via updatePassword().
 */
const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { session, updatePassword } = useAuth();

  // Recovery-code exchange happens right after mount; allow a bounded window
  // before concluding the link is invalid/expired.
  const [exchangeWindowOpen, setExchangeWindowOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setExchangeWindowOpen(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/"), 1800);
  };

  const renderBody = () => {
    if (session) {
      if (done) {
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Password updated</h2>
            <p className="text-sm text-white/50">Your new password is set. Redirecting you home…</p>
          </div>
        );
      }

      return (
        <>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
            <KeyRound className="h-7 w-7 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2 text-white">Set a new password</h2>
          <p className="text-sm text-center text-white/40 mb-6">
            Choose a strong password for your account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-white/60 text-xs font-medium">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-white/60 text-xs font-medium">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              {busy ? "Updating..." : "Update password"}
            </Button>
          </form>
        </>
      );
    }

    if (exchangeWindowOpen) {
      return (
        <div className="text-center py-6">
          <div className="mx-auto mb-4 h-8 w-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/50">Verifying your reset link…</p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <LinkIcon className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Link invalid or expired</h2>
        <p className="text-sm text-white/50 mb-6">
          This password reset link is no longer valid — it can only be used once. Request a fresh
          one from the sign-in page; it only takes a moment.
        </p>
        <Link to="/login">
          <Button className="w-full bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl h-11 font-semibold">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  };

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

        <Card className="p-8 glass-strong rounded-2xl shadow-2xl">{renderBody()}</Card>
      </div>
    </div>
  );
};

export default ResetPassword;
