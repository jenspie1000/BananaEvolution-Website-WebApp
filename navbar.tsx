// src/components/navbar.tsx
import React, { useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

const rawLinks = [
    { name: "Home", to: "/" },
    { name: "Profile", to: "/profile" },
];

const linkBase = "px-2 py-1 transition-colors text-blue-950 hover:text-white";
const activeLink = "underline-offset-4";

const authBtn = "px-3 py-1 rounded-md transition-colors";
const loginBtn = `${authBtn} text-blue-950 hover:text-white hover:bg-blue-500/20`;
const registerBtn = `${authBtn} text-blue-950 hover:text-white hover:bg-blue-500/20`;
const logoutBtn =
    "px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors";

// Which links are visible to signed-out users
const PUBLIC_PREVIEW = new Set(["Home", "Leaderboards", "Pack Store", "Free Stickers"]);

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAuthed = !!user;
    const isVerified = !!(user && user.emailVerified);

    const [loggingOut, setLoggingOut] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const toggle = useCallback(() => setIsOpen((o) => !o), []);
    const close = useCallback(() => setIsOpen(false), []);

    const handleLogout = useCallback(async () => {
        try {
            setLoggingOut(true);
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Failed to log out. Please try again.");
        } finally {
            setLoggingOut(false);
            close();
        }
    }, [navigate, close]);

    const visibleLinks = isAuthed
        ? rawLinks
        : rawLinks.filter((l) => PUBLIC_PREVIEW.has(l.name));

    return (
        <>
            {/* Main Navbar */}
            <nav className="bg-yellow-500 text-white p-4 rounded-2xl md:rounded-full transition-all duration-300 sticky top-0 z-30">
                <div className="container mx-auto flex items-center">
                    {/* Mobile menu button */}
                    <button
                        onClick={toggle}
                        className="md:hidden text-blue-950 hover:text-white focus:outline-none pr-2 z-40"
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                    >
                        {isOpen ? (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex flex-1 justify-center space-x-4 lg:space-x-6">
                        {visibleLinks.map((link, idx) => (
                            <NavLink
                                key={`${link.name}-${idx}`}
                                to={link.to}
                                end={link.to === "/"}
                                className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
                            >
                                {link.name}
                            </NavLink>
                        ))}

                        {/* ▶ Play link — only when signed in & verified */}
                        {isVerified && (
                            <NavLink
                                to="/app"
                                className={({ isActive }) =>
                                    `px-3 py-1 rounded-md font-semibold transition-colors ${isActive ? "underline-offset-4" : ""
                                    } bg-white text-blue-950 hover:bg-white/90`
                                }
                            >
                                ▶ Play
                            </NavLink>
                        )}
                    </div>

                    {/* Desktop Controls */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthed ? (
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className={`${logoutBtn} ${loggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {loggingOut ? "Logging out..." : "Logout"}
                            </button>
                        ) : (
                            <>
                                <NavLink to="/login" className={loginBtn}>
                                    Login
                                </NavLink>
                                <NavLink to="/register" className={registerBtn}>
                                    Register
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-yellow-500 text-blue-950 flex flex-col px-4 py-2 space-y-2">
                    {visibleLinks.map((link, idx) => (
                        <NavLink
                            key={`${link.name}-mobile-${idx}`}
                            to={link.to}
                            end={link.to === "/"}
                            className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
                            onClick={close}
                        >
                            {link.name}
                        </NavLink>
                    ))}

                    {/* ▶ Play link — only when signed in & verified */}
                    {isVerified && (
                        <NavLink
                            to="/app"
                            className={`${linkBase} font-semibold`}
                            onClick={close}
                        >
                            ▶ Play
                        </NavLink>
                    )}

                    {isAuthed ? (
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className={`${logoutBtn} ${loggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {loggingOut ? "Logging out..." : "Logout"}
                        </button>
                    ) : (
                        <>
                            <NavLink to="/login" className={loginBtn} onClick={close}>
                                Login
                            </NavLink>
                            <NavLink to="/register" className={registerBtn} onClick={close}>
                                Register
                            </NavLink>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default Navbar;
