import React, { Suspense, lazy, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
/**
 * App-wide constants for title handling.
 * Keeping this centralized avoids duplication and makes maintenance easier.
 */
const APP_NAME = "Banana Evolution 🍌";

/**
 * Map of path -> title. You can extend this as you add routes.
 * Tip: For dynamic routes, you can store prefix keys and let the matching logic handle them.
 */
const ROUTE_TITLES: Record<string, string> = {
  "/": `Home - ${APP_NAME}`,
  "/login": `Login - ${APP_NAME}`,
  "/register": `Register - ${APP_NAME}`,
  "/settings": `Settings - ${APP_NAME}`,
  "/pack-store": `Pack Store - ${APP_NAME}`,
  "/leaderboards": `Leaderboards - ${APP_NAME}`,
  "/inventory": `Inventory - ${APP_NAME}`,
  "/free-stickers": `Free Stickers - ${APP_NAME}`,
  "/console": `Console - ${APP_NAME}`,
  "/profile": `Profile - ${APP_NAME}`,
};

/**
 * TitleUpdater:
 * - Updates document.title whenever the location changes.
 * - Handles exact matches and graceful fallbacks for unknown paths.
 * - Uses useMemo to avoid recomputing the same title unnecessarily.
 * - Defensive: only writes to document.title if it actually changed (prevents redundant DOM ops).
 */
function TitleUpdater() {
  const location = useLocation();

  const computedTitle = useMemo(() => {
    const path = location.pathname;

    // 1) Exact match first (fast path)
    if (ROUTE_TITLES[path]) return ROUTE_TITLES[path];

    // 2) Prefix match fallback (useful if you add nested routes later, e.g., /settings/profile)
    const matchedKey =
      Object.keys(ROUTE_TITLES).find((key) =>
        key !== "/" ? path.startsWith(key + "/") : false
      ) || null;

    if (matchedKey) return ROUTE_TITLES[matchedKey];

    // 3) Ultimate fallback
    return APP_NAME;
  }, [location.pathname]);

  useEffect(() => {
    // Only update if different to avoid unnecessary writes.
    if (document.title !== computedTitle) {
      document.title = computedTitle;
    }
  }, [computedTitle]);

  return null; // This component renders nothing; it only performs the side-effect.
}

const App: React.FC = () => {
  return (
    <Router>
      {/* TitleUpdater must be inside Router to access useLocation */}
      <TitleUpdater />

      <AuthProvider>
        <Suspense
          // Accessibility: role + aria-live to announce loading to assistive tech
          fallback={
            <div
              className="flex items-center justify-center min-h-screen text-gray-300"
              role="status"
              aria-live="polite"
            >
              Loading…
            </div>
          }
        >
          <Routes>
            {/* Home handles: if user -> dashboard view, else -> landing */}
            <Route path="/" element={<Home />} />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;
