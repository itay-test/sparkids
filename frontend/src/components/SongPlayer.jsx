import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Sparkles, Music2, Mic } from "lucide-react";

export default function SongPlayer({ audioUrl, instrumentalUrl, lyrics, hasClonedVoice, onReset, onCloneVoice }) {
  const vocalsRef       = useRef(null);
  const instrumentalRef = useRef(null);
  const audioRef        = vocalsRef; // alias for existing code
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = vocalsRef.current;
    const b = instrumentalRef.current;
    if (!a) return;
    if (b) { b.volume = 0.35; b.loop = true; }
    a.onloadedmetadata = () => setDuration(a.duration);
    a.ontimeupdate    = () => setProgress(a.currentTime / (a.duration || 1));
    a.onended         = () => { setPlaying(false); b?.pause(); };
    a.play().then(() => { setPlaying(true); b?.play(); }).catch(() => {});
  }, [audioUrl]);

  function toggle() {
    const a = vocalsRef.current;
    const b = instrumentalRef.current;
    if (!a) return;
    if (playing) { a.pause(); b?.pause(); setPlaying(false); }
    else         { a.play();  b?.play();  setPlaying(true);  }
  }

  function restart() {
    const a = vocalsRef.current;
    const b = instrumentalRef.current;
    if (!a) return;
    a.currentTime = 0; if (b) b.currentTime = 0;
    a.play(); b?.play(); setPlaying(true);
  }

  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col gap-4 w-full animate-pop">

      {/* Album art area */}
      <div className="card overflow-hidden relative" style={{background:"linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)"}}>
        <div className="py-12 flex flex-col items-center gap-4">
          {/* Animated music visual */}
          <div className="relative flex items-end justify-center gap-1 h-16">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i}
                className={`w-2.5 rounded-full bg-white/80 transition-all`}
                style={{
                  height: playing ? `${20 + Math.sin(Date.now()/200 + i)*20}%` : "20%",
                  animation: playing ? `bar-dance ${0.4 + i*0.1}s ease-in-out infinite alternate` : "none",
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
          <Music2 size={48} color="white" strokeWidth={1.5} className={playing ? "animate-pulse" : ""}/>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
          <div className="h-full bg-white/80 transition-all duration-300 rounded-full"
            style={{width:`${progress * 100}%`}}/>
        </div>
      </div>

      {/* Controls */}
      <div className="card px-6 py-5 flex items-center justify-between">
        <button onClick={restart}
          className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 hover:bg-purple-200 active:scale-95 transition-all">
          <RotateCcw size={22} strokeWidth={2}/>
        </button>

        <button onClick={toggle}
          className="w-20 h-20 rounded-full shimmer-btn flex items-center justify-center shadow-xl active:scale-95 transition-all">
          {playing
            ? <Pause size={34} color="white" strokeWidth={2}/>
            : <Play  size={34} color="white" strokeWidth={2} fill="white"/>}
        </button>

        <div className="text-purple-400 font-bold text-sm w-12 text-center">
          {mins}:{secs}
        </div>
      </div>

      {/* Lyrics */}
      {lyrics && (
        <div className="card px-6 py-4 border-2 border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-purple-400" strokeWidth={2}/>
            <p className="text-purple-400 font-bold text-sm">מילות השיר</p>
          </div>
          <p className="text-purple-700 font-bold leading-loose text-right whitespace-pre-line">{lyrics}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Clone voice button */}
        <button onClick={onCloneVoice}
          className={`card py-4 flex flex-col items-center gap-2 hover:shadow-lg active:scale-95 transition-all border-2 ${hasClonedVoice ? "border-green-200" : "border-purple-100"}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${hasClonedVoice ? "bg-green-100" : "bg-purple-100"}`}>
            <Mic size={20} className={hasClonedVoice ? "text-green-600" : "text-purple-600"} strokeWidth={2}/>
          </div>
          <span className={`text-xs font-black ${hasClonedVoice ? "text-green-600" : "text-purple-600"}`}>
            {hasClonedVoice ? "הקול שלי ✓" : "הקול שלי"}
          </span>
        </button>

        {/* New song */}
        <button onClick={onReset}
          className="card py-4 flex flex-col items-center gap-2 hover:shadow-lg active:scale-95 transition-all border-2 border-purple-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Music2 size={20} className="text-purple-600" strokeWidth={2}/>
          </div>
          <span className="text-xs font-black text-purple-600">שיר חדש</span>
        </button>
      </div>

      <audio ref={vocalsRef} src={audioUrl} preload="auto"/>
      {instrumentalUrl && <audio ref={instrumentalRef} src={instrumentalUrl} preload="auto" loop/>}
    </div>
  );
}
