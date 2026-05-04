import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("admin"); // visual only

  /* ✅ IF ALREADY LOGGED IN → GO PROFILE FIRST */
  useEffect(() => {
    if (user) {
      navigate("/account/profile", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      login(res.data.token, res.data.user);

      // ✅ LOGIN → PROFILE (NOT DASHBOARD)
      navigate("/account/profile", { replace: true });
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 bg-indigo-600/30 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-96 w-96 bg-cyan-500/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-2xl font-bold">Secure Login</h2>
            <p className="text-sm text-gray-400">
              Inventory & Asset Management ERP
            </p>
          </div>

          {/* role toggle */}
          <div className="flex gap-2 justify-center mb-6">
            {["admin", "user"].map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${
                  role === r
                    ? "bg-gradient-to-r from-indigo-500 to-cyan-500"
                    : "bg-white/10 text-gray-300"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-400 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl font-medium
                         bg-gradient-to-r from-indigo-500 to-cyan-500
                         hover:opacity-90 hover:scale-[1.02] transition"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-cyan-400 hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
