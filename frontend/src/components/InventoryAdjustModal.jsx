import { useState } from "react";
import api from "../services/api";

export default function InventoryAdjustModal({ item, onClose, onSuccess }) {
  const [type, setType] = useState("OUT");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!quantity || quantity <= 0) return alert("Invalid quantity");
    if (!reason) return alert("Reason required");

    setLoading(true);
    try {
      await api.post("/inventory/adjust", {
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        type,
        quantity,
        reason
      });
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || "Adjustment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 p-6">
        <h2 className="text-lg font-semibold mb-4">Adjust Inventory</h2>

        <div className="mb-3">
          <label className="text-sm">Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="IN">Increase</option>
            <option value="OUT">Decrease</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="text-sm">Quantity</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="text-sm">Reason</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
