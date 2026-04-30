import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

export default function SalesChart({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p className="text-gray-400 text-center py-16">
        No sales data available
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e5e7eb"
        />

        {/* Supports both label and date */}
        <XAxis
          dataKey={d => d.label || d.date}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />

        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />

        <Tooltip
          formatter={(value) => [`₹ ${Number(value).toLocaleString()}`, "Sales"]}
          labelStyle={{ fontWeight: 600 }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}
        />

        <Line
          type="monotone"
          dataKey="total"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
