import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

export default function ImportJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchJobs = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.get("/imports");
      setJobs(Array.isArray(res.data) ? res.data : []);
      return;
    } catch {
      // fallback
    }

    try {
      const res2 = await api.get("/import");
      setJobs(Array.isArray(res2.data) ? res2.data : []);
    } catch (err) {
      setErrorMsg("Failed to load import jobs. Please check server or login.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const badge = (status) => {
    const base =
      "px-2 py-0.5 rounded-full text-[11px] font-semibold inline-block";
    if (status === "COMPLETED")
      return `${base} bg-emerald-500/15 text-emerald-400`;
    if (status === "FAILED")
      return `${base} bg-red-500/15 text-red-400`;
    return `${base} bg-amber-500/15 text-amber-400`;
  };

  const handleDownload = async (job) => {
    try {
      setDownloadingId(job.id);

      const res = await api.get(`/imports/${job.id}/error-file`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "text/csv",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const cd = res.headers["content-disposition"];
      if (cd) {
        const match = /filename="?([^"]+)"?/.exec(cd);
        link.download = match?.[1] || `import_errors_${job.id}.csv`;
      } else {
        link.download = `import_errors_${job.id}.csv`;
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to download error file");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* ================= PAGE HEADER ================= */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Import Jobs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Background CSV imports and processing status
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="inline-flex items-center gap-2
                     px-4 py-2 text-xs font-medium
                     border border-indigo-500/40 text-indigo-400
                     rounded-lg hover:bg-indigo-500/10 transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 text-sm text-red-400">{errorMsg}</div>
      )}

      {/* ================= TABLE PANEL ================= */}
      <div className="bg-[#0b1224] border border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#0f172a] border-b border-white/10">
              <tr className="text-slate-400 text-left">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Rows</th>
                <th className="px-4 py-3 text-right">Success</th>
                <th className="px-4 py-3 text-right">Failed</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-center">Errors</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading import jobs…
                  </td>
                </tr>
              )}

              {!loading && jobs.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No import jobs found
                  </td>
                </tr>
              )}

              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t border-white/5 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 text-white">{job.type}</td>

                  <td className="px-4 py-3">
                    <span className={badge(job.status)}>
                      {job.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right text-slate-300">
                    {job.total_rows ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-right text-emerald-400">
                    {job.success_rows ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-right text-red-400">
                    {job.failed_rows ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-400">
                    {job.created_at
                      ? new Date(job.created_at).toLocaleString()
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {job.error_file_path ? (
                      <button
                        onClick={() => handleDownload(job)}
                        disabled={downloadingId === job.id}
                        title="Download error file"
                        className="inline-flex items-center justify-center
                                   text-red-400 hover:text-red-300
                                   disabled:opacity-50"
                      >
                        <Download size={16} />
                      </button>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
