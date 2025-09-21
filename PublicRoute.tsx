// src/components/PublicRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = { children: React.ReactElement };

const PublicRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Checking authentication…</p>
      </div>
    );
  }

  // Only redirect to "/" if the user is verified.
  if (user && user.emailVerified) {
    return <Navigate to="/" replace />;
  }

  // If user exists but NOT verified, let them access public pages (login/register)
  return children;
};

export default PublicRoute;
