import { initializeApp } from "firebase/app";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    reload,
    User,
} from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    increment,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot as onColSnapshot,
    deleteField,
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

/** =========================
 *  Firebase (client)
 *  ========================= */
const firebaseConfig = {
    apiKey: "AIzaSyCK8G0_DfYBIW9QJUSo9j4BIduR42tf7eQ",
    authDomain: "bananaevolution-d6d8e.firebaseapp.com",
    projectId: "bananaevolution-d6d8e",
    storageBucket: "bananaevolution-d6d8e.firebasestorage.app",
    messagingSenderId: "681932065135",
    appId: "1:681932065135:web:09334cc679829d3ac8409a",
    measurementId: "G-SJ4GGV1Y7W",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Named database (as you had it)
export const db = getFirestore(app, "banananevdb");

// Persist sessions across tabs/windows
setPersistence(auth, browserLocalPersistence).catch(() => { });

// Analytics (best-effort)
isSupported().then((ok) => ok && getAnalytics(app)).catch(() => { });

/** =========================
 *  Domain types
 *  ========================= */
export type CollectionKey = "Fire" | "Cookie" | "Alien" | "Space";
export type Currency = "€" | "$" | "฿";

/**
 * We only persist taps.all in the DB.
 * UI may enrich with daily/weekly/monthly for display, so mark them optional.
 */
export type Taps = {
    all: number;
    daily?: { key: string; value: number };
    weekly?: { key: string; value: number };
    monthly?: { key: string; value: number };
};

export type GameState = {
    currency: Currency;
    money: number;
    bananas: number;
    taps?: Taps; // DB guarantees presence of taps.all once user taps; UI may add period fields locally
    inventory: {
        fragments: Record<CollectionKey, number>;
        skins: Record<CollectionKey, { T1: number; T2: number; T3: number }>;
    };
    email?: string | null;
    emailVerified?: boolean;
    _createdAt?: any;
    _updatedAt?: any;
};

export const DEFAULT_GAME_STATE: GameState = {
    currency: "€",
    money: 0,
    bananas: 0,
    taps: { all: 0 }, // local default; DB gets created on first increment
    inventory: {
        fragments: { Fire: 0, Cookie: 0, Alien: 0, Space: 0 },
        skins: {
            Fire: { T1: 0, T2: 0, T3: 0 },
            Cookie: { T1: 0, T2: 0, T3: 0 },
            Alien: { T1: 0, T2: 0, T3: 0 },
            Space: { T1: 0, T2: 0, T3: 0 },
        },
    },
};

/** =========================
 *  Time helpers — Asia/Bangkok
 *  ========================= */
const TZ = "Asia/Bangkok";

function formatDateKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function getISOWeek(d: Date) {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((+dt - +yearStart) / 86400000 + 1) / 7);
    return { week: weekNo, year: dt.getUTCFullYear() };
}
function inBangkok(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
        .formatToParts(now)
        .reduce<Record<string, string>>((acc, p) => {
            if (p.type !== "literal") acc[p.type] = p.value;
            return acc;
        }, {});
    return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
}
export function getPeriodKeys() {
    const bkk = inBangkok();
    const dailyKey = formatDateKey(bkk);
    const { week, year } = getISOWeek(bkk);
    const weeklyKey = `${year}-W${String(week).padStart(2, "0")}`;
    const monthlyKey = `${bkk.getFullYear()}-${String(bkk.getMonth() + 1).padStart(2, "0")}`;
    return { dailyKey, weeklyKey, monthlyKey };
}

/** =========================
 *  Auth helpers
 *  ========================= */
export function onAuth(cb: (u: User | null) => void) {
    return onAuthStateChanged(auth, cb);
}
export async function register(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(cred.user.uid, cred.user.email ?? null, cred.user.emailVerified);
    if (!cred.user.emailVerified) await sendEmailVerification(cred.user).catch(() => { });
    return cred.user;
}
export async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(cred.user.uid, cred.user.email ?? null, cred.user.emailVerified);
    return cred.user;
}
export async function resendVerification() {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}
export async function refreshUser() {
    if (auth.currentUser) await reload(auth.currentUser);
}
export async function logout() {
    const uid = auth.currentUser?.uid;
    if (uid) { try { await logAuthEvent(uid, "logout"); } catch { } }
    await signOut(auth);
}
export function requireUser(): User {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in.");
    return u;
}
export function requireVerifiedUser(): User {
    const u = requireUser();
    if (!u.emailVerified) throw new Error("Email not verified.");
    return u;
}
export function getVerifiedUid(): string { return requireVerifiedUser().uid; }
export function getUid(): string { return requireUser().uid; }

/** =========================
 *  Firestore (users/{uid}) as game state
 *  ========================= */
const userDocRef = (uid: string) => doc(db, "users", uid);

/** ---- cleanup: remove legacy taps.daily/weekly/monthly; never create taps here ---- */
async function cleanupTapsShape(uid: string, data?: any) {
    const ref = userDocRef(uid);
    const t = data?.taps;
    const updates: any = {};

    if (t && typeof t === "object") {
        // Ensure all is a number if present
        if (Object.prototype.hasOwnProperty.call(t, "all") && typeof t.all !== "number") {
            const num = Number(t?.all?.value ?? 0) || 0;
            updates["taps.all"] = num;
        }
        // Delete per-period legacy fields if present
        if ("daily" in t) updates["taps.daily"] = deleteField();
        if ("weekly" in t) updates["taps.weekly"] = deleteField();
        if ("monthly" in t) updates["taps.monthly"] = deleteField();
    }

    if (Object.keys(updates).length > 0) {
        updates["_updatedAt"] = serverTimestamp();
        await updateDoc(ref, updates);
    }
}

/**
 * Create/merge the user doc (idempotent) and clean legacy taps fields.
 * IMPORTANT: We do NOT seed `taps` at creation — first increment creates it.
 */
export async function ensureUserProfile(
    uid: string,
    email?: string | null,
    emailVerified?: boolean
) {
    const ref = userDocRef(uid);
    let snap = await getDoc(ref).catch(() => null);
    const exists = !!snap?.exists();

    const base: Partial<GameState> & {
        email: string | null;
        emailVerified: boolean;
        _createdAt?: any;
        _updatedAt: any;
    } = {
        email: email ?? null,
        emailVerified: !!emailVerified,
        currency: "€",
        _updatedAt: serverTimestamp(),
    };

    if (!exists) {
        // Do NOT write taps here
        await setDoc(ref, {
            ...base,
            bananas: 0,
            money: 0,
            inventory: { ...DEFAULT_GAME_STATE.inventory },
            _createdAt: serverTimestamp(),
        }, { merge: true });
    } else {
        // Shape inventory; taps cleanup handled separately
        const data = snap!.data() as any;
        const inv = data.inventory || {};
        const fragments = inv.fragments || {};
        const skins = inv.skins || {};
        await setDoc(ref, {
            ...base,
            inventory: {
                fragments: {
                    Fire: fragments.Fire ?? 0,
                    Cookie: fragments.Cookie ?? 0,
                    Alien: fragments.Alien ?? 0,
                    Space: fragments.Space ?? 0,
                },
                skins: {
                    Fire: { T1: skins.Fire?.T1 ?? 0, T2: skins.Fire?.T2 ?? 0, T3: skins.Fire?.T3 ?? 0 },
                    Cookie: { T1: skins.Cookie?.T1 ?? 0, T2: skins.Cookie?.T2 ?? 0, T3: skins.Cookie?.T3 ?? 0 },
                    Alien: { T1: skins.Alien?.T1 ?? 0, T2: skins.Alien?.T2 ?? 0, T3: skins.Alien?.T3 ?? 0 },
                    Space: { T1: skins.Space?.T1 ?? 0, T2: skins.Space?.T2 ?? 0, T3: skins.Space?.T3 ?? 0 },
                },
            },
        }, { merge: true });

        await cleanupTapsShape(uid, data);
    }
}

/** Load game state (creates doc if missing) + cleanup */
export async function loadOrCreate(uid: string): Promise<GameState> {
    const ref = userDocRef(uid);
    let snap = await getDoc(ref);
    if (!snap.exists()) {
        // Create WITHOUT taps — first increment will create it
        await setDoc(ref, {
            currency: "€",
            bananas: 0,
            money: 0,
            inventory: { ...DEFAULT_GAME_STATE.inventory },
            _createdAt: serverTimestamp(),
            _updatedAt: serverTimestamp(),
        }, { merge: true });
        // Return local defaults (taps: {all:0} only in memory)
        return { ...DEFAULT_GAME_STATE };
    }

    // Remove legacy per-period fields if present
    await cleanupTapsShape(uid, snap.data());
    snap = await getDoc(ref);

    // Merge with local defaults so UI always has values
    return { ...DEFAULT_GAME_STATE, ...(snap.data() as GameState), currency: "€" };
}

/** Live subscribe to game state */
export function subscribeGame(uid: string, cb: (state: GameState) => void) {
    return onSnapshot(userDocRef(uid), (snap) => {
        if (snap.exists()) cb({ ...DEFAULT_GAME_STATE, ...(snap.data() as GameState), currency: "€" });
    });
}

/** Patch-save (never write `taps` here) */
export async function saveGame(uid: string, partial: Partial<GameState>) {
    const p = { ...partial } as any;
    if (p.currency && p.currency !== "€") p.currency = "€";
    // Guard: strip taps if someone accidentally passes it
    if (p.taps) delete p.taps;
    await updateDoc(userDocRef(uid), { ...p, _updatedAt: serverTimestamp() });
}

/** =========================
 *  Taps + Leaderboards
 *  ========================= */
export async function commitTapBatch(
    uid: string,
    opts: { tapsDelta: number; bananasDelta: number }
) {
    const { tapsDelta, bananasDelta } = opts;
    if (tapsDelta <= 0 && bananasDelta <= 0) return;

    const ref = userDocRef(uid);
    const { dailyKey, weeklyKey, monthlyKey } = getPeriodKeys();

    // Increment only the nested field; this creates taps→{all:N} if missing.
    await setDoc(ref, {
        bananas: increment(bananasDelta),
        "taps.all": increment(tapsDelta),
        _updatedAt: serverTimestamp(),
        currency: "€",
    }, { merge: true });

    // Leaderboards remain per period (implicitly reset by path)
    const dailyRef = doc(db, `leaderboards/daily/${dailyKey}/entries/${uid}`);
    const weeklyRef = doc(db, `leaderboards/weekly/${weeklyKey}/entries/${uid}`);
    const monthlyRef = doc(db, `leaderboards/monthly/${monthlyKey}/entries/${uid}`);

    const displayName = auth.currentUser?.email?.split("@")[0] ?? "You";

    await Promise.all([
        setDoc(dailyRef, { name: displayName, score: increment(tapsDelta), updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(weeklyRef, { name: displayName, score: increment(tapsDelta), updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(monthlyRef, { name: displayName, score: increment(tapsDelta), updatedAt: serverTimestamp() }, { merge: true }),
    ]);
}

/** Live leaderboards */
export function subscribeLeaderboards(
    keys: { dailyKey: string; weeklyKey: string; monthlyKey: string },
    cb: (boards: { daily: { name: string; score: number }[]; weekly: { name: string; score: number }[]; monthly: { name: string; score: number }[] }) => void
) {
    const unsubs: Array<() => void> = [];

    const dailyQ = query(collection(db, `leaderboards/daily/${keys.dailyKey}/entries`), orderBy("score", "desc"), limit(200));
    const weeklyQ = query(collection(db, `leaderboards/weekly/${keys.weeklyKey}/entries`), orderBy("score", "desc"), limit(200));
    const monthlyQ = query(collection(db, `leaderboards/monthly/${keys.monthlyKey}/entries`), orderBy("score", "desc"), limit(200));

    let daily: any[] = [];
    let weekly: any[] = [];
    let monthly: any[] = [];

    const emit = () => cb({ daily, weekly, monthly });

    unsubs.push(onColSnapshot(dailyQ, (snap) => { daily = snap.docs.map((d) => ({ ...(d.data() as any) })); emit(); }));
    unsubs.push(onColSnapshot(weeklyQ, (snap) => { weekly = snap.docs.map((d) => ({ ...(d.data() as any) })); emit(); }));
    unsubs.push(onColSnapshot(monthlyQ, (snap) => { monthly = snap.docs.map((d) => ({ ...(d.data() as any) })); emit(); }));

    return () => unsubs.forEach((u) => u());
}

/** Optional: auth event logs */
export async function logAuthEvent(uid: string, kind: "login" | "logout") {
    const id = `${kind}-${Date.now()}`;
    const ref = doc(db, `users/${uid}/events/${id}`);
    await setDoc(ref, { kind, at: serverTimestamp() });
}
