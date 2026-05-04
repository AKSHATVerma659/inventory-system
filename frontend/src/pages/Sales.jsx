import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const res = await api.get("/sales");
    setSales(res.data || []);
  };

  /* ================= STOCK CONFIRM ================= */
  const confirmStock = async (saleId) => {
    if (!window.confirm("Confirm sale? This will deduct inventory.")) return;

    try {
      setProcessingId(saleId);
      await api.post(`/sales/${saleId}/confirm`);
      await fetchSales();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to confirm sale");
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= PAYMENT SETTLEMENT ================= */
  const settlePayment = async (sale) => {
    const total = Number(sale.total_amount || 0);
    const paid = Number(sale.paid_amount || 0);
    const remaining = total - paid;

    if (remaining <= 0) return;

    if (
      !window.confirm(
        `Settle remaining payment of ₹ ${remaining.toLocaleString()} ?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(sale.id);
      await api.post("/payments", {
        reference_type: "SALE",
        reference_id: sale.id,
        amount: remaining,
        payment_method: "AUTO_SETTLE"
      });
      await fetchSales();
    } catch (err) {
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= INVOICE DOWNLOAD (FIXED) ================= */
  const downloadInvoice = async (saleId) => {
    try {
      const res = await api.get(
        `/sales/${saleId}/invoice/pdf`,
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");

      // optional cleanup
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err) {
      alert("Failed to download invoice PDF");
      console.error(err);
    }
  };

  const paymentBadge = (status) => {
    const base =
      "inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold";
    if (status === "PAID")
      return `${base} bg-emerald-500/15 text-emerald-400`;
    if (status === "PARTIAL")
      return `${base} bg-amber-500/15 text-amber-400`;
    return `${base} bg-red-500/15 text-red-400`;
  };

  const lifecycleBadge = (status) => {
    const base =
      "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium";
    if (status === "CONFIRMED")
      return `${base} bg-indigo-500/15 text-indigo-400`;
    return `${base} bg-white/10 text-slate-300`;
  };

  return (
    <DashboardLayout>
      {/* ================= PAGE HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Sales
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Sales invoices, stock confirmation, payments, and GST invoices
        </p>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-[#0b1224] border border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#0f172a] border-b border-white/10">
              <tr className="text-slate-400 text-left">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((s) => {
                const total = Number(s.total_amount || 0);
                const paid = Number(s.paid_amount || 0);
                const remaining = Math.max(total - paid, 0);

                return (
                  <tr
                    key={s.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {s.invoice_no || `#${s.id}`}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {s.customer || "Walk-in"}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-300">
                      ₹ {total.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 space-y-1">
                      <span className={paymentBadge(s.status)}>
                        {s.status}
                      </span>
                      <div>
                        <span className={lifecycleBadge(s.lifecycle_status)}>
                          Stock: {s.lifecycle_status}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-center space-y-1">
                      {s.lifecycle_status === "DRAFT" && (
                        <button
                          disabled={processingId === s.id}
                          onClick={() => confirmStock(s.id)}
                          className="block w-full px-3 py-1.5 text-[11px] font-medium
                                     border border-indigo-500/40 text-indigo-400
                                     rounded-lg hover:bg-indigo-500/10
                                     disabled:opacity-50 transition"
                        >
                          Confirm Stock
                        </button>
                      )}

                      {s.lifecycle_status === "CONFIRMED" &&
                        s.status !== "PAID" && (
                          <button
                            disabled={processingId === s.id}
                            onClick={() => settlePayment(s)}
                            className="block w-full px-3 py-1.5 text-[11px] font-medium
                                       border border-emerald-500/40 text-emerald-400
                                       rounded-lg hover:bg-emerald-500/10
                                       disabled:opacity-50 transition"
                          >
                            Settle ₹ {remaining.toLocaleString()}
                          </button>
                        )}

                      {s.lifecycle_status === "CONFIRMED" && (
                        <button
                          onClick={() => downloadInvoice(s.id)}
                          className="block w-full px-3 py-1.5 text-[11px] font-medium
                                     border border-sky-500/40 text-sky-400
                                     rounded-lg hover:bg-sky-500/10 transition"
                        >
                          Download Invoice
                        </button>
                      )}

                      {s.lifecycle_status === "CONFIRMED" &&
                        s.status === "PAID" && (
                          <span className="text-[11px] text-slate-500">
                            Closed
                          </span>
                        )}
                    </td>
                  </tr>
                );
              })}

              {sales.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
