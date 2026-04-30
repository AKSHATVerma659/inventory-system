import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  BarChart3,
  Upload,
  ShieldCheck,
  Layers,
  TrendingUp
} from "lucide-react";

/* ===== MOTION VARIANTS ===== */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 }
  }
};

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* ===== BACKGROUND GLOWS ===== */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />

      {/* ===== NAVBAR ===== */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center justify-between px-8 py-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow">
            <Layers size={18} />
          </div>
          <span className="text-lg font-semibold tracking-wide">
            Inventory ERP
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
      </motion.header>

      {/* ===== HERO ===== */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 flex flex-col items-center text-center px-6 pt-24"
      >
        <motion.h1
          variants={fadeUp}
          className="text-4xl md:text-5xl font-bold max-w-4xl leading-tight"
        >
          Inventory & Asset Management System
          <span className="block mt-2 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Built for Real Businesses, Not Demos
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-2xl text-gray-300 text-lg"
        >
          Manage products, inventory, sales, purchases, and reports with
          honest data, real workflows, and ERP-grade architecture.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/signup"
            className="px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-lg hover:shadow-xl hover:scale-[1.03] transition"
          >
            Start Demo
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-xl font-medium border border-white/20 hover:bg-white/10 transition"
          >
            Admin Login
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400"
        >
          <span>✔ Real-time Inventory</span>
          <span>✔ CSV Imports</span>
          <span>✔ Role-based Access</span>
          <span>✔ Reports & Analytics</span>
        </motion.div>
      </motion.main>

      {/* ===== FEATURES ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25 }}
        variants={stagger}
        className="relative z-10 mt-28 px-8 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className="group bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10
                       hover:border-white/20 hover:-translate-y-1 transition-all"
          >
            <div className="h-11 w-11 flex items-center justify-center rounded-lg
                            bg-gradient-to-br from-indigo-500 to-cyan-500 mb-4">
              <f.icon size={20} />
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* ===== HOW IT WORKS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25 }}
        variants={stagger}
        className="relative z-10 mt-32 px-8 max-w-5xl mx-auto text-center"
      >
        <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-12">
          How It Works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <Step step="01" title="Login / Signup" desc="Secure access with JWT authentication and role-based control." />
          <Step step="02" title="Manage Operations" desc="Handle products, inventory, sales, purchases, and imports." />
          <Step step="03" title="Analyze & Report" desc="View sales trends, stock status, and export reports." />
        </div>
      </motion.section>

      {/* ===== FINAL CTA ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25 }}
        variants={fadeUp}
        className="relative z-10 mt-32 px-8 max-w-4xl mx-auto text-center"
      >
        <div className="bg-gradient-to-r from-indigo-600/20 to-cyan-600/20
                        border border-white/10 rounded-2xl p-10 backdrop-blur">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Use a Real ERP?
          </h2>
          <p className="text-gray-300 mb-8">
            No fake dashboards. No toy logic. Just clean architecture and
            real workflows.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 font-medium shadow hover:scale-[1.03] transition"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition"
            >
              Login
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 mt-32 pb-10 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Inventory & Asset Management ERP
      </footer>
    </div>
  );
}

/* ===== SUB COMPONENTS ===== */

function Step({ step, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white/5 border border-white/10 rounded-xl p-6"
    >
      <div className="text-indigo-400 font-bold mb-2">{step}</div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-400">{desc}</p>
    </motion.div>
  );
}

const features = [
  {
    title: "Inventory Management",
    desc: "Track stock levels, warehouses, low stock alerts, and movements.",
    icon: Package
  },
  {
    title: "Sales & Purchases",
    desc: "Manage invoices, confirmations, and transaction lifecycles.",
    icon: TrendingUp
  },
  {
    title: "Import Jobs (CSV)",
    desc: "Bulk upload inventory and products with job tracking.",
    icon: Upload
  },
  {
    title: "Reports & Charts",
    desc: "Sales trends, inventory status, and comparisons.",
    icon: BarChart3
  },
  {
    title: "Inventory Batches",
    desc: "FIFO-ready batch tracking for accurate stock valuation.",
    icon: Layers
  },
  {
    title: "Secure Access",
    desc: "JWT authentication with admin and user roles.",
    icon: ShieldCheck
  }
];
