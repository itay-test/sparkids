import { useState, useRef, useEffect } from "react";
import VoiceInput from "./components/VoiceInput";
import ImageDisplay from "./components/ImageDisplay";
import ShareModal from "./components/ShareModal";
import PhotoInput from "./components/PhotoInput";
import LoadingScreen from "./components/LoadingScreen";
import SongPlayer from "./components/SongPlayer";
import VoiceClone from "./components/VoiceClone";
import CharacterPicker from "./components/CharacterPicker";
import StoryPlayer from "./components/StoryPlayer";
import UserSwitcher from "./components/UserSwitcher";
import GalleryRow from "./components/GalleryRow";
import CompanionCreator from "./components/CompanionCreator";
import CompanionAvatar from "./components/CompanionAvatar";
import Logo from "./components/Logo";
import { USERS } from "./config/users";
import { useGallery } from "./hooks/useGallery";
import { usePreferences } from "./hooks/usePreferences";
import { useCompanion } from "./hooks/useCompanion";
import { Mic, Camera, ArrowLeft, X, Paintbrush2, ImagePlus, Music2, BookOpen, Stars } from "lucide-react";
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
  { e:"🌷", top:82, left:8,  size:2.6, dur:5.2, delay:0.7 },
  { e:"🦄", top:88, left:85, size:3.0, dur:3.9, delay:1.8 },
  { e:"🍭", top:30, left:50, size:2.0, dur:4.3, delay:0.4 },
  { e:"🌟", top:60, left:40, size:2.4, dur:3.6, delay:2.0 },
];

export default function App() {
  // ── Active user ──────────────────────────────────────────
  const [activeUserId, setActiveUserId] = useState("carmel");
  const activeUser = USERS.find(u => u.id === activeUserId) || USERS[3];
  const gallery    = useGallery(activeUserId);
  const { prefs, addLike, dismissCelebration, prefString } = usePreferences(activeUserId);
  const { companion, save: saveCompanion, companionString } = useCompanion(activeUserId);

  // ── Creation celebration (fires on done) ─────────────────
  const [showCreationCelebration, setShowCreationCelebration] = useState(false);

  useEffect(() => {
    if (!prefs.showCelebration) return;
    const t = setTimeout(dismissCelebration, 2500);
    return () => clearTimeout(t);
  }, [prefs.showCelebration]);

  // ── Core state ────────────────────────────────────────────
  const [status, setStatus]         = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult]         = useState(null);
  const [song, setSong]             = useState(null);
  const [storyData, setStoryData]   = useState(null);
  const [showClone, setShowClone]   = useState(false);
  const [hasClonedVoice, setHasClonedVoice] = useState(false);
  const [mode, setMode]             = useState(null);
  const [photo, setPhoto]           = useState(null);
  const [storyChar, setStoryChar]   = useState(null);
  const [storyStep, setStoryStep]   = useState("character");
  const [shareData, setShareData]   = useState(null);
  const [galleryItem, setGalleryItem] = useState(null);
  const abortRef = useRef(null);

  const isIdle      = status === "idle";
  const isLoading   = status === "loading";
  const isListening = status === "listening";
  const isDone      = status === "done";

  const canGoBack = mode !== null || photo || status !== "idle" || result || song || storyData;

  // ── Creation handlers ─────────────────────────────────────
  async function handleTranscript(text, audioB64 = null) {
    if (!text) { setStatus("idle"); return; }
    setTranscript(text);
    setStatus("loading");
    const controller = new AbortController();
    abortRef.current = controller;

    // Build companion payload
    const companionPayload = companion
      ? { companion_name: companion.name, companion_likes: companion.likes?.join(", ") || "" }
      : {};

    try {
      if (mode === "story") {
        const { data } = await axios.post(`${API}/story/`,
          { idea: text, kid_name: activeUser.name,
            character_id: storyChar,
            melody_mood: "magic",
            include_video: false,
            preferences: prefString,
            ...companionPayload },
          { signal: controller.signal });
        setStoryData(data);
        gallery.save({ type: "story", characterId: storyChar, transcript: text });
        addLike(text);
      } else if (mode === "song") {
        const { data } = await axios.post(`${API}/song/`,
          { idea: text, kid_name: activeUser.name,
            voice_audio_b64: audioB64,
            instruments: [],
            preferences: prefString,
            ...companionPayload },
          { signal: controller.signal });
        setSong(data);
        setHasClonedVoice(true);
        gallery.save({ type: "song", transcript: text });
        addLike(text);
      } else {
        const payload = { idea: text, kid_name: activeUser.name,
          preferences: prefString,
          companion_name: companion?.name || "",
          companion_desc: companion?.companionType || "" };
        if (photo) payload.photo = photo;
        const { data } = await axios.post(`${API}/paint/`, payload,
          { signal: controller.signal });
        setResult(data);
        gallery.save({ type: "image", imageUrl: data.image_url, transcript: text });
        addLike(text);
      }
      setStatus("done");
      // Celebrate with kid's name
      setShowCreationCelebration(true);
      setTimeout(() => setShowCreationCelebration(false), 3000);
    } catch (e) {
      if (axios.isCancel(e)) { setStatus("idle"); setTranscript(""); }
      else setStatus("idle");
    } finally { abortRef.current = null; }
  }

  function cancelLoading() {
    abortRef.current?.abort();
    setStatus("idle");
    setTranscript("");
  }

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
    setMode(null); setStoryChar(null);
    setStoryStep("character"); setStoryData(null);
    setShowCreationCelebration(false);
  }

  async function handleShare() {
    if (!result) return;
    const { data } = await axios.post(`${API}/share/`, {
      kid_name: activeUser.name, image_url: result.image_url, prompt_used: result.prompt_used,
    });
    setShareData(data);
  }

  async function handleShareNative(text, title = "Sparkids") {
    if (navigator.share) {
      try { await navigator.share({ title, text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  }

  function switchUser(id) { reset(); setActiveUserId(id); }
  function openGalleryItem(item) { setGalleryItem(item); }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center pb-20 relative overflow-hidden" dir="rtl">

      {/* Background decoration */}
      {BG_DECO.map((d, i) => (
        <span key={i} className="fixed select-none pointer-events-none deco"
          style={{ top:`${d.top}%`, left:`${d.left}%`, fontSize:`${d.size}rem`,
            opacity:0.22, "--dur":`${d.dur}s`, "--delay":`${d.delay}s` }}>
          {d.e}
        </span>
      ))}

      {/* ── Header ────────────────────────────────────────── */}
      <div className="w-full bg-white/70 backdrop-blur-sm shadow-sm px-4 sticky top-0 z-10"
        style={{ paddingTop: 10, paddingBottom: 18 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Logo size={36}/>
            <span className="text-lg font-black bg-clip-text text-transparent"
              style={{ backgroundImage:"linear-gradient(90deg,#7c3aed,#ec4899)" }}>
              Sparkids
            </span>
          </div>
          <div className="flex items-center gap-2">
            {canGoBack && !isLoading && (
              <button onClick={goBack}
                className="w-14 h-14 rounded-full bg-purple-100 shadow flex items-center justify-center text-purple-500 hover:bg-purple-200 active:scale-95 transition-all">
                <ArrowLeft size={26}/>
              </button>
            )}
            {canGoBack && (
              <button onClick={reset}
                className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 active:scale-95 transition-all">
                <X size={22}/>
              </button>
            )}
          </div>
        </div>
        <UserSwitcher activeId={activeUserId} onChange={switchUser}/>
      </div>

      {/* ── Toasts ────────────────────────────────────────── */}
      {prefs.showCelebration && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-pop" onClick={dismissCelebration}>
          <div className="bg-white rounded-3xl shadow-2xl px-7 py-4 flex items-center gap-3 border-2 border-purple-100">
            <span className="text-3xl animate-bounce">✨</span>
            <span className="text-purple-700 font-black text-xl">זכרתי!</span>
            <span className="text-3xl animate-bounce" style={{ animationDelay:"0.15s" }}>🌟</span>
          </div>
        </div>
      )}

      {showCreationCelebration && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-pop">
          <div className="bg-white rounded-3xl shadow-2xl px-7 py-4 flex items-center gap-3 border-2 border-pink-100">
            <span className="text-3xl animate-bounce">🎉</span>
            <span className="text-purple-700 font-black text-xl">כל הכבוד {activeUser.name}!</span>
            <span className="text-3xl animate-bounce" style={{ animationDelay:"0.15s" }}>⭐</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md px-4 flex flex-col gap-5 relative z-10 mt-8">

        {/* ── Home: mode selector ────────────────────────── */}
        {!mode && !galleryItem && (
          <div className="flex flex-col items-center gap-5 animate-pop">

            <div className="text-center">
              <p className="text-4xl font-black text-purple-800 leading-tight">
                היי {activeUser.name}! 👋
              </p>
              <p className="text-purple-400 font-bold text-lg mt-1">מה נעשה היום?</p>
            </div>

            {/* Companion banner — if no companion, invite to create */}
            {!companion ? (
              <button onClick={() => setMode("companion")}
                className="w-full card py-5 px-5 flex items-center gap-4 hover:shadow-xl transition-all active:scale-95 border-2 border-dashed border-purple-300 hover:border-purple-400">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                  style={{ background:"linear-gradient(135deg,#f9a8d4,#c084fc)" }}>
                  <span className="text-3xl">✨</span>
                </div>
                <div className="text-right">
                  <p className="text-purple-700 font-black text-lg">צור/י את הדמות שלך!</p>
                  <p className="text-purple-400 font-bold text-sm">הדמות תופיע בכל היצירות שלך</p>
                </div>
              </button>
            ) : (
              <button onClick={() => setMode("companion")}
                className="w-full card py-4 px-5 flex items-center gap-4 hover:shadow-xl transition-all active:scale-95 border-2 border-purple-200">
                <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-purple-300 shrink-0"
                  style={{ borderWidth: 3 }}>
                  {companion.imageUrl
                    ? <img src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center text-2xl bg-purple-100">✨</div>
                  }
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

            {/* Creation modes */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setMode("voice")}
                className="card py-10 px-4 flex flex-col items-center gap-4 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-purple-200">
                <div className="w-24 h-24 shimmer-btn rounded-full flex items-center justify-center shadow-lg">
                  <Mic size={48} color="white" strokeWidth={1.5}/>
                </div>
                <span className="text-purple-700 font-black text-2xl">🎨 ציור</span>
              </button>

              <button onClick={() => setMode("photo")}
                className="card py-10 px-4 flex flex-col items-center gap-4 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-pink-200">
                <div className="w-24 h-24 shimmer-btn rounded-full flex items-center justify-center shadow-lg">
                  <Camera size={48} color="white" strokeWidth={1.5}/>
                </div>
                <span className="text-purple-700 font-black text-2xl">📸 תמונה</span>
              </button>
            </div>

            <button onClick={() => { setMode("story"); setStoryStep("character"); }}
              className="card w-full py-8 px-6 flex items-center gap-5 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-indigo-200">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shrink-0"
                style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)" }}>
                <BookOpen size={36} color="white" strokeWidth={1.5}/>
              </div>
              <span className="text-purple-700 font-black text-2xl">📖 סיפור</span>
            </button>

            <button onClick={() => setMode("song")}
              className="card w-full py-8 px-6 flex items-center gap-5 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-pink-200">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shrink-0"
                style={{ background:"linear-gradient(135deg,#a855f7,#ec4899,#f97316)" }}>
                <Music2 size={36} color="white" strokeWidth={1.5}/>
              </div>
              <span className="text-purple-700 font-black text-2xl">🎵 שיר קריוקי</span>
            </button>

            <GalleryRow items={gallery.items} onOpen={openGalleryItem}/>
          </div>
        )}

        {/* ── Companion creator flow ──────────────────────── */}
        {mode === "companion" && (
          <CompanionCreator
            kidName={activeUser.name}
            onDone={(data) => { saveCompanion(data); setMode(null); }}
            onBack={() => setMode(null)}
          />
        )}

        {/* ── Photo upload ────────────────────────────────── */}
        {mode === "photo" && isIdle && <PhotoInput onPhoto={setPhoto}/>}

        {/* ── Story: character picker ─────────────────────── */}
        {mode === "story" && isIdle && storyStep === "character" && (
          <CharacterPicker
            onSelect={(id) => { setStoryChar(id); setStoryStep("mic"); }}
            onBack={() => { setMode(null); }}
          />
        )}

        {/* ── Mic screen ──────────────────────────────────── */}
        {mode && mode !== "companion" && !isDone && !isLoading &&
         !(mode === "story" && storyStep === "character") && (
          <div className="flex flex-col items-center gap-6 animate-pop">

            {isIdle && !transcript && (
              <div className="card w-full px-6 py-7 text-center border-2 border-purple-100">
                {companion && (
                  <p className="text-purple-400 font-bold text-sm mb-2">
                    {companion.name} יצור איתך! 🌟
                  </p>
                )}
                <div className="flex justify-center mb-3">
                  {mode === "photo" && !photo
                    ? <ImagePlus size={52} className="text-pink-400" strokeWidth={1.5}/>
                    : mode === "song"
                    ? <Music2 size={52} className="text-pink-500" strokeWidth={1.5}/>
                    : <Paintbrush2 size={52} className="text-purple-500" strokeWidth={1.5}/>}
                </div>
                <p className="text-3xl font-black text-purple-800">
                  {mode === "photo" && !photo ? "בחר/י תמונה"
                    : mode === "song"  ? "על מה השיר?"
                    : mode === "story" ? "על מה הסיפור?"
                    : "דבר/י מה תרצה/י!"}
                </p>
                <p className="text-purple-400 font-bold text-base mt-2">
                  {mode === "song"  ? "🎤 שיר/י לי את הרעיון"
                  : mode === "story" ? "🌟 נסיכה • חללית • כלב קטן"
                  : "🦄 כלב ורוד • חד קרן • נסיכה"}
                </p>
              </div>
            )}

            {transcript && isIdle && (
              <div className="card w-full px-6 py-5 text-center border-2 border-purple-200 animate-pop">
                <p className="text-sm font-bold text-purple-300 mb-1">{activeUser.name} אמר/ה 🎤</p>
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

            {isIdle && !transcript && (mode === "voice" || mode === "song" || mode === "story") && (
              <div className="text-3xl animate-bounce -mt-2 opacity-50">👆</div>
            )}
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────── */}
        {isLoading && (
          <>
            <LoadingScreen mode={mode}/>
            <button onClick={cancelLoading}
              className="card w-full py-4 flex items-center justify-center gap-3 text-gray-400 font-black hover:text-red-400 hover:shadow-md active:scale-95 transition-all border-2 border-gray-100">
              <X size={20}/> ביטול
            </button>
          </>
        )}

        {/* ── Results ─────────────────────────────────────── */}
        {isDone && result && (
          <ImageDisplay
            imageUrl={result.image_url}
            promptUsed={result.prompt_used}
            onShare={handleShare}
            onReset={reset}
            onImproved={(data) => {
              setResult(data);
              gallery.save({ type: "image", imageUrl: data.image_url, transcript });
            }}
          />
        )}

        {isDone && storyData && (
          <StoryPlayer
            storyText={storyData.story_text}
            scenes={storyData.scenes}
            sceneImages={storyData.scene_images}
            audioUrl={storyData.audio_url}
            melodyUrl={storyData.melody_url}
            characterId={storyData.character_id}
            onReset={reset}
            onShare={() => handleShareNative(
              `${activeUser.name} יצר/ה סיפור:\n\n${storyData.story_text}`,
              "סיפור מ-Sparkids"
            )}
            onImproved={(data) => {
              setStoryData(prev => ({ ...data, melody_url: prev?.melody_url }));
              gallery.save({ type: "story", characterId: storyData.character_id, transcript });
            }}
          />
        )}

        {isDone && song && (
          <SongPlayer
            instrumentalUrl={song.instrumental_url}
            lyrics={song.lyrics}
            style={song.style}
            voiceType={song.voice_type}
            instruments={song.instruments}
            companionName={companion?.name}
            onReset={reset}
            onShare={() => handleShareNative(
              `${activeUser.name} יצר/ה שיר:\n\n${song.lyrics}`,
              "שיר מ-Sparkids"
            )}
            onImproved={(data) => {
              setSong(data);
              gallery.save({ type: "song", transcript });
            }}
          />
        )}

        {showClone && (
          <VoiceClone
            onCloned={() => { setHasClonedVoice(true); setShowClone(false); }}
            onClose={() => { setShowClone(false); if (!hasClonedVoice) setMode(null); }}
          />
        )}
      </div>

      {/* Persistent companion avatar */}
      <CompanionAvatar
        companion={companion}
        onClick={() => { if (!mode) setMode("companion"); }}
      />

      {shareData && <ShareModal shareData={shareData} onClose={() => setShareData(null)}/>}
    </div>
  );
}
