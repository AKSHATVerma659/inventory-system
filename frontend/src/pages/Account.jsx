import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { User, Mail, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Account() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl"
      >
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Account
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your profile and account information
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-[#0b1224] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-5 mb-6">
            {/* AVATAR */}
            <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center
                            text-white text-xl font-semibold">
              {user?.name
                ?.split(" ")
                .map(n => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U"}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                {user?.name || "User"}
              </h2>
              <p className="text-sm text-slate-400">
                {user?.email || "—"}
              </p>
            </div>
          </div>

          {/* DETAILS */}
          <div className="space-y-4 text-sm">
            <InfoRow
              icon={<User size={16} />}
              label="Name"
              value={user?.name || "—"}
            />

            <InfoRow
              icon={<Mail size={16} />}
              label="Email"
              value={user?.email || "—"}
            />

            <InfoRow
              icon={<Shield size={16} />}
              label="Role"
              value={user?.role || "—"}
              badge
            />
          </div>

          {/* FUTURE ACTIONS (DISABLED FOR NOW) */}
          <div className="mt-8 pt-5 border-t border-white/10 flex gap-3">
            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm
                         bg-white/5 text-slate-400 cursor-not-allowed"
            >
              Edit Profile (Coming soon)
            </button>

            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm
                         bg-white/5 text-slate-400 cursor-not-allowed"
            >
              Change Password (Coming soon)
            </button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

/* ================= INFO ROW ================= */
function InfoRow({ icon, label, value, badge }) {
  return (
    <div className="flex items-center justify-between bg-[#071028] rounded-lg px-4 py-3">
      <div className="flex items-center gap-3 text-slate-400">
        {icon}
        <span>{label}</span>
      </div>

      {badge ? (
        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
          {value}
        </span>
      ) : (
        <span className="text-slate-200">{value}</span>
      )}
    </div>
  );
}
