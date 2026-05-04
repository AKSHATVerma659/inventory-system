import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import ImportWizard from "../components/ImportWizard";
import InventoryAdjustModal from "../components/InventoryAdjustModal";
import InventoryTransferModal from "../components/InventoryTransferModal";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selected, setSelected] = useState(null);

  const [showImport, setShowImport] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [transferItem, setTransferItem] = useState(null);

  const [lastRefreshed, setLastRefreshed] = useState(null);

  const prevQtyRef = useRef({});
  const clearTimersRef = useRef({});
  const intervalRef = useRef(null);

  const userRole = localStorage.getItem("role"); // ADMIN / USER

  const shouldPauseRefresh =
    showImport || showTimeline || adjustItem || transferItem;

  const fetchInventory = async () => {
    const res = await api.get("/inventory");
    const data = res.data || [];

    const updated = data.map(item => {
      const prevQty = prevQtyRef.current[item.id];
      const changed =
        prevQty !== undefined && prevQty !== item.quantity;

      prevQtyRef.current[item.id] = item.quantity;

      if (changed) {
        clearTimeout(clearTimersRef.current[item.id]);
        clearTimersRef.current[item.id] = setTimeout(() => {
          setItems(curr =>
            curr.map(i =>
              i.id === item.id ? { ...i, __changed: false } : i
            )
          );
        }, 2500);
      }

      return {
        ...item,
        __changed: changed
      };
    });

    setItems(updated);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchInventory();

    intervalRef.current = setInterval(() => {
      if (!shouldPauseRefresh) {
        fetchInventory();
      }
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
      Object.values(clearTimersRef.current).forEach(clearTimeout);
    };
  }, [shouldPauseRefresh]);

  const openTimeline = async (item) => {
    setSelected(item);
    const res = await api.get(
      `/inventory/${item.product_id}/${item.warehouse_id}/movements`
    );
    setTimeline(res.data || []);
    setShowTimeline(true);
  };

  return (
    <DashboardLayout>
      {/* ================= PAGE HEADER ================= */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Inventory
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live stock levels across warehouses
            </p>
            {lastRefreshed && (
              <p className="text-[11px] text-slate-500 mt-1">
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 text-xs font-medium
                         bg-indigo-600 text-white
                         rounded-lg hover:bg-indigo-700 transition"
            >
              Import
            </button>

            <Link
              to="/imports"
              className="px-4 py-2 text-xs font-medium
                         border border-indigo-500/40 text-indigo-400
                         rounded-lg hover:bg-indigo-500/10 transition"
            >
              Import Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* ================= INVENTORY PANEL ================= */}
      <div className="bg-[#0b1224] border border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#0f172a] border-b border-white/10">
              <tr className="text-left text-slate-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Last Move</th>
                {userRole === "ADMIN" && (
                  <th className="px-4 py-3 text-center">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={userRole === "ADMIN" ? 7 : 6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No inventory data found
                  </td>
                </tr>
              )}

              {items.map(item => {
                const low = item.quantity <= item.min_quantity;

                return (
                  <tr
                    key={item.id}
                    onClick={() => openTimeline(item)}
                    className={`
                      border-t border-white/5
                      hover:bg-white/5 transition cursor-pointer
                      ${item.__changed ? "bg-yellow-500/10" : ""}
                    `}
                  >
                    <td className="px-4 py-3 text-white">
                      {item.product}
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {item.warehouse}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-300">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-400">
                      {item.min_quantity}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          low
                            ? "bg-red-500/15 text-red-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {low ? "LOW" : "OK"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-slate-400">
                      {item.lastMovement ? (
                        <>
                          <span className="mr-1 text-indigo-400">•</span>
                          {item.lastMovement.movement_type === "IN" ? "+" : "-"}
                          {item.lastMovement.change}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    {userRole === "ADMIN" && (
                      <td
                        className="px-4 py-3 text-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setAdjustItem(item)}
                          className="px-2 py-1 text-[11px]
                                     bg-indigo-600 text-white rounded
                                     hover:bg-indigo-700"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => setTransferItem(item)}
                          className="px-2 py-1 text-[11px]
                                     bg-purple-600 text-white rounded
                                     hover:bg-purple-700"
                        >
                          Transfer
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TIMELINE MODAL ================= */}
      {showTimeline && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
          <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-xl w-11/12 md:w-2/3 p-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              Stock Movement — {selected?.product}
            </h2>

            <ul className="max-h-72 overflow-y-auto text-xs text-slate-300">
              {timeline.map(m => (
                <li
                  key={m.id}
                  className="py-2 border-b border-white/10"
                >
                  <span className="font-medium text-white">
                    {m.movement_type}
                  </span>{" "}
                  {m.change} ({m.reference_type}) —{" "}
                  {new Date(m.created_at).toLocaleString()}
                </li>
              ))}
            </ul>

            <div className="mt-4 text-right">
              <button
                onClick={() => setShowTimeline(false)}
                className="px-4 py-2 text-xs
                           bg-indigo-600 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      {showImport && (
        <ImportWizard
          onClose={() => setShowImport(false)}
          onUploaded={() => {
            fetchInventory();
            setShowImport(false);
          }}
        />
      )}

      {adjustItem && (
        <InventoryAdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSuccess={() => {
            fetchInventory();
            setAdjustItem(null);
          }}
        />
      )}

      {transferItem && (
        <InventoryTransferModal
          item={transferItem}
          onClose={() => setTransferItem(null)}
          onSuccess={() => {
            fetchInventory();
            setTransferItem(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
