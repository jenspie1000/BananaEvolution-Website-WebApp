// src/pages/Login.tsx
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../utils/validationSchemas";
import {
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

type FormValues = { email: string; password: string };

const Login: React.FC = () => {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: yupResolver(loginSchema),
    });

    const onSubmit = useCallback(
        async (data: FormValues) => {
            try {
                const { user } = await signInWithEmailAndPassword(
                    auth,
                    data.email,
                    data.password
                );

                if (!user.emailVerified) {
                    try {
                        await sendEmailVerification(user);
                    } catch {
                        // ignore throttling errors
                    }
                    await signOut(auth);
                    alert(
                        "Please verify your email before continuing. We just sent you a new verification link."
                    );
                    return;
                }

                // ✅ Verified users go directly to the game app
                navigate("/app", { replace: true });
            } catch (error: any) {
                alert(error?.message || "Login failed. Please try again.");
            }
        },
        [navigate]
    );

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-black">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            {...register("email")}
                            className="w-full p-2 border rounded"
                            disabled={isSubmitting}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm">{errors.email.message}</p>
                        )}
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            {...register("password")}
                            className="w-full p-2 border rounded"
                            disabled={isSubmitting}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm">{errors.password.message}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded disabled:opacity-50"
                    >
                        {isSubmitting ? "Logging in…" : "Login"}
                    </button>
                </form>
                <p className="text-sm mt-4 text-gray-600">
                    Don’t have an account?{" "}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
