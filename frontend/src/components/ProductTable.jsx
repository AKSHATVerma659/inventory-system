import { useState } from "react";
import api from "../services/api";

export default function ProductTable({ products, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = (p) => {
    setEditing(p.id);
    setForm(p);
  };

  const save = async () => {
    await api.put(`/products/${editing}`, form);
    setEditing(null);
    onRefresh();
  };

  const remove = async (id) => {
    if (!window.confirm("Deactivate this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2">SKU</th>
          <th className="px-3 py-2">Name</th>
          <th className="px-3 py-2">Cost</th>
          <th className="px-3 py-2">Selling</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2 text-center">Actions</th>
        </tr>
      </thead>

      <tbody>
        {products.map(p => (
          <tr key={p.id} className="border-t">
            <td className="px-3 py-2">{p.sku}</td>

            <td className="px-3 py-2">
              {editing === p.id ? (
                <input
                  className="border px-1 w-full"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              ) : p.name}
            </td>

            <td className="px-3 py-2">
              {editing === p.id ? (
                <input
                  type="number"
                  className="border px-1 w-full"
                  value={form.cost_price}
                  onChange={e =>
                    setForm({ ...form, cost_price: e.target.value })
                  }
                />
              ) : `₹ ${p.cost_price}`}
            </td>

            <td className="px-3 py-2">
              {editing === p.id ? (
                <input
                  type="number"
                  className="border px-1 w-full"
                  value={form.selling_price}
                  onChange={e =>
                    setForm({ ...form, selling_price: e.target.value })
                  }
                />
              ) : `₹ ${p.selling_price}`}
            </td>

            <td className="px-3 py-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] ${
                  p.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {p.is_active ? "Active" : "Inactive"}
              </span>
            </td>

            <td className="px-3 py-2 text-center space-x-1">
              {editing === p.id ? (
                <>
                  <button
                    onClick={save}
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="px-2 py-1 bg-gray-200 rounded text-[11px]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(p)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-[11px]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-[11px]"
                  >
                    Delete
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
