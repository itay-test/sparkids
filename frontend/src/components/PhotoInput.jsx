import { useRef, useState } from "react";

export default function PhotoInput({ onPhoto }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); onPhoto(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function clear() { setPreview(null); onPhoto(null); inputRef.current.value = ""; }

  return (
    <div className="w-full">
      {!preview ? (
        <label className="cursor-pointer block">
          <div className="card border-2 border-dashed border-purple-200 p-8 text-center hover:border-purple-400 transition-all">
            <div className="text-5xl mb-3">📸</div>
            <p className="font-black text-purple-700 text-lg">צלמי או בחרי תמונה</p>
            <p className="text-gray-400 text-sm mt-1">לחצי כאן</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        </label>
      ) : (
        <div className="card overflow-hidden relative">
          <img src={preview} alt="תמונה" className="w-full rounded-2xl" />
          <button onClick={clear}
            className="absolute top-3 left-3 bg-white shadow-md text-red-500 rounded-full w-9 h-9 font-bold text-lg flex items-center justify-center">
            ✕
          </button>
          <div className="p-3 text-center">
            <p className="text-purple-600 font-bold">✓ תמונה נבחרה — עכשיו דברי!</p>
          </div>
        </div>
      )}
    </div>
  );
}
