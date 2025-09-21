// src/pages/Register.tsx
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "../utils/validationSchemas";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    type ActionCodeSettings,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

type FormValues = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

// Where users land after clicking the verification link
const actionCodeSettings: ActionCodeSettings = {
    url: `${window.location.origin}/login`,
    handleCodeInApp: false,
    // If you configured Firebase Dynamic Links, add:
    // dynamicLinkDomain: "your-domain.page.link",
};

const Register: React.FC = () => {
    const [notice, setNotice] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: yupResolver(registerSchema) });

    const onSubmit = useCallback(async (data: FormValues) => {
        setNotice(null);
        setErrorMsg(null);

        try {
            // 1) Create the auth user
            const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);

            // 2) Firestore write (best-effort; don't block UX)
            setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                username: data.username,
                email: data.email,
                createdAt: serverTimestamp(),
                emailVerified: false,
            }).catch((e) => {
                console.warn("Profile doc write failed:", e?.code, e?.message || e);
            });

            // 3) Try to send the verification email
            let msg =
                "Account created. We sent a verification email — please check your inbox, verify, then log in.";
            try {
                await sendEmailVerification(user, actionCodeSettings);
            } catch (e: any) {
                const code = e?.code || "";
                console.warn("sendEmailVerification failed:", code, e?.message || e);
                if (code === "auth/too-many-requests") {
                    msg =
                        "Account created. A verification email was recently sent — please wait a few minutes and try again.";
                } else if (
                    code === "auth/invalid-continue-uri" ||
                    code === "auth/unauthorized-continue-uri" ||
                    code === "auth/missing-android-pkg-name"
                ) {
                    msg =
                        "Account created. Email settings need adjustment — use 'Resend verification' from the Profile page.";
                } else {
                    msg =
                        "Account created. Couldn’t send the verification email right now — use 'Resend verification' from the Profile page.";
                }
            }

            // 4) Sign out the unverified session
            try {
                await signOut(auth);
            } catch { }

            setNotice(msg);
        } catch (err: any) {
            // Friendlier messages for common auth errors
            const code = err?.code || "";
            let msg = err?.message || "Registration failed.";
            if (code === "auth/email-already-in-use") msg = "That email is already in use. Try logging in instead.";
            if (code === "auth/invalid-email") msg = "That email address looks invalid.";
            if (code === "auth/weak-password") msg = "Password is too weak (min 6 characters).";
            setErrorMsg(msg);
        }
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-black">
                <h2 className="text-2xl font-bold mb-4">Create account</h2>

                {notice && <p className="mb-3 text-green-600 text-sm">{notice}</p>}
                {errorMsg && <p className="mb-3 text-red-600 text-sm">{errorMsg}</p>}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            {...register("username")}
                            className="w-full p-2 border rounded"
                            disabled={isSubmitting}
                            autoComplete="username"
                        />
                        {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            {...register("email")}
                            className="w-full p-2 border rounded"
                            disabled={isSubmitting}
                            autoComplete="email"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            {...register("password")}
                            className="w-full p-2 border rounded"
                            disabled={isSubmitting}
                            autoComplete="new-password"
                        />
                        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Confirm password"
                            {...register("confirmPassword")}
                            className="w-full p-2 border rounded"
                            disabled={isSubmitting}
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded disabled:opacity-50"
                    >
                        {isSubmitting ? "Creating…" : "Create account"}
                    </button>
                </form>

                <p className="text-sm mt-4 text-gray-600">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
