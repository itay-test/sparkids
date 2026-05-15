import { useRef, useState } from "react";

export default function PhotoInput({ onPhoto }) {
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);
  const [preview, setPreview] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); onPhoto(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function clear() {
    setPreview(null); onPhoto(null);
    if (cameraRef.current)  cameraRef.current.value  = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  if (preview) return (
    <div className="card overflow-hidden relative animate-pop">
      <img src={preview} alt="תמונה" className="w-full" />
      <button onClick={clear}
        className="absolute top-3 left-3 w-9 h-9 bg-white/90 shadow rounded-full flex items-center justify-center text-red-400 font-bold text-lg">
        ✕
      </button>
      <p className="text-center text-purple-600 font-bold py-3">✓ עכשיו דברי!</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4 animate-pop">
      {/* Camera — mobile opens camera, desktop opens file picker */}
      <label className="cursor-pointer">
        <div className="card p-8 flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95 select-none">
          <span className="text-5xl">📷</span>
          <span className="text-purple-700 font-black">צלמי</span>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFile}
          className="hidden"
        />
      </label>

      {/* Gallery — always opens file picker, no capture */}
      <label className="cursor-pointer">
        <div className="card p-8 flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95 select-none">
          <span className="text-5xl">🖼️</span>
          <span className="text-purple-700 font-black">גלריה</span>
        </div>
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </label>
    </div>
  );
}
