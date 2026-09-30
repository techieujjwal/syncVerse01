import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Auth gate for protected pages.
 *
 * Loading is bounded: AuthContext resolves within a few seconds or the loading
 * flag is force-cleared, so this component can never show a spinner forever
 * (the "app doesn't load" failure mode when a stale/expired stored token
 * cannot be validated).
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
