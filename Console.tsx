// src/pages/Console.tsx
import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Optional: show the projectId you're actually hitting
function getProjectId(): string {
    // @ts-ignore
    return (db as any)?._databaseId?.projectId || (db as any)?.app?.options?.projectId || "(unknown)";
}

const ConsolePage: React.FC = () => {
    const [result, setResult] = useState<string>("");

    const run = useCallback(async () => {
        setResult("Testing Firestore…");
        try {
            const pid = getProjectId();
            const ref = doc(db, "debug", "ping");
            await setDoc(ref, { lastPing: serverTimestamp(), rand: Math.random() }, { merge: true });
            const snap = await getDoc(ref);
            setResult(
                `✅ Firestore OK\nprojectId: ${pid}\nreadback: ${JSON.stringify(snap.data(), null, 2)}`
            );
        } catch (e: any) {
            // You’ll see things like:
            // - permission-denied (rules)
            // - failed-precondition / appCheck token issues (if enforced)
            // - UNAUTHENTICATED (not signed in)
            setResult(`❌ Firestore error\ncode: ${e?.code}\nmessage: ${e?.message}`);
            console.error("Firestore test failed:", e);
        }
    }, []);

    useEffect(() => { run(); }, [run]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <div className="w-full max-w-xl bg-white rounded-lg shadow p-6 text-black">
                <h2 className="text-xl font-bold mb-2">Firestore Doctor</h2>
                <pre className="bg-gray-100 rounded p-3 overflow-x-auto text-sm whitespace-pre-wrap">
                    {result}
                </pre>
                <button
                    onClick={run}
                    className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                >
                    Run again
                </button>
            </div>
        </div>
    );
};

export default ConsolePage;
