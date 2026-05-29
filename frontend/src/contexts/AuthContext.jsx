import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export const FREE_CREATION_LIMIT = 10;

const STRIPE_MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK || "#SETUP_STRIPE";
const STRIPE_ANNUAL_LINK  = import.meta.env.VITE_STRIPE_ANNUAL_LINK  || "#SETUP_STRIPE";
export { STRIPE_MONTHLY_LINK, STRIPE_ANNUAL_LINK };

export function AuthProvider({ children: jsxChildren }) {
  const [user, setUser]               = useState(null);
  const [userDoc, setUserDoc]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeChildId, setActiveChildId] = useState(null);
  const [childProfiles, setChildProfiles] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await ensureUserDoc(firebaseUser);
        await loadChildProfiles(firebaseUser.uid);
      } else {
        setUser(null); setUserDoc(null);
        setChildProfiles([]); setActiveChildId(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function ensureUserDoc(firebaseUser) {
    const ref  = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const d = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        plan: "free",
        stripeCustomerId: null,
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, d);
      setUserDoc(d);
    } else {
      setUserDoc(snap.data());
    }
  }

  async function loadChildProfiles(uid) {
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "users", uid, "children"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setChildProfiles(list);
    if (list.length > 0) setActiveChildId(prev => prev || list[0].id);
  }

  async function addChild(name, emoji) {
    const { collection, addDoc } = await import("firebase/firestore");
    const ref = await addDoc(collection(db, "users", user.uid, "children"), {
      name, emoji, createdAt: serverTimestamp(), creationCount: 0,
    });
    const newChild = { id: ref.id, name, emoji, creationCount: 0 };
    setChildProfiles(prev => [...prev, newChild]);
    setActiveChildId(ref.id);
    return ref.id;
  }

  async function deleteChild(childId) {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", user.uid, "children", childId));
    setChildProfiles(prev => {
      const next = prev.filter(c => c.id !== childId);
      if (activeChildId === childId) setActiveChildId(next[0]?.id || null);
      return next;
    });
  }

  async function getCreationCount(childId) {
    if (!user || !childId) return 0;
    const snap = await getDoc(doc(db, "users", user.uid, "children", childId));
    return snap.exists() ? (snap.data().creationCount || 0) : 0;
  }

  async function incrementCreationCount(childId) {
    if (!user || !childId) return;
    await updateDoc(doc(db, "users", user.uid, "children", childId),
      { creationCount: increment(1) });
    setChildProfiles(prev => prev.map(c =>
      c.id === childId ? { ...c, creationCount: (c.creationCount || 0) + 1 } : c
    ));
  }

  function isPremium() { return userDoc?.plan === "premium"; }

  function isAtLimit(childId) {
    if (isPremium()) return false;
    const child = childProfiles.find(c => c.id === childId);
    return (child?.creationCount || 0) >= FREE_CREATION_LIMIT;
  }

  async function upgradeFromStripe(sessionId) {
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const idToken = await user.getIdToken();
      const res = await fetch(`${API}/payment/verify?session_id=${sessionId}`,
        { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.ok) { setUserDoc(prev => ({ ...prev, plan: "premium" })); return true; }
    } catch { /* silent */ }
    return false;
  }

  async function signInWithGoogle() { await signInWithPopup(auth, googleProvider); }
  async function signOut()          { await firebaseSignOut(auth); }
  async function getIdToken()       { return user ? user.getIdToken() : null; }

  const activeChild = childProfiles.find(c => c.id === activeChildId) || null;

  return (
    <AuthContext.Provider value={{
      user, userDoc, loading,
      childProfiles, activeChild, activeChildId, setActiveChildId,
      addChild, deleteChild,
      getCreationCount, incrementCreationCount,
      isPremium, isAtLimit, upgradeFromStripe,
      signInWithGoogle, signOut, getIdToken,
    }}>
      {jsxChildren}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
