import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function PublicProduct() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/public/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Public product fetch failed", err);
        setError("Product not found or unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Product not available
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            The product you are looking for does not exist or is inactive.
          </p>

          <Link
            to="/"
            className="inline-block px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const isActive =
    product.is_active === true ||
    product.is_active === 1 ||
    product.is_active === "1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#020617] px-4 py-10">
      <div className="max-w-md mx-auto bg-[#0b1224] border border-white/10 rounded-2xl shadow-lg p-6">
        {/* BRAND / HEADER */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Product Details
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Powered by Inventory ERP
          </p>
        </div>

        {/* PRODUCT INFO */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-400">Product Name</p>
            <p className="text-sm text-white font-medium">
              {product.name || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">SKU</p>
            <p className="text-sm text-white font-medium">
              {product.sku || "—"}
            </p>
          </div>

          {product.description && (
            <div>
              <p className="text-xs text-slate-400">Description</p>
              <p className="text-sm text-slate-300">
                {product.description}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400">Selling Price</p>
            <p className="text-lg font-semibold text-emerald-400">
              ₹{" "}
              {Number(product.selling_price || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {isActive ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-300 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
