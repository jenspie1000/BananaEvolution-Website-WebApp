// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = { children: React.ReactElement };

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Checking authentication…</p>
      </div>
    );
  }

  // Block if no user, or user is not email-verified
  if (!user || !user.emailVerified) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
