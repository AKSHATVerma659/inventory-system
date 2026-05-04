// src/components/KpiCard.jsx
import React from "react";

export default function KpiCard({ title, value, subtitle, icon, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 flex items-center gap-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        {icon ? icon : <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /></svg>}
      </div>

      <div className="flex-1">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
