// src/pages/Profile.tsx
import React, { useEffect, useState, useCallback } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

type UserDoc = {
    uid: string;
    username?: string;
    email: string;
    createdAt?: any; // Firestore Timestamp
    emailVerified?: boolean;
};

const Profile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserDoc | null>(null);
    const [loadingDoc, setLoadingDoc] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        if (!user) return;
        setLoadingDoc(true);
        setError(null);
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
        } catch (e: any) {
            setError(e?.message || "Failed to load profile.");
        } finally {
            setLoadingDoc(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        loadProfile();
    }, [user, loadProfile]);

    const resendVerification = useCallback(async () => {
        if (!auth.currentUser) return;
        try {
            await sendEmailVerification(auth.currentUser);
            alert("Verification email sent. Check your inbox.");
        } catch (e: any) {
            alert(e?.message || "Could not send verification email.");
        }
    }, []);

    const refreshStatus = useCallback(async () => {
        if (!auth.currentUser) return;
        try {
            await auth.currentUser.reload(); // refresh emailVerified
            await loadProfile();             // re-read Firestore
        } catch (e: any) {
            alert(e?.message || "Failed to refresh status.");
        }
    }, [loadProfile]);

    const createProfileDoc = useCallback(async () => {
        if (!user) return;
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                username: "",
                createdAt: serverTimestamp(),
                emailVerified: user.emailVerified ?? false,
            } as UserDoc);
            await loadProfile();
        } catch (e: any) {
            alert(e?.message || "Failed to create profile document.");
        }
    }, [user, loadProfile]);

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            navigate("/login", { replace: true });
        } catch (e: any) {
            alert(e?.message || "Failed to sign out.");
        }
    }, [navigate]);

    if (!user) return null; // ProtectedRoute should guard this

    const verified = !!user.emailVerified;
    const createdDate =
        profile?.createdAt?.toDate ? profile.createdAt.toDate() : null;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-black">
                <h2 className="text-2xl font-bold mb-2">Your profile</h2>
                <p className="text-sm mb-4">
                    Status:{" "}
                    <span className={verified ? "text-green-600" : "text-red-600"}>
                        {verified ? "Email verified ✅" : "Not verified ❌"}
                    </span>
                </p>

                {loadingDoc ? (
                    <p className="text-gray-600">Loading profile…</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : profile ? (
                    <div className="space-y-2">
                        <div>
                            <div className="text-xs text-gray-500">UID</div>
                            <div className="font-mono break-all">{profile.uid}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div>{profile.email}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Username</div>
                            <div>{profile.username || <span className="text-gray-400">—</span>}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Created</div>
                            <div>{createdDate ? createdDate.toLocaleString() : "—"}</div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-gray-700">
                            No profile document found yet. (This can happen if rules blocked the initial write.)
                        </p>
                        <button
                            onClick={createProfileDoc}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded"
                        >
                            Create profile document
                        </button>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-2">
                    {!verified && (
                        <button
                            onClick={resendVerification}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-2 rounded"
                        >
                            Resend verification
                        </button>
                    )}
                    <button
                        onClick={refreshStatus}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-2 rounded"
                    >
                        Refresh status
                    </button>
                    <button
                        onClick={() => navigate("/", { replace: true })}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-2 rounded"
                    >
                        Home
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                    >
                        Logout
                    </button>
                </div>

                {verified && (
                    <button
                        onClick={() => navigate("/app")}
                        className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded"
                    >
                        Go to app
                    </button>
                )}
            </div>
        </div>
    );
};

export default Profile;
