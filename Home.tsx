// src/pages/Home.tsx
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const Home: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="bg-gradient-to-b from-purple-900 to-indigo-900 text-white flex flex-col">
            <Navbar />

            <main className="min-h-screen flex-grow grid place-items-center px-4">
                {!user && (
                    // Landing view (unauthenticated)
                    <div className="text-center max-w-xl">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
                            Welcome to <span className="text-yellow-400">Banana Evolution</span> 🍌
                        </h1>
                        <p className="text-lg text-gray-300 mb-8">
                            Click bananas, collect skins, and climb the leaderboard. Start your journey now!
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                to="/login"
                                className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                )}

                {user && !user.emailVerified && (
                    // Signed in but not verified
                    <div className="text-center max-w-xl">
                        <h1 className="text-4xl font-bold mb-4">Verify your email 📧</h1>
                        <p className="text-lg text-gray-300 mb-6">
                            We sent a verification link to your email. Please verify to start playing.
                        </p>
                        <Link
                            to="/login"
                            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}

                {user && user.emailVerified && (
                    // Signed in and verified
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-8">
                            BANANA <span className="text-yellow-400">EVOLUTION</span> 🍌
                        </h1>
                        <Link
                            to="/app"
                            className="px-8 py-4 bg-yellow-500 text-black text-2xl font-extrabold rounded-xl hover:bg-yellow-600 transition shadow-lg"
                        >
                            ▶ Play Banana Evolution
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Home;
