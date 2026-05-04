import { useEffect, useState, useMemo } from "react";
import {
  ShoppingCart,
  Download,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Boxes
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import SalesChart from "../components/SalesChart";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "../utils/exportCSV";

/* ================= ANIMATION VARIANTS ================= */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

/* ================= UTIL ================= */
function normalizeLastNDays(data, days = 30) {
  const map = new Map(data.map(d => [d.date, Number(d.total)]));
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);

    result.push({
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      total: map.get(key) || 0
    });
  }
  return result;
}

function sumByDateRange(rows, field, fromDaysAgo, toDaysAgo) {
  const now = new Date();
  return rows.reduce((sum, r) => {
    const d = new Date(r.created_at || r.date);
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    if (diffDays >= fromDaysAgo && diffDays < toDaysAgo) {
      return sum + Number(r[field] || 0);
    }
    return sum;
  }, 0);
}

export default function Dashboard() {
  const [salesRaw, setSalesRaw] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sendingSummary, setSendingSummary] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadSales();
    loadPurchases();
    loadInventory();

    const interval = setInterval(() => {
      loadSales();
      loadPurchases();
      loadInventory();
    },5000); // every 5 seconds
    return () => clearInterval(interval);    
  }, []);

  const loadSales = async () => {
    try {
      const { data } = await api.get("/reports/sales");
      setSalesRaw(data);
      setSalesChartData(normalizeLastNDays(data, 30));
    } catch (err) {
      console.error("Failed to load sales", err);
    }
  };

  const loadPurchases = async () => {
    try {
      const { data } = await api.get("/purchases");
      setPurchases(data);
    } catch (err) {
      console.error("Failed to load purchases", err);
    }
  };

  const loadInventory = async () => {
    try {
      const { data } = await api.get("/inventory");
      setInventory(data);
      setLowStockItems(
        data.filter(i => Number(i.quantity) <= Number(i.min_quantity))
      );
    } catch (err) {
      console.error("Failed to load inventory", err);
    }
  };

  /* ===== KPIs ===== */
  const totalSales = useMemo(
    () => salesRaw.reduce((a, b) => a + Number(b.total || 0), 0),
    [salesRaw]
  );

  const totalPurchases = useMemo(
    () => purchases.reduce((a, b) => a + Number(b.total_amount || 0), 0),
    [purchases]
  );

  const inventoryValue = useMemo(
    () =>
      inventory.reduce(
        (sum, i) => sum + Number(i.quantity || 0) * Number(i.cost_price || 0),
        0
      ),
    [inventory]
  );

  /* ===== PROFIT / LOSS ===== */
  const profitRaw = useMemo(
    () => totalSales - totalPurchases,
    [totalSales, totalPurchases]
  );

  const isLoss = profitRaw < 0;
  const profitDisplayValue = Math.abs(profitRaw);

  /* ===== PROFIT TREND ===== */
  const profitTrend = useMemo(() => {
    const salesLast7 = sumByDateRange(salesRaw, "total", 0, 7);
    const salesPrev7 = sumByDateRange(salesRaw, "total", 7, 14);

    const purchasesLast7 = sumByDateRange(purchases, "total_amount", 0, 7);
    const purchasesPrev7 = sumByDateRange(purchases, "total_amount", 7, 14);

    return (salesLast7 - purchasesLast7) - (salesPrev7 - purchasesPrev7);
  }, [salesRaw, purchases]);

  const salesTrend =
    salesRaw.slice(-7).reduce((a, b) => a + Number(b.total || 0), 0) -
    salesRaw.slice(-14, -7).reduce((a, b) => a + Number(b.total || 0), 0);

  /* ===== SEND STOCK SUMMARY (WHATSAPP) ===== */
  const sendStockSummary = async () => {
    if (sendingSummary) return;
    if (!confirm("Send current low-stock summary via WhatsApp to admin?")) return;

    setSendingSummary(true);
    try {
      const { data } = await api.post("/notifications/stock-summary");
      // expect { success: true, message: '...' }
      if (data?.success) {
        alert("Stock summary sent successfully via WhatsApp.");
      } else {
        alert("Failed to send stock summary: " + (data?.error || data?.message || "Unknown"));
      }
    } catch (err) {
      console.error("Send stock summary failed", err);
      alert("Failed to send stock summary: " + (err.response?.data?.error || err.message));
    } finally {
      setSendingSummary(false);
    }
  };

  return (
    <DashboardLayout>
      {/* ================= HERO ================= */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-2xl px-7 py-5 mb-8 shadow-lg flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">
            Welcome back, {user?.name || "Admin"} 👋
          </h1>
          <p className="text-sm text-indigo-100 mt-1">
            Real-time snapshot of inventory, sales, and stock health
          </p>
        </div>

        {/* ========== WhatsApp Summary Button ========== */}
        <div className="flex items-center gap-3">
          <button
            onClick={sendStockSummary}
            disabled={sendingSummary}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 disabled:opacity-50 transition text-sm"
            title="Send low-stock summary to admin on WhatsApp"
          >
            {sendingSummary ? "Sending…" : "Send Stock Summary (WhatsApp)"}
          </button>
        </div>
      </motion.div>

      {/* ================= KPI GRID ================= */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8"
      >
        <motion.div variants={fadeUp}>
          <KpiCard
            title="Total Sales"
            value={`₹ ${totalSales.toLocaleString()}`}
            icon={<ShoppingCart size={18} />}
            trend={salesTrend}
            onClick={() => navigate("/sales")}
            onExport={() =>
              exportToCSV("sales_last_30_days.csv", salesChartData)
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <KpiCard
            title="Total Purchases"
            value={`₹ ${totalPurchases.toLocaleString()}`}
            icon={<Download size={18} />}
            onClick={() => navigate("/purchases")}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <KpiCard
            title="Inventory Value"
            value={`₹ ${inventoryValue.toLocaleString()}`}
            icon={<Boxes size={18} />}
            tooltip="Total stock value at cost price"
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <KpiCard
            title="Low Stock Items"
            value={lowStockItems.length}
            icon={<AlertTriangle size={18} />}
            onClick={() => navigate("/inventory")}
            onExport={() =>
              exportToCSV("low_stock_items.csv", lowStockItems)
            }
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <KpiCard
            title={isLoss ? "Loss" : "Profit"}
            value={`₹ ${profitDisplayValue.toLocaleString()}`}
            trend={profitTrend}
            icon={<TrendingUp size={18} />}
            tooltip="Net result = Total Sales − Total Purchases"
            subText={`Sales ₹ ${totalSales.toLocaleString()} − Purchases ₹ ${totalPurchases.toLocaleString()}`}
          />
        </motion.div>
      </motion.div>

      {/* ================= MAIN CONTENT ================= */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        <motion.div
          variants={fadeUp}
          className="xl:col-span-2 bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Sales Overview
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Revenue trend (last 30 days)
          </p>
          <SalesChart data={salesChartData} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <LowStockTable items={lowStockItems} />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

/* ================= KPI CARD ================= */
function KpiCard({
  title,
  value,
  icon,
  trend,
  onClick,
  onExport,
  tooltip,
  subText
}) {
  const positive = trend > 0;

  return (
    <div
      title={tooltip}
      onClick={onClick}
      className={`h-[110px] bg-white dark:bg-[#0f172a] rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-800
      ${onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-[2px]" : ""} transition-all`}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/15 text-indigo-500 flex items-center justify-center">
            {icon}
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {value}
            </p>

            {subText && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {subText}
              </p>
            )}

            {trend !== undefined && (
              <div
                className={`flex items-center text-[11px] mt-0.5 ${
                  positive ? "text-green-500" : "text-red-500"
                }`}
              >
                {positive ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}
                {Math.abs(trend).toLocaleString()} vs prev period
              </div>
            )}
          </div>
        </div>

        {onExport && (
          <button
            onClick={e => {
              e.stopPropagation();
              onExport();
            }}
            className="inline-flex items-center justify-center text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            <Download size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

import AnimatedTable from "../components/AnimatedTable";

function LowStockTable({ items }) {
  const columns = [
    { key: "product", label: "Product", bold: true },
    { key: "quantity", label: "Qty", align: "center" },
    { key: "min_quantity", label: "Min", align: "center" },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: () => (
        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[10px] font-semibold">
          LOW
        </span>
      )
    }
  ];

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <h2 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Low Stock Products
      </h2>

      <AnimatedTable
        columns={columns}
        data={items}
        emptyText="No low stock items 🎉"
      />
    </div>
  );
}
