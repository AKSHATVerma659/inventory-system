import { motion } from "framer-motion";

/* Row animation: once, subtle */
const rowAnim = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 }
};

export default function AnimatedTable({
  columns,
  data,
  emptyText = "No records found"
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-gray-400 py-6 text-center">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="relative overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-xs">
        {/* ===== STICKY HEADER ===== */}
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-3 py-2 text-left font-medium ${
                  col.align === "center" ? "text-center" : ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* ===== BODY ===== */}
        <tbody>
          {data.map((row, idx) => (
            <motion.tr
              key={row.id || idx}
              initial="hidden"
              animate="visible"
              variants={rowAnim}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="border-b border-gray-100 dark:border-gray-800
                         hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`px-3 py-2 ${
                    col.align === "center" ? "text-center" : ""
                  } ${
                    col.bold
                      ? "font-medium text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
