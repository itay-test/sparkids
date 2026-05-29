import { createContext, useContext, useEffect, useState } from "react";
import { FIREBASE_ENABLED, auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export const FREE_CREATION_LIMIT = 10;
const STRIPE_MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK || "#SETUP_STRIPE";
const STRIPE_ANNUAL_LINK  = import.meta.env.VITE_STRIPE_ANNUAL_LINK  || "#SETUP_STRIPE";
export { STRIPE_MONTHLY_LINK, STRIPE_ANNUAL_LINK };

// ─── Local mode helpers (localStorage only, no Firebase) ─────────────────────
const LOCAL_KEY = "nitzutz_local_user";

function loadLocalUser() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || null; }
  catch { return null; }
}

function saveLocalUser(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {}
}

function loadLocalChildren(userId) {
  try { return JSON.parse(localStorage.getItem(`nitzutz_children_${userId}`)) || []; }
  catch { return []; }
}

function saveLocalChildren(userId, list) {
  try { localStorage.setItem(`nitzutz_children_${userId}`, JSON.stringify(list)); } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children: jsxChildren }) {
  const [user, setUser]                   = useState(null);
  const [userDoc, setUserDoc]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [activeChildId, setActiveChildId] = useState(null);
  const [childProfiles, setChildProfiles] = useState([]);

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (FIREBASE_ENABLED && auth) {
      // Firebase mode
      const { onAuthStateChanged } = require("firebase/auth");
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          await ensureUserDoc(firebaseUser);
          await loadChildProfilesFromFirestore(firebaseUser.uid);
        } else {
          setUser(null); setUserDoc(null);
          setChildProfiles([]); setActiveChildId(null);
        }
        setLoading(false);
      });
      return unsub;
    } else {
      // Local mode — check for existing local user
      const local = loadLocalUser();
      if (local) {
        setUser(local);
        setUserDoc({ plan: "premium" }); // local mode = always premium for testing
        const kids = loadLocalChildren(local.uid);
        setChildProfiles(kids);
        if (kids.length > 0) setActiveChildId(kids[0].id);
      }
      setLoading(false);
    }
  }, []);

  // ── Firebase helpers ───────────────────────────────────────────────────────
  async function ensureUserDoc(firebaseUser) {
    const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const ref  = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const d = { email: firebaseUser.email, displayName: firebaseUser.displayName,
                  plan: "free", stripeCustomerId: null, createdAt: serverTimestamp() };
      await setDoc(ref, d);
      setUserDoc(d);
    } else { setUserDoc(snap.data()); }
  }

  async function loadChildProfilesFromFirestore(uid) {
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "users", uid, "children"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setChildProfiles(list);
    if (list.length > 0) setActiveChildId(prev => prev || list[0].id);
  }

  // ── Child management ───────────────────────────────────────────────────────
  async function addChild(name, emoji) {
    const newId = `child_${Date.now()}`;
    const newChild = { id: newId, name, emoji, creationCount: 0 };

    if (FIREBASE_ENABLED && db && user?.uid) {
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const ref = await addDoc(collection(db, "users", user.uid, "children"),
        { name, emoji, createdAt: serverTimestamp(), creationCount: 0 });
      newChild.id = ref.id;
    }

    const next = [...childProfiles, newChild];
    setChildProfiles(next);
    setActiveChildId(newChild.id);
    if (!FIREBASE_ENABLED) saveLocalChildren(user?.uid || "local", next);
    return newChild.id;
  }

  async function deleteChild(childId) {
    if (FIREBASE_ENABLED && db && user?.uid) {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "users", user.uid, "children", childId));
    }
    setChildProfiles(prev => {
      const next = prev.filter(c => c.id !== childId);
      if (activeChildId === childId) setActiveChildId(next[0]?.id || null);
      if (!FIREBASE_ENABLED) saveLocalChildren(user?.uid || "local", next);
      return next;
    });
  }

  // ── Local sign-in (no Firebase) ────────────────────────────────────────────
  function signInLocal(name) {
    const localUser = { uid: `local_${Date.now()}`, displayName: name,
      email: null, photoURL: null, isLocal: true };
    saveLocalUser(localUser);
    setUser(localUser);
    setUserDoc({ plan: "premium" });
    setChildProfiles([]);
  }

  // ── Creation limit (Firestore for Firebase mode, localStorage for local) ───
  async function getCreationCount(childId) {
    if (!FIREBASE_ENABLED || !db || !user?.uid) return 0;
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "users", user.uid, "children", childId));
    return snap.exists() ? (snap.data().creationCount || 0) : 0;
  }

  async function incrementCreationCount(childId) {
    if (FIREBASE_ENABLED && db && user?.uid) {
      const { doc, updateDoc, increment } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid, "children", childId),
        { creationCount: increment(1) });
    }
    setChildProfiles(prev => {
      const next = prev.map(c =>
        c.id === childId ? { ...c, creationCount: (c.creationCount || 0) + 1 } : c);
      if (!FIREBASE_ENABLED) saveLocalChildren(user?.uid || "local", next);
      return next;
    });
  }

  function isPremium() {
    if (!FIREBASE_ENABLED) return true; // local mode = always premium for demo
    return userDoc?.plan === "premium";
  }

  function isAtLimit(childId) {
    if (isPremium()) return false;
    const child = childProfiles.find(c => c.id === childId);
    return (child?.creationCount || 0) >= FREE_CREATION_LIMIT;
  }

  async function upgradeFromStripe(sessionId) {
    if (!FIREBASE_ENABLED || !user) return false;
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const idToken = await user.getIdToken();
      const res = await fetch(`${API}/payment/verify?session_id=${sessionId}`,
        { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.ok) { setUserDoc(prev => ({ ...prev, plan: "premium" })); return true; }
    } catch {}
    return false;
  }

  // ── Auth actions ───────────────────────────────────────────────────────────
  async function signInWithGoogle() {
    if (!FIREBASE_ENABLED || !auth) throw new Error("Firebase not configured");
    const { signInWithPopup } = await import("firebase/auth");
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    if (FIREBASE_ENABLED && auth) {
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem(LOCAL_KEY);
      setUser(null); setUserDoc(null); setChildProfiles([]); setActiveChildId(null);
    }
  }

  async function getIdToken() {
    if (!FIREBASE_ENABLED || !user || user.isLocal) return null;
    return user.getIdToken?.() || null;
  }

  const activeChild = childProfiles.find(c => c.id === activeChildId) || null;

  return (
    <AuthContext.Provider value={{
      user, userDoc, loading,
      FIREBASE_ENABLED,
      childProfiles, activeChild, activeChildId, setActiveChildId,
      addChild, deleteChild,
      signInLocal,
      getCreationCount, incrementCreationCount,
      isPremium, isAtLimit, upgradeFromStripe,
      signInWithGoogle, signOut, getIdToken,
    }}>
      {jsxChildren}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
