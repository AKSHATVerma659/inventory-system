import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const search = async value => {
    setQ(value);
    if (value.length < 2) return setResults([]);

    const { data } = await api.get(`/search?q=${value}`);
    setResults(data || []);
  };

  return (
    <div className="relative w-80">
      <input
        value={q}
        onChange={e => search(e.target.value)}
        placeholder="Search product, SKU, invoice…"
        className="w-full border rounded px-3 py-2 text-sm"
      />

      {results.length > 0 && (
        <div className="absolute z-50 bg-white shadow rounded w-full mt-1">
          {results.map(r => (
            <div
              key={r.id}
              onClick={() => navigate(r.url)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
