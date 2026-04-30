// src/components/PaymentAmountModal.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/**
 * PaymentAmountModal / PaymentModal
 *
 * Props:
 *  - purchase: { id, invoice_no, total_amount, paid_amount }
 *  - onClose(): callback to close modal
 *  - onSuccess(): callback after successful payment (parent refreshes)
 */
export default function PaymentAmountModal({ purchase, onClose, onSuccess }) {
  const total = Number(purchase.total_amount || 0);
  const paid = Number(purchase.paid_amount || 0);
  const remainingInitial = Math.max(total - paid, 0);

  // UI state
  const [stage, setStage] = useState("methods"); // "methods" | "details" | "summary"
  const [method, setMethod] = useState(null); // "CARD" | "UPI" | "BANK" | "CASH"
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [responseSummary, setResponseSummary] = useState(null);

  // Form state (shared amount + per-method details)
  const [amount, setAmount] = useState(remainingInitial);
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState({
    account_name: "",
    account_number: "",
    ifsc: ""
  });
  const [note, setNote] = useState("");

  // UPI QR state
  const [upiDeepLink, setUpiDeepLink] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);

  useEffect(() => {
    // reset when purchase changes
    setAmount(remainingInitial);
    setMethod(null);
    setStage("methods");
    setCard({ number: "", name: "", expiry: "", cvv: "" });
    setUpiId("");
    setBank({ account_name: "", account_number: "", ifsc: "" });
    setNote("");
    setError(null);
    setResponseSummary(null);
    setUpiDeepLink(null);
    setQrImageUrl(null);
  }, [purchase?.id]); // eslint-disable-line

  const formattedRemaining = useMemo(
    () => remainingInitial.toLocaleString(),
    [remainingInitial]
  );

  const chooseMethod = (m) => {
    setMethod(m);
    setStage("details");
    setError(null);
    // reset QR when switching methods
    setUpiDeepLink(null);
    setQrImageUrl(null);
  };

  // Simple client-side checks
  const validateDetails = () => {
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount greater than 0.");
      return false;
    }
    if (Number(amount) > remainingInitial) {
      setError(`Amount cannot exceed remaining ₹ ${formattedRemaining}.`);
      return false;
    }

    if (method === "CARD") {
      const num = card.number.replace(/\s+/g, "");
      if (!/^\d{12,19}$/.test(num)) {
        setError("Enter a valid card number (numbers only).");
        return false;
      }
      if (!card.name || card.name.trim().length < 2) {
        setError("Enter cardholder name.");
        return false;
      }
      if (!/^\d{2}\/?\d{2}$/.test(card.expiry)) {
        setError("Enter expiry in MM/YY format.");
        return false;
      }
      if (!/^\d{3,4}$/.test(card.cvv)) {
        setError("Enter a valid CVV.");
        return false;
      }
    }

    if (method === "UPI") {
      if (!upiId || upiId.trim().length < 3) {
        setError("Enter a valid UPI id (example: pay@bank).");
        return false;
      }
    }

    if (method === "BANK") {
      if (!bank.account_name || !bank.account_number || !bank.ifsc) {
        setError("Enter bank account name, number and IFSC.");
        return false;
      }
      // IFSC quick-format check (non-blocking)
    }

    // CASH needs no extra validation
    setError(null);
    return true;
  };

  const submitPayment = async () => {
    setError(null);
    if (!validateDetails()) return;

    try {
      setProcessing(true);

      // Pack metadata so backend (or future audit) can use it if desired.
      const metadata = {
        ...(method === "CARD" && {
          card: {
            number: card.number.replace(/\s+/g, "").slice(-4), // store last4 only client-side
            name: card.name,
            expiry: card.expiry
          }
        }),
        ...(method === "UPI" && { upi_id: upiId }),
        ...(method === "BANK" && { bank }),
        note
      };

      const payload = {
        reference_type: "PURCHASE",
        reference_id: purchase.id,
        amount: Number(amount),
        payment_method: method,
        payment_details: metadata
      };

      const res = await api.post("/payments", payload);

      // expected: { payment, applied_amount, remaining_balance }
      setResponseSummary(res.data || { applied_amount: payload.amount, remaining_balance: 0 });
      setStage("summary");

      // inform parent to refresh after a small pause
      setTimeout(() => {
        onSuccess && onSuccess();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create payment");
    } finally {
      setProcessing(false);
    }
  };

  // ---------- UPI QR helpers ----------
  const buildUpiDeepLink = (payee, am, memo) => {
    // payee = upiId
    // amount must be decimal dot format (two decimals)
    const amountFormatted = Number(am).toFixed(2);
    const tn = memo || `Payment ${purchase.invoice_no || purchase.id}`;
    const params = new URLSearchParams({
      pa: payee,
      pn: "Inventory ERP",
      am: amountFormatted,
      cu: "INR",
      tn
    });
    return `upi://pay?${params.toString()}`;
  };

  const generateUpiQr = () => {
    setError(null);
    // validate UPI and amount
    if (!upiId || upiId.trim().length < 3) {
      setError("Enter a valid UPI id before generating QR.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    const deep = buildUpiDeepLink(upiId.trim(), amount, note || undefined);
    setUpiDeepLink(deep);

    // Use Google Chart API to render QR (no dependency). Size 300x300.
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deep)}`;
    setQrImageUrl(qr);
  };

  const openUpiApp = () => {
    if (!upiDeepLink) {
      setError("Generate QR / link first.");
      return;
    }
    // Try to open the UPI app via deep link
    // Note: On desktop this may do nothing; on mobile it should open user's UPI app.
    window.location.href = upiDeepLink;
  };

  const copyUpiLink = async () => {
    if (!upiDeepLink) {
      setError("Generate QR / link first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(upiDeepLink);
      // small user-friendly feedback is handled by your UI or just set a transient message
      setError(null);
      // quick visual confirmation (temporary): reuse error slot as message (you can change)
      setTimeout(() => setError(null), 1800);
    } catch (e) {
      setError("Failed to copy link to clipboard.");
    }
  };

  const downloadQr = () => {
    if (!qrImageUrl) {
      setError("Generate QR first.");
      return;
    }
    // Create an anchor to download the QR image
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = `${purchase.invoice_no || purchase.id}_upi_qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  // ---------- end UPI helpers ----------

  const renderMethods = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">
        Payments — {purchase.invoice_no || `#${purchase.id}`}
      </h3>
      <p className="text-sm text-slate-400">Choose the payment method you'd like to use</p>

      <div className="mt-4 space-y-3">
        <button
          onClick={() => chooseMethod("CARD")}
          className="w-full text-left px-4 py-3 rounded-lg bg-[#071428] border border-white/6 hover:bg-white/5 flex items-center gap-3"
        >
          <span className="w-8 text-indigo-300">💳</span>
          <span className="flex-1">Card</span>
          <span className="text-sm text-slate-400">Pay by card</span>
        </button>

        <button
          onClick={() => chooseMethod("UPI")}
          className="w-full text-left px-4 py-3 rounded-lg bg-[#071428] border border-white/6 hover:bg-white/5 flex items-center gap-3"
        >
          <span className="w-8 text-indigo-300">📲</span>
          <span className="flex-1">UPI</span>
          <span className="text-sm text-slate-400">Enter UPI ID or scan</span>
        </button>

        <button
          onClick={() => chooseMethod("BANK")}
          className="w-full text-left px-4 py-3 rounded-lg bg-[#071428] border border-white/6 hover:bg-white/5 flex items-center gap-3"
        >
          <span className="w-8 text-indigo-300">🏦</span>
          <span className="flex-1">Bank Transfer</span>
          <span className="text-sm text-slate-400">Account / IFSC</span>
        </button>

        <button
          onClick={() => chooseMethod("CASH")}
          className="w-full text-left px-4 py-3 rounded-lg bg-[#071428] border border-white/6 hover:bg-white/5 flex items-center gap-3"
        >
          <span className="w-8 text-indigo-300">💵</span>
          <span className="flex-1">Cash</span>
          <span className="text-sm text-slate-400">Record a cash payment</span>
        </button>
      </div>

      <div className="mt-4 text-center">
        <button onClick={onClose} className="text-sm text-slate-400">Cancel</button>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {method === "CARD" && "Card Payment"}
            {method === "UPI" && "UPI Payment"}
            {method === "BANK" && "Bank Transfer"}
            {method === "CASH" && "Cash Payment"}
          </h3>
          <p className="text-sm text-slate-400">Fill the details below and confirm payment.</p>
        </div>

        <div>
          <button onClick={() => setStage("methods")} className="text-slate-400 text-sm">Back</button>
        </div>
      </div>

      <div className="text-sm text-slate-300 space-y-2">
        <div>
          <div className="text-xs text-slate-400">Total</div>
          <div className="text-white font-medium">₹ {total.toLocaleString()}</div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Already Paid</div>
          <div className="text-white font-medium">₹ {paid.toLocaleString()}</div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Remaining</div>
          <div className="text-white font-medium">₹ {remainingInitial.toLocaleString()}</div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
            min="0"
            step="0.01"
            disabled={processing}
          />
        </div>

        {/* Method-specific forms */}
        {method === "CARD" && (
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Card Number</label>
            <input
              value={card.number}
              onChange={(e) => setCard(s => ({ ...s, number: e.target.value }))}
              className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              placeholder="1234 5678 9012 3456"
              disabled={processing}
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">Expiry (MM/YY)</label>
                <input
                  value={card.expiry}
                  onChange={(e) => setCard(s => ({ ...s, expiry: e.target.value }))}
                  className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                  placeholder="MM/YY"
                  disabled={processing}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">CVV</label>
                <input
                  value={card.cvv}
                  onChange={(e) => setCard(s => ({ ...s, cvv: e.target.value }))}
                  className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                  placeholder="123"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400">Cardholder name</label>
              <input
                value={card.name}
                onChange={(e) => setCard(s => ({ ...s, name: e.target.value }))}
                className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                placeholder="Full name"
                disabled={processing}
              />
            </div>
          </div>
        )}

        {method === "UPI" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">UPI ID</label>
              <input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                placeholder="example@bank"
                disabled={processing}
              />
              <div className="text-xs text-slate-500 mt-1">
                Enter UPI ID (e.g. supplier@upi) or generate QR for exact amount.
              </div>
            </div>

            {/* QR GENERATE / SCAN BLOCK */}
            <div className="flex items-center gap-2">
              <button
                onClick={generateUpiQr}
                className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60"
                disabled={processing}
              >
                Generate QR / Scan
              </button>

              <button
                onClick={() => {
                  // simple quick open using deep link when already generated
                  if (!upiDeepLink) {
                    setError("Generate QR first.");
                    return;
                  }
                  openUpiApp();
                }}
                className="px-3 py-1.5 text-sm rounded border border-white/10 text-slate-200 hover:bg-white/5"
                disabled={!upiDeepLink || processing}
              >
                Open UPI app
              </button>

              <button
                onClick={copyUpiLink}
                className="px-3 py-1.5 text-sm rounded border border-white/10 text-slate-200 hover:bg-white/5"
                disabled={!upiDeepLink || processing}
              >
                Copy link
              </button>

              <button
                onClick={downloadQr}
                className="px-3 py-1.5 text-sm rounded bg-transparent border border-white/10 text-slate-200 hover:bg-white/5"
                disabled={!qrImageUrl || processing}
              >
                Download QR
              </button>
            </div>

            {/* QR Preview */}
            {qrImageUrl && (
              <div className="mt-3 p-3 rounded-lg border border-dashed border-white/15 bg-[#0b1224] text-center">
                <div className="mx-auto w-44 h-44 rounded-md bg-[#071026] border border-white/10 flex items-center justify-center">
                  <img
                    src={qrImageUrl}
                    alt="UPI QR"
                    className="max-w-full max-h-full"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Scan QR with your UPI app to pay ₹ {Number(amount).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {method === "BANK" && (
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Account holder name</label>
            <input
              value={bank.account_name}
              onChange={(e) => setBank(b => ({ ...b, account_name: e.target.value }))}
              className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              disabled={processing}
            />

            <label className="text-xs text-slate-400">Account number</label>
            <input
              value={bank.account_number}
              onChange={(e) => setBank(b => ({ ...b, account_number: e.target.value }))}
              className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              disabled={processing}
            />

            <label className="text-xs text-slate-400">IFSC</label>
            <input
              value={bank.ifsc}
              onChange={(e) => setBank(b => ({ ...b, ifsc: e.target.value }))}
              className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              placeholder="AAAA0BBBBBB"
              disabled={processing}
            />
          </div>
        )}

        {method === "CASH" && (
          <div className="space-y-2">
            <div className="text-sm text-slate-300">Confirm cash collection. This will mark payment as received in ledger.</div>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#0b1224] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
            disabled={processing}
          />
        </div>

        {error && <div className="text-xs text-rose-400">{error}</div>}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => setStage("methods")}
          className="px-3 py-1.5 text-sm rounded bg-transparent border border-white/10 text-slate-200"
          disabled={processing}
        >
          Back
        </button>

        <button
          onClick={submitPayment}
          disabled={processing}
          className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60"
        >
          {processing ? "Processing…" : `Pay ₹ ${Number(amount).toLocaleString()}`}
        </button>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Payment recorded</h3>
      <div className="text-sm text-slate-300">
        <div>Applied: ₹ {Number(responseSummary?.applied_amount || 0).toLocaleString()}</div>
        <div>Remaining: ₹ {Number(responseSummary?.remaining_balance || 0).toLocaleString()}</div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => { onClose(); }}
          className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !processing && onClose()}
      />

      <div className="relative w-full max-w-lg bg-[#071026] border border-white/10 rounded-lg p-6 shadow-lg">
        {stage === "methods" && renderMethods()}
        {stage === "details" && renderDetails()}
        {stage === "summary" && renderSummary()}
      </div>
    </div>
  );
}
