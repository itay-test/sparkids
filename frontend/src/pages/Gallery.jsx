import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8000";

export default function Gallery() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API}/share/${shareId}`).then((r) => setData(r.data));
  }, [shareId]);

  if (!data) return <div className="text-center mt-20 text-2xl text-purple-600">Loading... ✨</div>;
  if (data.error) return <div className="text-center mt-20 text-2xl text-red-500">Painting not found 😢</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-4xl font-bold text-purple-700">🌟 {data.kid_name}'s Painting!</h1>
      <img
        src={data.image_url}
        alt={data.prompt_used}
        className="rounded-3xl max-w-lg w-full shadow-2xl border-4 border-purple-300"
      />
      <p className="text-purple-500 text-lg italic">"{data.prompt_used}"</p>
      <a
        href="/"
        className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg rounded-2xl px-8 py-3 transition-all"
      >
        🎨 Make your own!
      </a>
    </div>
  );
}
