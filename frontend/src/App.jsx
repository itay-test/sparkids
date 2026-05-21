import { useState, useRef } from "react";
import VoiceInput from "./components/VoiceInput";
import ImageDisplay from "./components/ImageDisplay";
import ShareModal from "./components/ShareModal";
import PhotoInput from "./components/PhotoInput";
import LoadingScreen from "./components/LoadingScreen";
import SongPlayer from "./components/SongPlayer";
import VoiceClone from "./components/VoiceClone";
import InstrumentPicker from "./components/InstrumentPicker";
import CharacterPicker from "./components/CharacterPicker";
import StoryPlayer from "./components/StoryPlayer";
import Logo from "./components/Logo";
import { Mic, Camera, ArrowLeft, X, Paintbrush2, ImagePlus, Crown, Star, Music2, BookOpen } from "lucide-react";
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
  const [status, setStatus]       = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult]       = useState(null);
  const [song, setSong]           = useState(null);
  const [showClone, setShowClone] = useState(false);
  const [hasClonedVoice, setHasClonedVoice] = useState(false);
  const [voiceChecked, setVoiceChecked] = useState(false);
  const [instruments, setInstruments] = useState(null); // null=not chosen, []=any
  const [songStep, setSongStep]   = useState("mode"); // mode|instruments|mic
  const [storyChar, setStoryChar] = useState(null);
  const [storyStep, setStoryStep] = useState("mode"); // mode|character|mic
  const [storyData, setStoryData] = useState(null);
  const abortRef                  = useRef(null);
  const [shareData, setShareData] = useState(null);
  const [mode, setMode]           = useState(null);   // null = not chosen yet
  const [photo, setPhoto]         = useState(null);

  async function handleTranscript(text, audioB64 = null) {
    if (!text) { setStatus("idle"); return; }
    setTranscript(text);
    setStatus("loading");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (mode === "story") {
        const { data } = await axios.post(`${API}/story/`,
          { idea: text, kid_name: "Carmel", character_id: storyChar },
          { signal: controller.signal });
        setStoryData(data);
      } else if (mode === "song") {
        const { data } = await axios.post(`${API}/song/`,
          { idea: text, kid_name: "Carmel", voice_audio_b64: audioB64, instruments: instruments || [] },
          { signal: controller.signal });
        setSong(data);
        setHasClonedVoice(true);
      } else {
        const payload = { idea: text, kid_name: "Carmel" };
        if (photo) payload.photo = photo;
        const { data } = await axios.post(`${API}/paint/`, payload,
          { signal: controller.signal });
        setResult(data);
      }
      setStatus("done");
    } catch (e) {
      if (axios.isCancel(e)) { setStatus("idle"); setTranscript(""); }
      else setStatus("idle");
    } finally {
      abortRef.current = null;
    }
  }

  function cancelLoading() {
    abortRef.current?.abort();
    setStatus("idle");
    setTranscript("");
  }

  // go back one level
  function goBack() {
    if (status === "done")      { setResult(null); setTranscript(""); setStatus("idle"); return; }
    if (status === "listening") { setStatus("idle"); return; }
    if (photo)                  { setPhoto(null); return; }
    if (mode)                   { setMode(null);  return; }
  }

  function selectSongMode() {
    setMode("song");
    setSongStep("instruments");
  }

  function reset() {
    setStatus("idle"); setTranscript(""); setResult(null);
    setSong(null); setShareData(null); setPhoto(null);
    setMode(null); setInstruments(null); setSongStep("mode");
    setStoryChar(null); setStoryStep("mode"); setStoryData(null);
  }

  async function handleShare() {
    if (!result) return;
    const { data } = await axios.post(`${API}/share/`, {
      kid_name: "Carmel", image_url: result.image_url, prompt_used: result.prompt_used,
    });
    setShareData(data);
  }

  const isIdle      = status === "idle";
  const isLoading   = status === "loading";
  const isListening = status === "listening";
  const isDone      = status === "done";

  // show back arrow whenever there's something to go back to
  const canGoBack = mode !== null || photo || status !== "idle" || result;

  return (
    <div className="min-h-screen flex flex-col items-center pb-16 relative overflow-hidden" dir="rtl">

      {/* Animated background */}
      {BG_DECO.map((d, i) => (
        <span key={i} className="fixed select-none pointer-events-none deco"
          style={{ top:`${d.top}%`, left:`${d.left}%`, fontSize:`${d.size}rem`,
            opacity:0.22, "--dur":`${d.dur}s`, "--delay":`${d.delay}s` }}>
          {d.e}
        </span>
      ))}

      {/* Header */}
      <div className="w-full bg-white/70 backdrop-blur-sm shadow-sm px-5 py-3 flex items-center justify-between mb-6 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Logo size={40}/>
          <span className="text-xl font-black bg-clip-text text-transparent"
            style={{backgroundImage:"linear-gradient(90deg,#7c3aed,#ec4899)"}}>
            Sparkids
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Back — one level */}
          {canGoBack && !isLoading && (
            <button onClick={goBack}
              className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-purple-400 hover:text-purple-700 hover:shadow-md transition-all">
              <ArrowLeft size={18}/>
            </button>
          )}
          {canGoBack && (
            <button onClick={reset}
              className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-gray-300 hover:text-red-400 hover:shadow-md transition-all">
              <X size={15}/>
            </button>
          )}
          <span className="text-lg font-black text-purple-700 flex items-center gap-1">
            כרמל <Crown size={18} className="text-yellow-400" fill="#facc15"/>
          </span>
        </div>
      </div>

      <div className="w-full max-w-md px-4 flex flex-col gap-5 relative z-10">

        {/* Step 1 — choose mode */}
        {!mode && (
          <div className="flex flex-col items-center gap-6 animate-pop">
            <div className="text-center">
              <Star size={52} className="text-yellow-400 mx-auto mb-2" fill="#facc15" strokeWidth={1}/>
              <p className="text-3xl font-black text-purple-800 leading-tight">היי כרמל!<br/>מה נצייר היום?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setMode("voice")}
                className="card py-8 px-4 flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-purple-200">
                <div className="w-20 h-20 shimmer-btn rounded-full flex items-center justify-center shadow-lg">
                  <Mic size={40} color="white" strokeWidth={1.5}/>
                </div>
                <span className="text-purple-700 font-black text-xl">ציור</span>
                <span className="text-purple-300 font-bold text-xs text-center">תגידי מה תרצי<br/>ואני אצייר</span>
              </button>
              <button onClick={() => setMode("photo")}
                className="card py-8 px-4 flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-pink-200">
                <div className="w-20 h-20 shimmer-btn rounded-full flex items-center justify-center shadow-lg">
                  <Camera size={40} color="white" strokeWidth={1.5}/>
                </div>
                <span className="text-purple-700 font-black text-xl">תמונה</span>
                <span className="text-purple-300 font-bold text-xs text-center">צלמי תמונה<br/>ואני אקשט אותה</span>
              </button>
            </div>
            {/* Story mode */}
            <button onClick={() => { setMode("story"); setStoryStep("character"); }}
              className="card w-full py-6 px-6 flex items-center gap-5 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-indigo-200">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg shrink-0"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)"}}>
                <BookOpen size={30} color="white" strokeWidth={1.5}/>
              </div>
              <div className="text-right">
                <p className="text-purple-700 font-black text-xl">סיפור לפני שינה</p>
                <p className="text-purple-300 font-bold text-sm">תגידי על מה הסיפור<br/>ובחרי מי יספר</p>
              </div>
            </button>

            {/* Song mode — full width */}
            <button onClick={selectSongMode}
              className="card w-full py-6 px-6 flex items-center gap-5 hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-pink-200">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg shrink-0"
                style={{background:"linear-gradient(135deg,#a855f7,#ec4899,#f97316)"}}>
                <Music2 size={32} color="white" strokeWidth={1.5}/>
              </div>
              <div className="text-right">
                <p className="text-purple-700 font-black text-xl">שיר</p>
                <p className="text-purple-300 font-bold text-sm">תגידי על מה השיר<br/>ואני אלחין ואשיר</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2 — photo upload */}
        {mode === "photo" && isIdle && <PhotoInput onPhoto={setPhoto} />}

        {/* Story: character picker */}
        {mode === "story" && isIdle && storyStep === "character" && (
          <CharacterPicker
            onSelect={(id) => { setStoryChar(id); setStoryStep("mic"); }}
            onBack={() => { setMode(null); setStoryStep("mode"); }}
          />
        )}

        {/* Step 2 — instrument picker (song mode) */}
        {mode === "song" && isIdle && songStep === "instruments" && (
          <InstrumentPicker
            onConfirm={(chosen) => { setInstruments(chosen); setSongStep("mic"); }}
            onBack={() => { setMode(null); setSongStep("mode"); }}
          />
        )}

        {/* Step 2/3 — mic screen */}
        {mode && !isDone && !isLoading &&
         (mode !== "song"  || songStep  === "mic") &&
         (mode !== "story" || storyStep === "mic") && (
          <div className="flex flex-col items-center gap-6 animate-pop">

            {/* Big instruction card */}
            {isIdle && !transcript && songStep !== "instruments" && storyStep !== "character" && (
              <div className="card w-full px-6 py-6 text-center border-2 border-purple-100">
                <div className="flex justify-center mb-3">
                  {mode === "photo" && !photo ? <ImagePlus size={44} className="text-pink-400" strokeWidth={1.5}/>
                    : mode === "song" ? <Music2 size={44} className="text-pink-500" strokeWidth={1.5}/>
                    : <Paintbrush2 size={44} className="text-purple-500" strokeWidth={1.5}/>}
                </div>
                <p className="text-2xl font-black text-purple-800">
                  {mode === "photo" && !photo ? "בחרי תמונה"
                    : mode === "song"  ? "על מה השיר?"
                    : mode === "story" ? "על מה הסיפור?"
                    : "דברי מה תרצי!"}
                </p>
                <p className="text-purple-300 font-bold text-sm mt-1">
                  {mode === "song"  ? "השיר יושר בקולך!"
                  : mode === "story" ? "נסיכה • חללית • כלב קטן"
                  : "כלב ורוד • חד קרן • נסיכה"}
                </p>
              </div>
            )}

            {/* Transcript bubble */}
            {transcript && isIdle && (
              <div className="card w-full px-6 py-5 text-center border-2 border-purple-200 animate-pop">
                <p className="text-sm font-bold text-purple-300 mb-1">כרמל אמרה 🎤</p>
                <p className="text-2xl font-black text-purple-700">"{transcript}"</p>
              </div>
            )}

            {/* Mic button */}
            <VoiceInput
              status={status}
              onTranscript={handleTranscript}
              onListening={() => setStatus("listening")}
              onCancel={() => setStatus("idle")}
              disabled={mode === "photo" && !photo}
              captureAudio={mode === "song"}
            />

            {/* Bouncing finger — points at mic */}
            {isIdle && !transcript && (mode === "voice" || (mode === "song" && songStep === "mic")) && (
              <div className="text-3xl animate-bounce -mt-2 opacity-50">👆</div>
            )}

          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <>
            <LoadingScreen mode={mode}/>
            <button onClick={cancelLoading}
              className="card w-full py-4 flex items-center justify-center gap-3 text-gray-400 font-black hover:text-red-400 hover:shadow-md active:scale-95 transition-all border-2 border-gray-100">
              <X size={20}/>
              ביטול
            </button>
          </>
        )}

        {/* Painting result */}
        {isDone && result && (
          <ImageDisplay
            imageUrl={result.image_url}
            promptUsed={result.prompt_used}
            onShare={handleShare}
            onReset={reset}
            onImproved={(data) => setResult(data)}
          />
        )}

        {/* Story result */}
        {isDone && storyData && (
          <StoryPlayer
            storyText={storyData.story_text}
            audioUrl={storyData.audio_url}
            characterId={storyData.character_id}
            onReset={reset}
          />
        )}

        {/* Song result */}
        {isDone && song && (
          <SongPlayer
            audioUrl={song.audio_url}
            lyrics={song.lyrics}
            hasClonedVoice={hasClonedVoice}
            onReset={reset}
            onCloneVoice={() => setShowClone(true)}
          />
        )}

        {/* Voice clone modal */}
        {showClone && (
          <VoiceClone
            onCloned={() => { setHasClonedVoice(true); setShowClone(false); }}
            onClose={() => { setShowClone(false); if (!hasClonedVoice) setMode(null); }}
          />
        )}

      </div>

      {shareData && <ShareModal shareData={shareData} onClose={() => setShareData(null)} />}
    </div>
  );
}
