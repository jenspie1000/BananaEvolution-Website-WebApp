// src/AuthGate.tsx
import { useEffect, useState } from "react";
import {
    auth,
    onAuth,
    register,
    login,
    resendVerification,
    refreshUser,
    logout,
} from "./firebase";

type Mode = "login" | "register";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<Mode>("login");
    const [userReady, setUserReady] = useState(false);
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const user = auth.currentUser;

    useEffect(() => {
        const unsub = onAuth(() => setUserReady(true));
        return unsub;
    }, []);

    async function handleRegister() {
        setErr(null); setInfo(null);
        try {
            await register(email.trim(), pass);
            setInfo("Verification email sent. Check your inbox.");
        } catch (e: any) {
            setErr(e?.message ?? "Failed to register.");
        }
    }
    async function handleLogin() {
        setErr(null); setInfo(null);
        try {
            await login(email.trim(), pass);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to sign in.");
        }
    }
    async function handleResend() {
        setErr(null); setInfo(null);
        try {
            await resendVerification();
            setInfo("Verification email re-sent.");
        } catch (e: any) {
            setErr(e?.message ?? "Failed to resend email.");
        }
    }
    async function handleRefresh() {
        setErr(null); setInfo(null);
        try {
            await refreshUser();
            if (auth.currentUser?.emailVerified) setInfo("Email verified. Enjoy!");
            else setInfo("Still not verified. Refresh after clicking the link in your email.");
        } catch (e: any) {
            setErr(e?.message ?? "Failed to refresh status.");
        }
    }

    // Gate: show nothing until we know auth state
    if (!userReady) {
        return (
            <div className="min-h-screen grid place-items-center bg-black text-white">
                <div className="text-white/80">Loading…</div>
            </div>
        );
    }

    // Not signed in ? show login/register
    if (!auth.currentUser) {
        return (
            <div className="min-h-screen grid place-items-center bg-gradient-to-b from-slate-950 to-black text-white px-4">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
                    <h1 className="text-xl font-semibold mb-4">Banana Evolution — Sign {mode === "login" ? "in" : "up"}</h1>

                    <div className="space-y-3">
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
                        {err && <div className="text-red-400 text-sm">{err}</div>}
                        {info && <div className="text-emerald-400 text-sm">{info}</div>}
                        <button
                            className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
                            onClick={mode === "login" ? handleLogin : handleRegister}
                        >
                            {mode === "login" ? "Sign in" : "Create account"}
                        </button>
                    </div>

                    <div className="mt-4 text-sm text-white/60">
                        {mode === "login" ? (
                            <>No account?{" "}
                                <button className="underline hover:text-white" onClick={() => setMode("register")}>
                                    Register
                                </button>
                            </>
                        ) : (
                            <>Have an account?{" "}
                                <button className="underline hover:text-white" onClick={() => setMode("login")}>
                                    Sign in
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Signed in but not verified
    if (!auth.currentUser.emailVerified) {
        const em = auth.currentUser.email ?? "(your email)";
        return (
            <div className="min-h-screen grid place-items-center bg-gradient-to-b from-slate-950 to-black text-white px-4">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl space-y-3">
                    <h1 className="text-xl font-semibold">Verify your email</h1>
                    <p className="text-white/70 text-sm">
                        We sent a verification link to <b>{em}</b>. Click it, then come back and refresh.
                    </p>
                    {err && <div className="text-red-400 text-sm">{err}</div>}
                    {info && <div className="text-emerald-400 text-sm">{info}</div>}
                    <div className="flex gap-2">
                        <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
                            onClick={handleResend}>
                            Resend email
                        </button>
                        <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
                            onClick={handleRefresh}>
                            I verified — Refresh
                        </button>
                        <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 ml-auto"
                            onClick={logout}>
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Verified ? show the app
    return <>{children}</>;
}
