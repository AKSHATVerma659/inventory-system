import { useEffect, useState } from "react";
import { createProduct, updateProduct } from "../services/productService";

export default function ProductForm({ product, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    sku: "",
    name: "",
    cost_price: "",
    selling_price: "",
  });

  /* 🔁 SYNC FORM WHEN EDITING CHANGES */
  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku || "",
        name: product.name || "",
        cost_price: product.cost_price ?? "",
        selling_price: product.selling_price ?? "",
      });
    } else {
      setForm({
        sku: "",
        name: "",
        cost_price: "",
        selling_price: "",
      });
    }
  }, [product]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (product) {
        // UPDATE MODE
        await updateProduct(product.id, form);
      } else {
        // CREATE MODE
        await createProduct(form);
      }

      onSuccess();
    } catch (err) {
      alert("Failed to save product");
    }
  };

  return (
    <form
      onSubmit={submit}
      className="
        bg-[#0b1224]
        border border-white/10
        rounded-xl
        p-5
        space-y-4
      "
    >
      {/* SECTION TITLE */}
      <h2 className="text-sm font-semibold text-white">
        {product ? "Edit Product" : "Add Product"}
      </h2>

      {/* SKU */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">SKU</label>
        <input
          className="
            w-full bg-[#020617] border border-white/10 rounded-lg
            px-3 py-2 text-sm text-white placeholder-slate-500
            focus:outline-none focus:ring-1 focus:ring-indigo-500
          "
          placeholder="PRD-001"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
      </div>

      {/* PRODUCT NAME */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Product Name</label>
        <input
          className="
            w-full bg-[#020617] border border-white/10 rounded-lg
            px-3 py-2 text-sm text-white placeholder-slate-500
            focus:outline-none focus:ring-1 focus:ring-indigo-500
          "
          placeholder="Ergonomic Chair"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      {/* COST PRICE */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Cost Price (₹)</label>
        <input
          type="number"
          className="
            w-full bg-[#020617] border border-white/10 rounded-lg
            px-3 py-2 text-sm text-white placeholder-slate-500
            focus:outline-none focus:ring-1 focus:ring-indigo-500
          "
          value={form.cost_price}
          onChange={(e) =>
            setForm({ ...form, cost_price: e.target.value })
          }
        />
      </div>

      {/* SELLING PRICE */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Selling Price (₹)</label>
        <input
          type="number"
          className="
            w-full bg-[#020617] border border-white/10 rounded-lg
            px-3 py-2 text-sm text-white placeholder-slate-500
            focus:outline-none focus:ring-1 focus:ring-indigo-500
          "
          value={form.selling_price}
          onChange={(e) =>
            setForm({ ...form, selling_price: e.target.value })
          }
        />
      </div>

      {/* ACTIONS */}
      <div className="pt-2 flex gap-2">
        <button
          type="submit"
          className="
            px-4 py-2 text-sm font-medium rounded-lg
            bg-indigo-600 text-white hover:bg-indigo-700 transition
          "
        >
          {product ? "Update Product" : "Save Product"}
        </button>

        {product && (
          <button
            type="button"
            onClick={onCancel}
            className="
              px-4 py-2 text-sm rounded-lg
              border border-white/10 text-slate-300
              hover:bg-white/5
            "
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
