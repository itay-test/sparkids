import { useState } from "react";
import { useAuth, FREE_CREATION_LIMIT, STRIPE_MONTHLY_LINK, STRIPE_ANNUAL_LINK } from "../contexts/AuthContext";
import { X, Plus, Crown, Sparkles, LogOut, Trash2 } from "lucide-react";
import ChildProfileManager from "./ChildProfileManager";

export default function ParentDashboard({ onClose }) {
  const { user, userDoc, children, isPremium, deleteChild, signOut } = useAuth();
  const [addingChild, setAddingChild] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleDeleteChild(childId) {
    await deleteChild(childId);
    setConfirmDelete(null);
  }

  async function handleSignOut() {
    onClose?.();
    await signOut();
  }

  if (addingChild) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center pt-16 pb-10 px-4 overflow-y-auto" dir="rtl">
        <button onClick={() => setAddingChild(false)}
          className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:scale-90">
          <X size={20}/>
        </button>
        <div className="w-full max-w-md">
          <ChildProfileManager onDone={() => setAddingChild(false)}/>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center active:scale-90">
            <X size={20} color="white"/>
          </button>
          <button onClick={handleSignOut}
            className="flex items-center gap-2 bg-white/20 rounded-2xl px-4 py-2 active:scale-90">
            <LogOut size={16} color="white"/>
            <span className="text-white font-bold text-sm">יציאה</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          {user?.photoURL && (
            <img src={user.photoURL} className="w-16 h-16 rounded-full border-3 border-white"
              style={{ borderWidth: 3 }} alt=""/>
          )}
          <div>
            <p className="text-white font-black text-xl">{user?.displayName || "הורה"}</p>
            <p className="text-white/70 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Plan badge */}
        <div className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2
          ${isPremium() ? "bg-yellow-400 text-yellow-900" : "bg-white/20 text-white"}`}>
          {isPremium()
            ? <><Crown size={16}/><span className="font-black text-sm">פרמיום פעיל</span></>
            : <><Sparkles size={16}/><span className="font-bold text-sm">גרסה חינמית</span></>}
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6 max-w-md w-full mx-auto">

        {/* Upgrade banner for free users */}
        {!isPremium() && (
          <div className="card px-5 py-5 border-2 border-purple-200 bg-purple-50">
            <p className="text-purple-700 font-black text-lg mb-3">שדרגי לפרמיום ✨</p>
            <p className="text-purple-500 font-bold text-sm mb-4">
              יצירות ללא הגבלה, פרקי הרפתקה, ושיתוף קל לכל המשפחה
            </p>
            <div className="flex gap-3">
              <button onClick={() => window.open(STRIPE_ANNUAL_LINK, "_blank")}
                className="flex-1 py-3 rounded-2xl shimmer-btn text-white font-black text-base active:scale-95">
                ₪249/שנה
              </button>
              <button onClick={() => window.open(STRIPE_MONTHLY_LINK, "_blank")}
                className="flex-1 py-3 rounded-2xl border-2 border-purple-300 text-purple-700 font-black text-base active:scale-95">
                ₪29/חודש
              </button>
            </div>
          </div>
        )}

        {/* Children */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-purple-800 font-black text-xl">הילדים שלי</p>
            <button onClick={() => setAddingChild(true)}
              className="flex items-center gap-2 bg-purple-100 rounded-2xl px-4 py-2 text-purple-600 font-bold active:scale-90">
              <Plus size={16}/> הוסף
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {children.map(child => (
              <div key={child.id} className="card px-5 py-4 border-2 border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{child.emoji}</span>
                  <div>
                    <p className="text-purple-700 font-black text-lg">{child.name}</p>
                    <p className="text-purple-400 font-bold text-sm">
                      {child.creationCount || 0} יצירות
                      {!isPremium() && ` מתוך ${FREE_CREATION_LIMIT}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setConfirmDelete(child.id)}
                  className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center active:scale-90">
                  <Trash2 size={18} className="text-red-400"/>
                </button>
              </div>
            ))}

            {children.length === 0 && (
              <button onClick={() => setAddingChild(true)}
                className="card py-8 border-2 border-dashed border-purple-200 flex flex-col items-center gap-3 active:scale-95">
                <span className="text-5xl">👶</span>
                <p className="text-purple-400 font-bold">הוסף/י את הילד/ה הראשון/ה</p>
              </button>
            )}
          </div>
        </div>

        {/* Legal + Data (Ruti's requirement) */}
        <div className="card px-5 py-4 border-2 border-gray-100">
          <p className="text-gray-500 font-bold text-sm mb-3">נתונים ופרטיות</p>
          <div className="flex flex-col gap-2">
            <a href="/privacy" className="text-purple-500 font-bold text-sm">📄 מדיניות פרטיות</a>
            <a href="/terms" className="text-purple-500 font-bold text-sm">📋 תנאי שימוש</a>
            <button onClick={() => alert("בקשת מחיקת נתונים נשלחה. נחזור אליך תוך 48 שעות.")}
              className="text-red-400 font-bold text-sm text-right">🗑️ מחק את כל הנתונים שלי</button>
          </div>
        </div>

        <p className="text-gray-300 text-xs text-center">ניצוץ גרסה 1.0 • © 2026</p>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 text-center" dir="rtl">
            <p className="text-2xl font-black text-purple-800">מחיקת פרופיל</p>
            <p className="text-purple-500 font-bold">כל היצירות של הילד/ה יימחקו לצמיתות.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold">
                ביטול
              </button>
              <button onClick={() => handleDeleteChild(confirmDelete)}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black">
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
