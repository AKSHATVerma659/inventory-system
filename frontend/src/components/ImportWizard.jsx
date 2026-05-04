import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function ImportWizard({ onClose, onUploaded }) {
  const [type, setType] = useState("product");
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [jobStatus, setJobStatus] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f);
    setPreviewRows([]);
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const preview = lines.slice(0, 6).map((line) =>
        line.split(",").map((c) => c.trim())
      );
      setPreviewRows(preview);
    };
    reader.readAsText(f);
  }

  function endpointForType(t) {
    if (t === "product") return "/imports/products/upload";
    if (t === "inventory") return "/imports/opening-inventory/upload";
    if (t === "purchase") return "/imports/purchases";
    return "/imports/products/upload";
  }

  async function pollJob(jobId) {
    if (!jobId) return;
    try {
      const res = await api.get(`/imports/${jobId}`);
      if (res?.data) {
        setJobStatus(res.data);
        if (["COMPLETED", "FAILED"].includes(res.data.status)) {
          clearInterval(pollRef.current);
        }
        return;
      }
    } catch {}

    try {
      const list = await api.get("/imports");
      const found = Array.isArray(list.data)
        ? list.data.find((j) => String(j.id) === String(jobId))
        : null;
      if (found) {
        setJobStatus(found);
        if (["COMPLETED", "FAILED"].includes(found.status)) {
          clearInterval(pollRef.current);
        }
      }
    } catch {}
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert("Please select a CSV file.");

    setUploading(true);
    setPercent(0);
    setJobStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(endpointForType(type), formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (!e.total) return;
          setPercent(Math.round((e.loaded * 100) / e.total));
        }
      });

      const jobId =
        res.data?.importJobId ||
        res.data?.jobId ||
        res.data?.id ||
        res.data?.importJob?.id;

      if (jobId) {
        pollRef.current = setInterval(() => pollJob(jobId), 2000);
        await pollJob(jobId);
      }

      onUploaded?.();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-11/12 max-w-3xl rounded-2xl border border-white/10 bg-[#0b1224] shadow-xl p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Import Wizard
            </h2>
            <p className="text-sm text-slate-400">
              Upload CSV files to update system data
            </p>
          </div>

          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              onClose();
            }}
            className="px-3 py-1.5 text-xs rounded-lg
                       border border-white/10 text-slate-300
                       hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* IMPORT TYPE */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Import Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg bg-[#020617]
                         border border-white/10 px-3 py-2 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="product">Products (CSV)</option>
              <option value="inventory">Opening Inventory (CSV)</option>
              <option value="purchase">Purchases (CSV)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Opening inventory creates stock movements.
            </p>
          </div>

          {/* FILE */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-300
                         file:mr-4 file:rounded-lg
                         file:border-0
                         file:bg-indigo-600 file:text-white
                         file:px-4 file:py-2
                         hover:file:bg-indigo-700"
            />
          </div>

          {/* PREVIEW */}
          {previewRows.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-[#020617] p-3 text-xs overflow-auto max-h-40">
              <table className="w-full">
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {r.map((c, j) => (
                        <td key={j} className="px-2 py-1 text-slate-300">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 rounded-lg text-sm font-medium
                         bg-indigo-600 text-white
                         hover:bg-indigo-700 disabled:opacity-60"
            >
              {uploading ? `Uploading ${percent}%` : "Start Import"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviewRows([]);
                setPercent(0);
              }}
              className="px-4 py-2 rounded-lg text-sm
                         border border-white/10 text-slate-300
                         hover:bg-white/10"
            >
              Reset
            </button>

            <div className="ml-auto text-xs text-slate-400">
              {jobStatus ? (
                <>
                  <div>
                    Status:{" "}
                    <span className="font-semibold text-white">
                      {jobStatus.status || "PROCESSING"}
                    </span>
                  </div>
                  {jobStatus.total_rows != null && (
                    <div>
                      Rows {jobStatus.success_rows ?? 0}/
                      {jobStatus.total_rows}
                    </div>
                  )}
                </>
              ) : (
                "Ready to upload"
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
