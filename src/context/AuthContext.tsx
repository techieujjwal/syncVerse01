import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type Profile = {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
};

type AuthContextType = {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    updatePassword: (password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

async function fetchProfile(userId: string): Promise<Profile | null> {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", userId)
            .single();

        if (error || !data) return null;
        return data as Profile;
    } catch {
        return null;
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety net: never leave the app stuck on the auth loading screen.
        // A stale/expired stored token or a wedged network call must not block
        // ProtectedRoute (which renders a spinner while loading) forever.
        const loadingTimeout = setTimeout(() => setLoading(false), 4000);

        supabase.auth.getSession()
            .then(({ data: { session: s } }) => {
                setSession(s);
                setUser(s?.user ?? null);
                // Profile loads in the background — it must not gate loading.
                if (s?.user) {
                    fetchProfile(s.user.id).then(setProfile);
                }
            })
            .catch(() => {
                setSession(null);
                setUser(null);
                setProfile(null);
            })
            .finally(() => setLoading(false));

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, s) => {
                setSession(s);
                setUser(s?.user ?? null);
                // Clear loading immediately; fetch the profile in the background
                // so a slow/hung profiles query can never wedge the UI.
                setLoading(false);
                if (s?.user) {
                    fetchProfile(s.user.id).then(setProfile);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            clearTimeout(loadingTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { error: null };
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } },
        });

        if (error) return { error: error.message };

        // When "Confirm email" is enabled on the Supabase project, signUp returns a
        // user but NO session. The profile row is created by the on_auth_user_created
        // DB trigger; the UI must show a "check your email" state instead of
        // navigating into the app (the user is not signed in yet).
        if (data.user && !data.session) {
            return { error: null, needsEmailConfirmation: true };
        }

        // Auto-confirm projects: a session exists, so make sure the profile row is
        // up to date (RLS allows inserting our own row).
        if (data.user) {
            await supabase.from("profiles").upsert({
                id: data.user.id,
                display_name: displayName,
            });
        }

        return { error: null, needsEmailConfirmation: false };
    };

    const resetPassword = async (email: string) => {
        // The email link redirects to /reset-password, where the user sets a new
        // password (detectSessionInUrl handles the recovery-token exchange).
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { error: error.message };
        return { error: null };
    };

    const updatePassword = async (password: string) => {
        // Requires a session — the recovery link establishes one on
        // /reset-password before this is called.
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { error: error.message };
        return { error: null };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        if (error) {
            console.error("Sign out failed:", error.message);
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, session, profile, loading, signIn, signUp, resetPassword, updatePassword, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
};
