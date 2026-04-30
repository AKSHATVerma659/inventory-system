import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import SalesChart from "../components/SalesChart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from "recharts";

/* ================= UTIL ================= */
async function downloadFile(url, filename) {
  try {
    const response = await api.get(url, { responseType: "blob" });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("Download failed", err);
    alert("Failed to download file.");
  }
}

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [combined, setCombined] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  /* ================= DATA LOAD ================= */
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [salesRes, combinedRes, productsRes] = await Promise.all([
        api.get("/reports/sales"),
        api.get("/reports/combined"),
        api.get("/products")
      ]);

      setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      setCombined(Array.isArray(combinedRes.data) ? combinedRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PRODUCT LOOKUP (COGS) ================= */
  const productObjMap = useMemo(() => {
    const map = {};
    products.forEach(p => (map[p.id] = p));
    return map;
  }, [products]);

  /* ================= QUERY-BASED SCROLL ================= */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (!section) return;

    const targetId = `${section}-report`;
    requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.search]);

  /* ================= SALES METRICS ================= */
  const revenue = useMemo(
    () => sales.reduce((sum, s) => sum + Number(s.total || 0), 0),
    [sales]
  );

  const { cogsAvg, cogsHasItemData } = useMemo(() => {
    let sum = 0;
    let hasItem = false;

    for (const s of sales) {
      if (s.product_id != null && s.quantity != null) {
        const prod = productObjMap[s.product_id];
        const cost = prod ? Number(prod.cost_price || 0) : 0;
        sum += Number(s.quantity || 0) * cost;
        hasItem = true;
      }
    }

    return { cogsAvg: sum, cogsHasItemData: hasItem };
  }, [sales, productObjMap]);

  const grossProfit = revenue - (cogsAvg || 0);

  return (
    <DashboardLayout>
      {/* ================= PAGE HEADER ================= */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Reports & Compliance
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Analytics, GST exports, and operational summaries
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading reports…</p>
      ) : (
        <div className="space-y-12">

          {/* ================= GST REPORTS ================= */}
          <section
            id="gst-report"
            className="bg-[#0b1224] border border-white/10 p-5 rounded-xl"
          >
            <h2 className="text-lg font-semibold text-white">GST Reports</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Statutory GST exports (DB-backed)
            </p>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() =>
                  downloadFile("/reports/gstr1", "gstr1_report.csv")
                }
                className="px-4 py-2 text-sm rounded-lg
                           border border-indigo-500/40 text-indigo-400
                           hover:bg-indigo-500/10 transition"
              >
                Download GSTR-1
              </button>

              <button
                onClick={() =>
                  downloadFile("/reports/hsn", "hsn_summary.csv")
                }
                className="px-4 py-2 text-sm rounded-lg
                           border border-emerald-500/40 text-emerald-400
                           hover:bg-emerald-500/10 transition"
              >
                Download HSN Summary
              </button>
            </div>
          </section>

          {/* ================= SALES REPORT ================= */}
          <section
            id="sales-report"
            className="bg-[#0b1224] border border-white/10 p-5 rounded-xl"
          >
            <h2 className="text-lg font-semibold text-white mb-1">
              Sales Report
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
              <Metric label="Revenue" value={revenue} />
              <Metric label="COGS (AVG)" value={cogsAvg} />
              <Metric
                label="Gross Profit"
                value={grossProfit}
                danger={grossProfit < 0}
              />
            </div>

            {!cogsHasItemData && (
              <p className="text-xs text-slate-500 mb-3">
                COGS requires item-level sales data
              </p>
            )}

            <div className="rounded-lg bg-[#071028] p-3">
              <SalesChart data={sales} />
            </div>
          </section>

          {/* ================= SALES VS PURCHASES ================= */}
          <section
            id="comparison-report"
            className="bg-[#0b1224] border border-white/10 p-5 rounded-xl"
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Sales vs Purchases
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

        </div>
      )}
    </DashboardLayout>
  );
}

/* ================= METRIC ================= */
function Metric({ label, value, danger }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p
        className={`font-semibold ${
          danger ? "text-red-500" : "text-white"
        }`}
      >
        ₹ {Number(value || 0).toLocaleString()}
      </p>
    </div>
  );
}
