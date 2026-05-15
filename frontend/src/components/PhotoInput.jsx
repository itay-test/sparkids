import { useRef, useState } from "react";

export default function PhotoInput({ onPhoto }) {
  const cameraRef = useRef(null);
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
    setPreview(null);
    onPhoto(null);
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
    <div className="grid grid-cols-2 gap-3">
      {/* Camera */}
      <label className="cursor-pointer">
        <div className="card p-6 flex flex-col items-center gap-2 hover:shadow-lg transition-all active:scale-95">
          <span className="text-4xl">📷</span>
          <span className="text-purple-600 font-bold text-sm">צלמי</span>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          onChange={handleFile} className="hidden" />
      </label>

      {/* Gallery */}
      <label className="cursor-pointer">
        <div className="card p-6 flex flex-col items-center gap-2 hover:shadow-lg transition-all active:scale-95">
          <span className="text-4xl">🖼️</span>
          <span className="text-purple-600 font-bold text-sm">גלריה</span>
        </div>
        <input ref={galleryRef} type="file" accept="image/*"
          onChange={handleFile} className="hidden" />
      </label>
    </div>
  );
}
