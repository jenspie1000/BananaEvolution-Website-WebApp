// src/site/Shell.tsx
import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

// Lazy-loaded site pages
const Home = lazy(() => import("./pages/Home"));
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
// Import the GAME app (kept separate)
import GameApp from "../App";

// App router
const router = createBrowserRouter([
    { path: "/", element: <Home /> },

    {
        path: "/login",
        element: (
            <PublicRoute>
                <Login />
            </PublicRoute>
        ),
    },
    {
        path: "/register",
        element: (
            <PublicRoute>
                <Register />
            </PublicRoute>
        ),
    },

    {
        path: "/profile",
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
    },

    // 🔐 Game route — ProtectedRoute already enforces emailVerified
    {
        path: "/app",
        element: (
            <ProtectedRoute>
                <GameApp />
            </ProtectedRoute>
        ),
    },

    // Fallback
    { path: "*", element: <Navigate to="/" replace /> },
]);

export default function Shell() {
    return (
        <AuthProvider>
            <Suspense
                fallback={
                    <div className="min-h-screen grid place-items-center text-gray-300">
                        Loading…
                    </div>
                }
            >
                <RouterProvider router={router} />
            </Suspense>
        </AuthProvider>
    );
}
