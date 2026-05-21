import { useRef, useState } from "react";
import { Mic, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const KID = "Carmel";
const MIN_SECONDS = 15;

export default function VoiceClone({ onCloned, onClose }) {
  const [step, setStep]       = useState("intro"); // intro|recording|uploading|done|error
  const [seconds, setSeconds] = useState(0);
  const [error, setError]     = useState("");
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.start(100);
      recorderRef.current = rec;
      setStep("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setError("לא הצלחתי לגשת למיקרופון");
    }
  }

  async function stopAndUpload() {
    clearInterval(timerRef.current);
    const rec = recorderRef.current;
    if (!rec) return;

    rec.stop();
    rec.stream.getTracks().forEach(t => t.stop());

    setStep("uploading");

    await new Promise(r => setTimeout(r, 300)); // wait for final chunk
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const arrayBuf = await blob.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));

    try {
      await axios.post(`${API}/voice/clone`, { audio_b64: b64, kid_name: KID });
      setStep("done");
      onCloned?.();
    } catch (e) {
      setError(e.response?.data?.detail || "שגיאה בשמירת הקול");
      setStep("error");
    }
  }

  async function deleteVoice() {
    await axios.delete(`${API}/voice/reset/${KID}`);
    onClose?.();
  }

  const barColor = seconds >= MIN_SECONDS ? "bg-green-400" : "bg-purple-400";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="card w-full max-w-sm p-8 flex flex-col items-center gap-5 animate-pop">

        {step === "intro" && <>
          <div className="w-20 h-20 shimmer-btn rounded-full flex items-center justify-center">
            <Mic size={40} color="white" strokeWidth={1.5}/>
          </div>
          <p className="text-2xl font-black text-purple-800 text-center">נצלום את הקול שלך!</p>
          <p className="text-purple-400 font-bold text-center text-sm leading-relaxed">
            דברי בקול רם כ־30 שניות<br/>
            למשל: ספרי על הצבע האהוב עלייך,<br/>
            ספרי על חיית המחמד שלך...
          </p>
          <button onClick={startRecording}
            className="w-full py-4 shimmer-btn text-white font-black text-xl rounded-2xl active:scale-95 transition-all">
            בואי נתחיל!
          </button>
          <button onClick={onClose} className="text-gray-300 font-bold text-sm">ביטול</button>
        </>}

        {step === "recording" && <>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mic-ring-active transition-all ${seconds >= MIN_SECONDS ? "bg-green-500" : "bg-red-500"}`}>
            <Mic size={44} color="white" strokeWidth={1.5}/>
          </div>
          <p className="text-5xl font-black text-purple-800">{seconds}s</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
              style={{ width: `${Math.min(100, (seconds / 30) * 100)}%` }}/>
          </div>

          <p className="text-purple-500 font-bold text-center">
            {seconds < MIN_SECONDS
              ? `המשיכי לדבר... עוד ${MIN_SECONDS - seconds} שניות`
              : "מעולה! אפשר לסיים ✓"}
          </p>

          <button onClick={stopAndUpload} disabled={seconds < MIN_SECONDS}
            className={`w-full py-4 font-black text-xl rounded-2xl transition-all active:scale-95 ${
              seconds >= MIN_SECONDS
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            סיימתי!
          </button>
        </>}

        {step === "uploading" && <>
          <Loader2 size={56} className="text-purple-500 animate-spin"/>
          <p className="text-2xl font-black text-purple-800">שומרת את הקול...</p>
          <p className="text-purple-400 font-bold text-sm">זה לוקח כ־15 שניות</p>
        </>}

        {step === "done" && <>
          <CheckCircle2 size={72} className="text-green-500"/>
          <p className="text-2xl font-black text-purple-800 text-center">הקול שלך נשמר!</p>
          <p className="text-purple-400 font-bold text-center text-sm">כל השירים הבאים יושרו<br/>בקולך</p>
          <button onClick={onClose}
            className="w-full py-4 shimmer-btn text-white font-black text-xl rounded-2xl active:scale-95">
            סבבה!
          </button>
          <button onClick={deleteVoice}
            className="flex items-center gap-2 text-gray-300 hover:text-red-400 font-bold text-sm transition-all">
            <Trash2 size={14}/> מחקי את הקול
          </button>
        </>}

        {step === "error" && <>
          <p className="text-4xl">😕</p>
          <p className="text-xl font-black text-red-500 text-center">{error}</p>
          <button onClick={() => setStep("intro")}
            className="w-full py-4 shimmer-btn text-white font-black text-xl rounded-2xl">
            נסי שוב
          </button>
        </>}

      </div>
    </div>
  );
}
