import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import type { ReactNode } from "react";

// Wraps any route that requires the user to be logged in.
// If no token is present, redirects to /login instead of rendering children.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
