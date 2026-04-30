import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  ShoppingCart,
  Receipt,
  BarChart3,
  Search,
  ChevronRight,
  ChevronLeft,
  User,
  LogOut,
  Sun,
  Moon
} from "lucide-react";

/* ================= ANIMATIONS ================= */
const sidebarAnim = {
  hidden: { x: -16, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

const topbarAnim = {
  hidden: { y: -12, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const avatarMenuAnim = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 }
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  /* ================= SIDEBAR ================= */
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  const [openMenu, setOpenMenu] = useState({
    products: false,
    inventory: true,
    sales: false,
    purchases: false,
    reports: true
  });

  const toggle = key =>
    setOpenMenu(prev => ({ ...prev, [key]: !prev[key] }));

  /* ================= SEARCH ================= */
  const [query, setQuery] = useState("");

  const handleSearch = e => {
    e.preventDefault();
    const q = query.toLowerCase();
    if (!q) return;

    if (q.includes("sale")) navigate("/sales");
    else if (q.includes("purchase")) navigate("/purchases");
    else if (q.includes("inventory")) navigate("/inventory");
    else if (q.includes("product")) navigate("/products");
    else if (q.includes("gst")) navigate("/reports?section=gst");
    else if (q.includes("report")) navigate("/reports?section=sales");

    setQuery("");
  };

  /* ================= REPORT ACTIVE ================= */
  const activeReport = new URLSearchParams(location.search).get("section");

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
     ${
       isActive
         ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow"
         : "text-gray-400 hover:bg-white/10 hover:text-white"
     }`;

  const reportLinkClass = key =>
    `flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition
     ${
       activeReport === key
         ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow"
         : "text-gray-400 hover:bg-white/10 hover:text-white"
     }`;

  /* ================= AVATAR ================= */
  const [openAvatar, setOpenAvatar] = useState(false);
  const avatarRef = useRef(null);

  useEffect(() => {
    const close = e => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setOpenAvatar(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-app text-app">
      {/* ================= SIDEBAR ================= */}
      <motion.aside
        variants={sidebarAnim}
        initial="hidden"
        animate="visible"
        className={`fixed inset-y-0 left-0 z-40 ${
          collapsed ? "w-20" : "w-72"
        } bg-gradient-to-b from-[var(--panel)] to-[var(--panel-2)] flex flex-col`}
      >
        {/* BRAND */}
        <div className="px-4 py-5 border-b border-app flex justify-between items-center">
          {!collapsed && (
            <div>
              <h1 className="font-bold">
                Inventory <span className="text-blue-400">ERP</span>
              </h1>
              <p className="text-xs text-muted">Asset & Stock Management</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto no-scrollbar">
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard size={16} />
            {!collapsed && "Dashboard"}
          </NavLink>

          <SidebarSection
            title="Products"
            icon={<Boxes size={16} />}
            collapsed={collapsed}
            open={openMenu.products}
            onToggle={() => toggle("products")}
            basePath="/products"
          >
            <NavLink to="/products" className={linkClass}>
              Product List
            </NavLink>
          </SidebarSection>

          <SidebarSection
            title="Inventory"
            icon={<Warehouse size={16} />}
            collapsed={collapsed}
            open={openMenu.inventory}
            onToggle={() => toggle("inventory")}
            basePath="/inventory"
          >
            <NavLink to="/inventory" className={linkClass}>
              Inventory
            </NavLink>
            <NavLink to="/imports" className={linkClass}>
              Import Jobs
            </NavLink>
          </SidebarSection>

          <SidebarSection
            title="Sales"
            icon={<ShoppingCart size={16} />}
            collapsed={collapsed}
            open={openMenu.sales}
            onToggle={() => toggle("sales")}
            basePath="/sales"
          >
            <NavLink to="/sales" className={linkClass}>
              Sales Orders
            </NavLink>
          </SidebarSection>

          <SidebarSection
            title="Purchases"
            icon={<Receipt size={16} />}
            collapsed={collapsed}
            open={openMenu.purchases}
            onToggle={() => toggle("purchases")}
            basePath="/purchases"
          >
            <NavLink to="/purchases" className={linkClass}>
              Purchase Orders
            </NavLink>
          </SidebarSection>

          <SidebarSection
            title="Reports"
            icon={<BarChart3 size={16} />}
            collapsed={collapsed}
            open={openMenu.reports}
            onToggle={() => toggle("reports")}
            basePath="/reports?section=gst"
          >
            <NavLink to="/reports?section=gst" className={() => reportLinkClass("gst")}>
              GST
            </NavLink>
            <NavLink to="/reports?section=sales" className={() => reportLinkClass("sales")}>
              Sales
            </NavLink>
            <NavLink
              to="/reports?section=comparison"
              className={() => reportLinkClass("comparison")}
            >
              Sales vs Purchases
            </NavLink>
          </SidebarSection>
        </nav>

        <div className="p-4 border-t border-app">
          <button
            onClick={logout}
            className="w-full py-2 bg-red-500 rounded-xl"
          >
            {collapsed ? "⏻" : "Logout"}
          </button>
        </div>
      </motion.aside>

      {/* ================= MAIN ================= */}
      <div className={`transition-all ${collapsed ? "ml-20" : "ml-72"}`}>
        <motion.div
          variants={topbarAnim}
          initial="hidden"
          animate="visible"
          className="sticky top-0 z-30 backdrop-blur border-b border-app px-6 py-4 flex justify-between items-center"
        >
          <form onSubmit={handleSearch} className="flex gap-3 items-center">
            <Search size={16} className="text-muted" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search (Ctrl + K)"
              className="bg-transparent outline-none text-sm"
            />
          </form>

          <div className="flex items-center">
            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="mr-3 p-2 rounded-lg bg-panel border border-app hover:opacity-90"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* AVATAR */}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setOpenAvatar(v => !v)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center font-semibold text-sm text-white shadow"
              >
                {initials}
              </button>

              <AnimatePresence>
                {openAvatar && (
                  <motion.div
                    variants={avatarMenuAnim}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-3 w-64 rounded-xl bg-panel border border-app shadow-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-app">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                          {user.role}
                        </span>
                      )}
                    </div>

                    <div className="border-t border-app" />

                    <button
                      onClick={() => {
                        setOpenAvatar(false);
                        navigate("/account");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-app hover:bg-white/5"
                    >
                      <User size={14} />
                      Account
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}

/* ================= SIDEBAR SECTION ================= */
function SidebarSection({
  title,
  icon,
  collapsed,
  open,
  onToggle,
  basePath,
  children
}) {
  if (collapsed) {
    return (
      <NavLink
        to={basePath}
        className="flex items-center justify-center py-3 text-muted hover:text-app"
      >
        {icon}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 flex justify-between text-muted hover:text-app"
      >
        <span className="flex gap-3">
          {icon}
          {title}
        </span>
        <ChevronRight className={`transition ${open ? "rotate-90" : ""}`} />
      </button>

      {open && <div className="ml-4 space-y-1">{children}</div>}
    </div>
  );
}
