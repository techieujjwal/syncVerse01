import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

/**
 * Single-file local auth (signup + signin).
 *
 * Storage:
 * - sv_users: array of saved users (persisted signups)
 * - sv_current_user: currently logged-in user object
 * - username: legacy key you used elsewhere (stores name or email-prefix)
 *
 * Demo users are merged into the user list but not overwritten.
 */

type LocalUser = {
  name?: string;
  email: string;
  password: string;
};

const STORAGE_USERS_KEY = "sv_users";
const STORAGE_CURRENT_KEY = "sv_current_user";

// Demo users (kept as before)
const DEMO_USERS: LocalUser[] = [
  { email: "Veer@techpath.com", password: "123456", name: "Veer" },
  { email: "Rakesh@email.com", password: "654321", name: "Rakesh" },
  { email: "Tanish@techpath.com", password: "111111", name: "Tanish" },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // form state
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // helper: read stored users and merge demo users if missing
  const readUsers = (): LocalUser[] => {
    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY);
      const saved: LocalUser[] = raw ? JSON.parse(raw) : [];
      // merge without duplicates (by email)
      const merged = [...saved];
      DEMO_USERS.forEach((d) => {
        if (!merged.some((u) => u.email.toLowerCase() === d.email.toLowerCase())) {
          merged.push(d);
        }
      });
      return merged;
    } catch {
      return [...DEMO_USERS];
    }
  };

  // helper: write users (only user-created ones)
  const writeUsers = (users: LocalUser[]) => {
    // store only non-demo users (so demo remains separate but we can store all too)
    // For simplicity store all (demo + signups) so the list persists fully.
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  };

  // helper: save current user
  const setCurrentUser = (user: LocalUser) => {
    localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(user));
    // legacy key used elsewhere in your app:
    const username = user.name ? user.name : user.email.split("@")[0];
    localStorage.setItem("username", username);
  };

  // attempt signin
  const handleSignin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setBusy(true);
    try {
      const users = readUsers();
      const matched = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!matched) {
        setError("Invalid email or password");
        setBusy(false);
        return;
      }
      setCurrentUser(matched);
      setBusy(false);
      navigate("/"); // original behavior
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  // attempt signup
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill all fields");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const users = readUsers();
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setError("Email already registered. Try signing in.");
        setBusy(false);
        return;
      }

      const newUser: LocalUser = { name: name.trim(), email: email.trim(), password };
      const updated = [...users, newUser];
      writeUsers(updated);
      setCurrentUser(newUser);
      setBusy(false);
      navigate("/"); // after signup, go home (same as signin flow)
    } catch (err) {
      console.error(err);
      setError("Failed to sign up. Try again.");
      setBusy(false);
    }
  };

  // convenience: switch modes and clear errors/fields
  const switchTo = (m: "signin" | "signup") => {
    setError("");
    setMode(m);
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  // On mount: ensure demo users exist (merge saved)
  useEffect(() => {
    const users = readUsers();
    // If localStorage had only demo users (not saved), persist the merged list so future signups persist properly.
    // But avoid overwriting if key already exists.
    if (!localStorage.getItem(STORAGE_USERS_KEY)) {
      writeUsers(users);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md p-8 border border-border bg-card shadow-lg hover-lift">
        <h2 className="text-3xl font-bold text-center mb-4">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h2>

        <p className="text-sm text-center text-muted-foreground mb-4">
          {mode === "signin"
            ? "Sign in with your account or use a demo account."
            : ""}
        </p>

        <form
          onSubmit={mode === "signin" ? handleSignin : handleSignup}
          className="space-y-4"
        >
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === "signup" && (
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Confirm Your Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full mt-2" disabled={busy}>
            {busy ? (mode === "signin" ? "Signing in..." : "Signing up...") : mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="text-sm text-center text-muted-foreground mt-6 space-y-1">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => switchTo("signup")}
                className="text-blue-400 underline"
              >
                Create one
              </button>
              
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchTo("signin")}
                className="text-blue-400 underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
