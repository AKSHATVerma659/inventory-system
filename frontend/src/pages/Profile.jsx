import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020617]">
      
      {/* Home-style diagonal gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-[#020617] to-[#020617]" />

      {/* Top-left glow (same visual gravity as Home hero) */}
      <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-indigo-600/20 rounded-full blur-[160px]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 text-center"
      >
        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-12">
          Who’s using <span className="text-indigo-400">Inventory ERP</span>?
        </h1>

        {/* Profile Avatar */}
        <div
          onClick={() => navigate("/dashboard")}
          className="group cursor-pointer flex flex-col items-center"
        >
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl font-bold text-white shadow-[0_25px_80px_rgba(99,102,241,0.45)] group-hover:scale-110 transition-all duration-300">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>

          <p className="mt-5 text-xl text-slate-200 group-hover:text-white transition">
            {user?.name || "Admin"}
          </p>

          <p className="text-sm text-slate-400">
            {user?.email}
          </p>
        </div>

        {/* Helper Text */}
        <p className="mt-14 text-xs text-slate-500 tracking-wide">
          Click your profile to continue
        </p>
      </motion.div>
    </div>
  );
}
