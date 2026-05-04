import { useEffect, useState } from "react";
import api from "../services/api";

export default function InventoryTransferModal({ item, onClose, onSuccess }) {
  const [warehouses, setWarehouses] = useState([]);
  const [toWarehouse, setToWarehouse] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    api.get("/warehouses").then(res => setWarehouses(res.data || []));
  }, []);

  const submit = async () => {
    if (!toWarehouse) return alert("Select destination");
    if (!quantity || quantity <= 0) return alert("Invalid quantity");
    if (!reason) return alert("Reason required");

    try {
      await api.post("/inventory/transfer", {
        product_id: item.product_id,
        from_warehouse_id: item.warehouse_id,
        to_warehouse_id: toWarehouse,
        quantity,
        reason
      });
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 p-6">
        <h2 className="text-lg font-semibold mb-4">Transfer Inventory</h2>

        <div className="mb-3">
          <label className="text-sm">To Warehouse</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={toWarehouse}
            onChange={(e) => setToWarehouse(e.target.value)}
          >
            <option value="">Select</option>
            {warehouses
              .filter(w => w.id !== item.warehouse_id)
              .map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
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
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
