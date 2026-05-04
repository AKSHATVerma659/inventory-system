import { useEffect, useState } from "react";
import api from "../../services/api";

/**
 * PaymentHistoryDrawer
 *
 * Props:
 * - purchase: purchase object { id, invoice_no, total_amount }
 * - onClose(): close drawer
 */
export default function PaymentHistoryDrawer({ purchase, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [purchase?.id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments/history", {
        params: {
          type: "PURCHASE",
          id: purchase.id
        }
      });
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const methodBadge = (method) => {
    const base =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold";
    if (method === "UPI")
      return `${base} bg-indigo-500/15 text-indigo-400`;
    if (method === "CARD")
      return `${base} bg-purple-500/15 text-purple-400`;
    if (method === "BANK")
      return `${base} bg-sky-500/15 text-sky-400`;
    if (method === "CASH")
      return `${base} bg-emerald-500/15 text-emerald-400`;
    return `${base} bg-slate-500/15 text-slate-300`;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* BACKDROP */}
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* DRAWER */}
      <div className="w-full max-w-md bg-[#071026] border-l border-white/10 shadow-xl flex flex-col">
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Payment History
            </h3>
            <p className="text-xs text-slate-400">
              {purchase.invoice_no || `Purchase #${purchase.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm"
          >
            Close
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-sm text-slate-400">
              Loading payment history…
            </div>
          ) : error ? (
            <div className="text-sm text-rose-400">{error}</div>
          ) : payments.length === 0 ? (
            <div className="text-sm text-slate-400">
              No payments recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-white/10 bg-[#0b1224] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white font-medium text-sm">
                      ₹ {Number(p.amount || 0).toLocaleString()}
                    </div>
                    <span className={methodBadge(p.payment_method)}>
                      {p.payment_method}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {new Date(p.paid_at).toLocaleString()}
                  </div>

                  {/* METHOD DETAILS */}
                  {p.payment_details && (
                    <div className="mt-2 text-xs text-slate-300 space-y-1">
                      {p.payment_details.upi_id && (
                        <div>UPI: {p.payment_details.upi_id}</div>
                      )}

                      {p.payment_details.bank && (
                        <>
                          <div>
                            Bank: {p.payment_details.bank.account_name}
                          </div>
                          <div>
                            A/C: {p.payment_details.bank.account_number}
                          </div>
                          <div>
                            IFSC: {p.payment_details.bank.ifsc}
                          </div>
                        </>
                      )}

                      {p.payment_details.card && (
                        <div>
                          Card: **** **** ****{" "}
                          {p.payment_details.card.number}
                        </div>
                      )}
                    </div>
                  )}

                  {p.remarks && (
                    <div className="mt-2 text-xs text-slate-400">
                      Note: {p.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
