import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

import PaymentAmountModal from "../components/payments/PaymentAmountModal";
import PaymentHistoryDrawer from "../components/payments/PaymentHistoryDrawer";

import {
  CheckBadgeIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";

/**
 * Purchases page — compact action buttons (Heroicons only)
 */
export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Payment modal
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Payment history drawer
  const [historyPurchase, setHistoryPurchase] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await api.get("/purchases");
      setPurchases(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch purchases", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     CONFIRM & AUTO-CLOSE (ERP FLOW)
  ================================= */
  const confirmAndClosePurchase = async (purchase) => {
    const total = Number(purchase.total_amount || 0);
    const paid = Number(purchase.paid_amount || 0);
    const remaining = Math.max(total - paid, 0);

    if (
      !window.confirm(
        `Confirm purchase and settle ₹ ${remaining.toLocaleString()} ?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(purchase.id);

      await api.post(`/purchases/${purchase.id}/confirm`);

      if (remaining > 0) {
        await api.post("/payments", {
          reference_type: "PURCHASE",
          reference_id: purchase.id,
          amount: remaining,
          payment_method: "AUTO_CONFIRM"
        });
      }

      await fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to confirm purchase");
    } finally {
      setProcessingId(null);
    }
  };

  /* ================================
     MANUAL PAYMENT
  ================================= */
  const openPaymentModal = (purchase) => setSelectedPurchase(purchase);
  const closePaymentModal = () => setSelectedPurchase(null);

  const onPaymentSuccess = async () => {
    await fetchPurchases();
    closePaymentModal();
  };

  /* ================================
     PAYMENT HISTORY
  ================================= */
  const openHistoryDrawer = (purchase) => setHistoryPurchase(purchase);
  const closeHistoryDrawer = () => setHistoryPurchase(null);

  const paymentBadge = (status) => {
    const base =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold";
    if (status === "PAID")
      return `${base} bg-emerald-500/15 text-emerald-400`;
    if (status === "PARTIAL")
      return `${base} bg-amber-500/15 text-amber-400`;
    return `${base} bg-red-500/15 text-red-400`;
  };

  const IconButton = ({ title, onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="w-9 h-9 inline-flex items-center justify-center rounded-md
                 border border-white/10 hover:bg-white/5 transition
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Purchases</h1>
        <p className="text-sm text-slate-400">
          Supplier invoices, payments, and stock inflow
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading purchases…</div>
      ) : (
        <div className="bg-[#0b1224] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#0f172a] border-b border-white/10">
              <tr className="text-slate-400 text-left">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {purchases.map((p) => {
                const total = Number(p.total_amount || 0);
                const paid = Number(p.paid_amount || 0);
                const remaining = Math.max(total - paid, 0);

                const isPaid = p.status === "PAID";
                const processing = processingId === p.id;

                return (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-white font-medium">
                      {p.invoice_no || `#${p.id}`}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {p.warehouse || "Main Warehouse"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      ₹ {total.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      ₹ {paid.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      ₹ {remaining.toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <span className={paymentBadge(p.status)}>{p.status}</span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isPaid ? (
                          <>
                            <span className="text-xs text-slate-500 mr-1">Closed</span>
                            <IconButton
                              title="View payments"
                              onClick={() => openHistoryDrawer(p)}
                            >
                              <ClipboardDocumentListIcon className="w-4 h-4 text-slate-300" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton
                              title="Confirm & close"
                              onClick={() => confirmAndClosePurchase(p)}
                              disabled={processing}
                            >
                              <CheckBadgeIcon className="w-4 h-4 text-indigo-300" />
                            </IconButton>

                            <IconButton
                              title="Add payment"
                              onClick={() => openPaymentModal(p)}
                            >
                              <CurrencyRupeeIcon className="w-4 h-4 text-slate-200" />
                            </IconButton>

                            <IconButton
                              title="View payments"
                              onClick={() => openHistoryDrawer(p)}
                            >
                              <ClipboardDocumentListIcon className="w-4 h-4 text-slate-300" />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedPurchase && (
        <PaymentAmountModal
          purchase={selectedPurchase}
          onClose={closePaymentModal}
          onSuccess={onPaymentSuccess}
        />
      )}

      {historyPurchase && (
        <PaymentHistoryDrawer
          purchase={historyPurchase}
          onClose={closeHistoryDrawer}
        />
      )}
    </DashboardLayout>
  );
}
