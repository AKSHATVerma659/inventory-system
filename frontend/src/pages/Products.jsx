import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ProductForm from "../components/ProductForm";
import { getProducts } from "../services/productService";
import api from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  /* 🔳 QR State */
  const [qrOpen, setQrOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [qrProduct, setQrProduct] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data || []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (product) => {
    const ok = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await api.delete(`/products/${product.id}`);
      await loadProducts();
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  /* 🔳 OPEN QR MODAL */
  const openQR = async (product) => {
    setQrOpen(true);
    setQrProduct(product);
    setQrLoading(true);

    try {
      const res = await api.get(`/products/${product.id}/qrcode`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setQrImageUrl(url);
    } catch (err) {
      alert("Failed to load QR code");
      setQrOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  /* 🔽 DOWNLOAD QR */
  const downloadQR = () => {
    if (!qrImageUrl || !qrProduct) return;

    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = `${qrProduct.sku || "product"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* ❌ CLOSE QR MODAL */
  const closeQR = () => {
    if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
    setQrOpen(false);
    setQrImageUrl(null);
    setQrProduct(null);
  };

  return (
    <DashboardLayout>
      {/* ========== PAGE HEADER ========== */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Products</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage product catalog, pricing, and stock configuration
        </p>
      </div>

      {/* ========== PRODUCTS TABLE ========== */}
      <div className="mb-6 bg-[#0b1224] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] border-b border-white/10">
              <tr className="text-slate-400">
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Selling</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => {
                const isActive = p.is_active === true || p.is_active === 1;

                return (
                  <tr
                    key={p.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-slate-200">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-200">{p.name}</td>

                    <td className="px-4 py-3 text-right text-slate-300">
                      ₹ {Number(p.cost_price || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-300">
                      ₹ {Number(p.selling_price || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => setEditing(p)}
                        className="px-3 py-1 text-xs rounded bg-indigo-600 text-white"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(p)}
                        className="px-3 py-1 text-xs rounded border border-indigo-500/40 text-indigo-400"
                      >
                        Delete
                      </button>

                      {/* 🔳 QR BUTTON */}
                      <button
                        onClick={() => openQR(p)}
                        title="View product QR code"
                        className="px-3 py-1 text-xs rounded border border-slate-500/40 text-slate-300 hover:bg-slate-500/10"
                      >
                        QR
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== ADD / EDIT PRODUCT ========== */}
      <div className="bg-[#0b1224] border border-white/10 rounded-xl p-5 max-w-2xl">
        <h2 className="text-sm font-semibold text-white mb-3">
          {editing ? "Edit Product" : "Add Product"}
        </h2>

        <ProductForm
          product={editing}
          onSuccess={async () => {
            await loadProducts();
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      </div>

      {/* ========== QR MODAL ========== */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#0b1224] border border-white/10 rounded-xl p-6 w-[320px] text-center">
            <h3 className="text-white font-semibold mb-1">Product QR Code</h3>
            <p className="text-xs text-slate-400 mb-4">
              {qrProduct?.name}
            </p>

            {qrLoading ? (
              <div className="text-slate-400 text-sm py-12">Loading QR…</div>
            ) : (
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="mx-auto mb-4 rounded bg-white p-2"
              />
            )}

            <div className="flex justify-center gap-2">
              <button
                onClick={downloadQR}
                disabled={!qrImageUrl}
                className="px-3 py-1 text-xs rounded bg-indigo-600 text-white"
              >
                Download
              </button>

              <button
                onClick={closeQR}
                className="px-3 py-1 text-xs rounded border border-slate-500/40 text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
