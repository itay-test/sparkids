import { useState, useRef, useEffect } from "react";
import { AuthProvider, useAuth, FREE_CREATION_LIMIT } from "./contexts/AuthContext";
import LoginScreen from "./components/LoginScreen";
import ChildProfileManager from "./components/ChildProfileManager";
import ParentDashboard from "./components/ParentDashboard";
import Paywall from "./components/Paywall";
import VoiceInput from "./components/VoiceInput";
import ImageDisplay from "./components/ImageDisplay";
import ShareModal from "./components/ShareModal";
import PhotoInput from "./components/PhotoInput";
import LoadingScreen from "./components/LoadingScreen";
import SongPlayer from "./components/SongPlayer";
import CharacterPicker from "./components/CharacterPicker";
import StoryPlayer from "./components/StoryPlayer";
import UserSwitcher from "./components/UserSwitcher";
import CompanionCreator from "./components/CompanionCreator";
import CompanionAvatar from "./components/CompanionAvatar";
import Logo from "./components/Logo";
import { useCompanion } from "./hooks/useCompanion";
import { usePreferences } from "./hooks/usePreferences";
import { useGallery } from "./hooks/useGallery";
import { Mic, Camera, ArrowLeft, X, Paintbrush2, ImagePlus, Music2, BookOpen, UserCircle2 } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const BG_DECO = [
  { e:"🌸", top:5,  left:5,  size:2.8, dur:3.8, delay:0   },
  { e:"⭐", top:12, left:80, size:2.2, dur:4.2, delay:0.5 },
  { e:"🦋", top:22, left:15, size:3.0, dur:5.0, delay:1.0 },
  { e:"🌺", top:35, left:88, size:2.5, dur:4.5, delay:0.3 },
  { e:"✨", top:48, left:3,  size:2.0, dur:3.2, delay:1.5 },
  { e:"🌙", top:55, left:75, size:2.8, dur:4.8, delay:0.8 },
  { e:"🎀", top:65, left:20, size:3.2, dur:3.5, delay:0.2 },
  { e:"💫", top:72, left:60, size:2.3, dur:4.0, delay:1.2 },
  { e:"🌟", top:88, left:85, size:3.0, dur:3.9, delay:1.8 },
];

// ─── Inner app — requires auth ────────────────────────────────────────────────
function AppInner() {
  const {
    user, loading,
    childProfiles, activeChild, activeChildId, setActiveChildId,
    isPremium, isAtLimit, incrementCreationCount, getIdToken, upgradeFromStripe,
  } = useAuth();

  // Per-child hooks (keyed by userId+childId so data stays separate)
  const storageKey     = user ? `${user.uid}_${activeChildId}` : "guest";
  const gallery        = useGallery(storageKey);
  const { prefs, addLike, dismissCelebration, prefString } = usePreferences(storageKey);
  const { companion, save: saveCompanion, companionString } = useCompanion(storageKey);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [status, setStatus]         = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult]         = useState(null);
  const [song, setSong]             = useState(null);
  const [storyData, setStoryData]   = useState(null);
  const [mode, setMode]             = useState(null);
  const [photo, setPhoto]           = useState(null);
  const [storyChar, setStoryChar]   = useState(null);
  const [storyStep, setStoryStep]   = useState("character");
  const [shareData, setShareData]   = useState(null);
  const [showParentDash, setShowParentDash] = useState(false);
  const [showPaywall, setShowPaywall]       = useState(false);
  const [showCreationCelebration, setShowCreationCelebration] = useState(false);
  const abortRef = useRef(null);

  // ── Check for Stripe redirect ─────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId && user) {
      upgradeFromStripe(sessionId).then(ok => {
        if (ok) {
          window.history.replaceState({}, "", window.location.pathname);
          setShowCreationCelebration(true);
          setTimeout(() => setShowCreationCelebration(false), 4000);
        }
      });
    }
  }, [user]);

  // ── Celebration auto-dismiss ──────────────────────────────────────────────
  useEffect(() => {
    if (!prefs.showCelebration) return;
    const t = setTimeout(dismissCelebration, 2500);
    return () => clearTimeout(t);
  }, [prefs.showCelebration]);

  const isIdle      = status === "idle";
  const isLoading   = status === "loading";
  const isDone      = status === "done";
  const canGoBack   = mode !== null || photo || status !== "idle" || result || song || storyData;

  // ── Creation handler ──────────────────────────────────────────────────────
  async function handleTranscript(text, audioB64 = null) {
    if (!text) { setStatus("idle"); return; }

    // Check free tier limit before starting
    if (isAtLimit(activeChildId)) {
      setShowPaywall(true);
      return;
    }

    setTranscript(text);
    setStatus("loading");
    const controller = new AbortController();
    abortRef.current = controller;

    const idToken = await getIdToken();
    const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};
    const companionPayload = companion
      ? { companion_name: companion.name, companion_likes: companion.likes?.join(", ") || "" }
      : {};

    try {
      if (mode === "story") {
        const { data } = await axios.post(`${API}/story/`,
          { idea: text, kid_name: activeChild?.name || "ילד",
            character_id: storyChar, melody_mood: "magic",
            include_video: false, preferences: prefString, ...companionPayload },
          { signal: controller.signal, headers });
        setStoryData(data);
        gallery.save({ type: "story", characterId: storyChar, transcript: text });
      } else if (mode === "song") {
        const { data } = await axios.post(`${API}/song/`,
          { idea: text, kid_name: activeChild?.name || "ילד",
            voice_audio_b64: audioB64, instruments: [],
            preferences: prefString, ...companionPayload },
          { signal: controller.signal, headers });
        setSong(data);
        gallery.save({ type: "song", transcript: text });
      } else {
        const payload = { idea: text, kid_name: activeChild?.name || "ילד",
          preferences: prefString,
          companion_name: companion?.name || "",
          companion_desc: companion?.companionType || "" };
        if (photo) payload.photo = photo;
        const { data } = await axios.post(`${API}/paint/`, payload,
          { signal: controller.signal, headers });
        setResult(data);
        gallery.save({ type: "image", imageUrl: data.image_url, transcript: text });
      }
      addLike(text);
      await incrementCreationCount(activeChildId);
      setStatus("done");
      setShowCreationCelebration(true);
      setTimeout(() => setShowCreationCelebration(false), 3000);
    } catch (e) {
      if (axios.isCancel(e)) { setStatus("idle"); setTranscript(""); }
      else setStatus("idle");
    } finally { abortRef.current = null; }
  }

  function cancelLoading() { abortRef.current?.abort(); setStatus("idle"); setTranscript(""); }

  function goBack() {
    if (status === "done")       { setResult(null); setSong(null); setStoryData(null); setTranscript(""); setStatus("idle"); return; }
    if (status === "listening")  { setStatus("idle"); return; }
    if (photo)                   { setPhoto(null); return; }
    if (mode === "story" && storyStep === "mic") { setStoryStep("character"); return; }
    if (mode)                    { setMode(null); return; }
  }

  function reset() {
    setStatus("idle"); setTranscript(""); setResult(null);
    setSong(null); setShareData(null); setPhoto(null);
    setMode(null); setStoryChar(null); setStoryStep("character"); setStoryData(null);
  }

  async function handleShareNative(text, title = "ניצוץ") {
    if (navigator.share) { try { await navigator.share({ title, text }); } catch {} }
    else { try { await navigator.clipboard.writeText(text); } catch {} }
  }

  // ── Show login if not authenticated ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-6xl animate-bounce">✨</div>
      </div>
    );
  }

  if (!user) return <LoginScreen/>;

  // ── Show child profile creation if no children ────────────────────────────
  if (childProfiles.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-16 pb-10 px-4" dir="rtl"
        style={{ background: "linear-gradient(160deg,#ede9fe,#fdf2f8)" }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo size={60}/>
            <p className="text-4xl font-black text-purple-800 mt-4">ברוך הבא! 🌟</p>
            <p className="text-purple-400 font-bold text-lg mt-1">
              {user.displayName?.split(" ")[0] || "הורה"}, בוא/י ניצור את הפרופיל הראשון
            </p>
          </div>
          <ChildProfileManager/>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center pb-20 relative overflow-hidden" dir="rtl">

      {BG_DECO.map((d, i) => (
        <span key={i} className="fixed select-none pointer-events-none deco"
          style={{ top:`${d.top}%`, left:`${d.left}%`, fontSize:`${d.size}rem`,
            opacity:0.22, "--dur":`${d.dur}s`, "--delay":`${d.delay}s` }}>
          {d.e}
        </span>
      ))}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="w-full bg-white/70 backdrop-blur-sm shadow-sm px-4 sticky top-0 z-10"
        style={{ paddingTop: 10, paddingBottom: 18 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Logo size={36}/>
            <span className="text-lg font-black bg-clip-text text-transparent"
              style={{ backgroundImage:"linear-gradient(90deg,#7c3aed,#ec4899)" }}>
              ניצוץ
            </span>
            {isPremium() && <span className="text-yellow-500 text-sm font-black">✨</span>}
          </div>
          <div className="flex items-center gap-2">
            {canGoBack && !isLoading && (
              <button onClick={goBack}
                className="w-12 h-12 rounded-full bg-purple-100 shadow flex items-center justify-center text-purple-500 active:scale-95">
                <ArrowLeft size={22}/>
              </button>
            )}
            {canGoBack && (
              <button onClick={reset}
                className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center text-gray-300 hover:text-red-400 active:scale-95">
                <X size={20}/>
              </button>
            )}
            {/* Parent icon */}
            <button onClick={() => setShowParentDash(true)}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 shadow active:scale-90">
              {user.photoURL
                ? <img src={user.photoURL} className="w-full h-full object-cover" alt=""/>
                : <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                    <UserCircle2 size={20} className="text-purple-400"/>
                  </div>}
            </button>
          </div>
        </div>

        {/* Child switcher */}
        <div className="flex items-center gap-3 justify-center">
          {childProfiles.map(child => (
            <button key={child.id} onClick={() => { setActiveChildId(child.id); reset(); }}
              className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${activeChildId === child.id ? "scale-110" : "opacity-50"}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl
                ${activeChildId === child.id ? "ring-4 ring-purple-400 ring-offset-2 bg-purple-50" : "bg-gray-100"}`}>
                {child.emoji}
              </div>
              <span className={`text-xs font-black ${activeChildId === child.id ? "text-purple-700" : "text-transparent"}`}>
                {child.name}
              </span>
            </button>
          ))}
          {/* Free tier counter */}
          {!isPremium() && activeChild && (
            <div className="mr-2 flex flex-col items-center">
              <div className="text-xs font-bold text-purple-400">
                {activeChild.creationCount || 0}/{FREE_CREATION_LIMIT}
              </div>
              <div className="w-12 h-1.5 bg-purple-100 rounded-full mt-0.5">
                <div className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${Math.min(((activeChild.creationCount||0)/FREE_CREATION_LIMIT)*100,100)}%` }}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Toasts ──────────────────────────────────────────────────────── */}
      {prefs.showCelebration && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-pop" onClick={dismissCelebration}>
          <div className="bg-white rounded-3xl shadow-2xl px-7 py-4 flex items-center gap-3 border-2 border-purple-100">
            <span className="text-3xl animate-bounce">✨</span>
            <span className="text-purple-700 font-black text-xl">זכרתי!</span>
          </div>
        </div>
      )}

      {showCreationCelebration && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-pop">
          <div className="bg-white rounded-3xl shadow-2xl px-7 py-4 flex items-center gap-3 border-2 border-pink-100">
            <span className="text-3xl animate-bounce">🎉</span>
            <span className="text-purple-700 font-black text-xl">כל הכבוד {activeChild?.name}!</span>
            <span className="text-3xl animate-bounce" style={{ animationDelay:"0.15s" }}>⭐</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md px-4 flex flex-col gap-5 relative z-10 mt-6">

        {/* ── Home ────────────────────────────────────────────────────── */}
        {!mode && (
          <div className="flex flex-col items-center gap-5 animate-pop">

            <div className="text-center">
              <p className="text-4xl font-black text-purple-800 leading-tight">
                היי {activeChild?.name || ""}! 👋
              </p>
              <p className="text-purple-400 font-bold text-lg mt-1">מה נעשה היום?</p>
            </div>

            {/* Companion banner */}
            {!companion ? (
              <button onClick={() => setMode("companion")}
                className="w-full card py-5 px-5 flex items-center gap-4 hover:shadow-xl active:scale-95 border-2 border-dashed border-purple-300">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                  style={{ background:"linear-gradient(135deg,#f9a8d4,#c084fc)" }}>
                  <span className="text-3xl">✨</span>
                </div>
                <div className="text-right">
                  <p className="text-purple-700 font-black text-lg">צור/י את הדמות שלך!</p>
                  <p className="text-purple-400 font-bold text-sm">תופיע בכל היצירות שלך</p>
                </div>
              </button>
            ) : (
              <button onClick={() => setMode("companion")}
                className="w-full card py-4 px-5 flex items-center gap-4 hover:shadow-xl active:scale-95 border-2 border-purple-200">
                <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-purple-300 shrink-0" style={{ borderWidth:3 }}>
                  {companion.imageUrl
                    ? <img src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center text-2xl bg-purple-100">✨</div>}
                </div>
                <div className="text-right flex-1">
                  <p className="text-purple-700 font-black text-lg">{companion.name} 🌟</p>
                  {companion.likes?.length > 0 && (
                    <p className="text-purple-400 font-bold text-sm">אוהב/ת: {companion.likes.slice(0,2).join(", ")}</p>
                  )}
                </div>
                <span className="text-purple-300 text-sm font-bold">שנה/י</span>
              </button>
            )}

            {/* Mode cards */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setMode("voice")}
                className="card py-10 px-4 flex flex-col items-center gap-4 hover:shadow-xl active:scale-95 border-2 border-transparent hover:border-purple-200">
                <div className="w-24 h-24 shimmer-btn rounded-full flex items-center justify-center shadow-lg">
                  <Mic size={48} color="white" strokeWidth={1.5}/>
                </div>
                <span className="text-purple-700 font-black text-2xl">🎨 ציור</span>
              </button>
              <button onClick={() => setMode("photo")}
                className="card py-10 px-4 flex flex-col items-center gap-4 hover:shadow-xl active:scale-95 border-2 border-transparent hover:border-pink-200">
                <div className="w-24 h-24 shimmer-btn rounded-full flex items-center justify-center shadow-lg">
                  <Camera size={48} color="white" strokeWidth={1.5}/>
                </div>
                <span className="text-purple-700 font-black text-2xl">📸 תמונה</span>
              </button>
            </div>

            <button onClick={() => { setMode("story"); setStoryStep("character"); }}
              className="card w-full py-8 px-6 flex items-center gap-5 hover:shadow-xl active:scale-95 border-2 border-transparent hover:border-indigo-200">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shrink-0"
                style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)" }}>
                <BookOpen size={36} color="white" strokeWidth={1.5}/>
              </div>
              <span className="text-purple-700 font-black text-2xl">📖 סיפור</span>
            </button>

            <button onClick={() => setMode("song")}
              className="card w-full py-8 px-6 flex items-center gap-5 hover:shadow-xl active:scale-95 border-2 border-transparent hover:border-pink-200">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shrink-0"
                style={{ background:"linear-gradient(135deg,#a855f7,#ec4899,#f97316)" }}>
                <Music2 size={36} color="white" strokeWidth={1.5}/>
              </div>
              <span className="text-purple-700 font-black text-2xl">🎵 שיר קריוקי</span>
            </button>

            {/* Upgrade nudge for free users close to limit */}
            {!isPremium() && (activeChild?.creationCount || 0) >= FREE_CREATION_LIMIT - 3 && (
              <button onClick={() => setShowPaywall(true)}
                className="w-full card py-4 px-5 border-2 border-yellow-200 bg-yellow-50 flex items-center justify-between active:scale-95">
                <span className="text-yellow-700 font-black text-base">⭐ שדרגי לפרמיום</span>
                <span className="text-yellow-600 font-bold text-sm">
                  {FREE_CREATION_LIMIT - (activeChild?.creationCount || 0)} יצירות נותרו
                </span>
              </button>
            )}
          </div>
        )}

        {/* ── Companion creator ──────────────────────────────────────── */}
        {mode === "companion" && (
          <CompanionCreator
            kidName={activeChild?.name}
            onDone={(data) => { saveCompanion(data); setMode(null); }}
            onBack={() => setMode(null)}
          />
        )}

        {/* ── Photo upload ───────────────────────────────────────────── */}
        {mode === "photo" && isIdle && <PhotoInput onPhoto={setPhoto}/>}

        {/* ── Story: character picker ────────────────────────────────── */}
        {mode === "story" && isIdle && storyStep === "character" && (
          <CharacterPicker
            onSelect={(id) => { setStoryChar(id); setStoryStep("mic"); }}
            onBack={() => setMode(null)}
          />
        )}

        {/* ── Mic screen ────────────────────────────────────────────── */}
        {mode && mode !== "companion" && !isDone && !isLoading &&
         !(mode === "story" && storyStep === "character") && (
          <div className="flex flex-col items-center gap-6 animate-pop">
            {isIdle && !transcript && (
              <div className="card w-full px-6 py-7 text-center border-2 border-purple-100">
                {companion && (
                  <p className="text-purple-400 font-bold text-sm mb-2">{companion.name} יצור איתך! 🌟</p>
                )}
                <div className="flex justify-center mb-3">
                  {mode === "photo" && !photo ? <ImagePlus size={52} className="text-pink-400" strokeWidth={1.5}/>
                    : mode === "song" ? <Music2 size={52} className="text-pink-500" strokeWidth={1.5}/>
                    : <Paintbrush2 size={52} className="text-purple-500" strokeWidth={1.5}/>}
                </div>
                <p className="text-3xl font-black text-purple-800">
                  {mode === "photo" && !photo ? "בחר/י תמונה"
                    : mode === "song"  ? "על מה השיר?"
                    : mode === "story" ? "על מה הסיפור?"
                    : "דבר/י מה תרצה/י!"}
                </p>
                <p className="text-purple-400 font-bold text-base mt-2">
                  {mode === "song" ? "🎤 שיר/י לי את הרעיון" : "🦄 כלב ורוד • חד קרן • נסיכה"}
                </p>
              </div>
            )}

            {transcript && isIdle && (
              <div className="card w-full px-6 py-5 text-center border-2 border-purple-200 animate-pop">
                <p className="text-sm font-bold text-purple-300 mb-1">{activeChild?.name} אמר/ה 🎤</p>
                <p className="text-2xl font-black text-purple-700">"{transcript}"</p>
              </div>
            )}

            <VoiceInput
              status={status}
              onTranscript={handleTranscript}
              onListening={() => setStatus("listening")}
              onCancel={() => setStatus("idle")}
              disabled={mode === "photo" && !photo}
              captureAudio={mode === "song"}
            />

            {isIdle && !transcript && (
              <div className="text-3xl animate-bounce -mt-2 opacity-50">👆</div>
            )}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────── */}
        {isLoading && (
          <>
            <LoadingScreen mode={mode}/>
            <button onClick={cancelLoading}
              className="card w-full py-4 flex items-center justify-center gap-3 text-gray-400 font-black active:scale-95 border-2 border-gray-100">
              <X size={20}/> ביטול
            </button>
          </>
        )}

        {/* ── Results ────────────────────────────────────────────────── */}
        {isDone && result && (
          <ImageDisplay imageUrl={result.image_url} promptUsed={result.prompt_used}
            onShare={() => {}}  onReset={reset}
            onImproved={(data) => { setResult(data); gallery.save({ type:"image", imageUrl:data.image_url, transcript }); }}/>
        )}

        {isDone && storyData && (
          <StoryPlayer
            storyText={storyData.story_text} scenes={storyData.scenes}
            sceneImages={storyData.scene_images} audioUrl={storyData.audio_url}
            melodyUrl={storyData.melody_url} characterId={storyData.character_id}
            onReset={reset}
            onShare={() => handleShareNative(`${activeChild?.name} יצר/ה סיפור:\n\n${storyData.story_text}`, "סיפור מניצוץ")}
            onImproved={(data) => { setStoryData(prev => ({ ...data, melody_url: prev?.melody_url })); }}/>
        )}

        {isDone && song && (
          <SongPlayer instrumentalUrl={song.instrumental_url} lyrics={song.lyrics}
            style={song.style} voiceType={song.voice_type} instruments={song.instruments}
            companionName={companion?.name}
            onReset={reset}
            onShare={() => handleShareNative(`${activeChild?.name} יצר/ה שיר:\n\n${song.lyrics}`, "שיר מניצוץ")}
            onImproved={(data) => { setSong(data); gallery.save({ type:"song", transcript }); }}/>
        )}
      </div>

      {/* Persistent companion avatar */}
      <CompanionAvatar companion={companion} onClick={() => { if (!mode) setMode("companion"); }}/>

      {/* Parent dashboard */}
      {showParentDash && <ParentDashboard onClose={() => setShowParentDash(false)}/>}

      {/* Paywall */}
      {showPaywall && (
        <Paywall
          childName={activeChild?.name}
          usedCount={activeChild?.creationCount || 0}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {shareData && <ShareModal shareData={shareData} onClose={() => setShareData(null)}/>}
    </div>
  );
}

// ─── Root — wrap with AuthProvider ────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner/>
    </AuthProvider>
  );
}
