import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, UserPlus } from "lucide-react";
import api from "../services/api";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* background glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 bg-indigo-600/30 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-96 w-96 bg-cyan-500/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        {/* card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-xl">
          {/* header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center mb-3">
              <UserPlus size={20} />
            </div>
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-sm text-gray-400">
              Inventory & Asset Management ERP
            </p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded">
              {error}
            </div>
          )}

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                name="name"
                required
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="password"
                name="password"
                required
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl font-medium
                         bg-gradient-to-r from-indigo-500 to-cyan-500
                         hover:opacity-90 hover:scale-[1.02] transition
                         disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          {/* footer */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
