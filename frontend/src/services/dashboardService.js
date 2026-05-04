// src/services/dashboardService.js
import api from "./api";

const dashboardService = {
  // kpi: totals for period (days)
  async getKPIs(days = 30) {
    // Expect backend endpoints like /reports/dashboard?days=30
    // If backend doesn't have this, the fallback calls below will try to compose data.
    try {
      const res = await api.get(`/reports/dashboard?days=${days}`);
      return res.data;
    } catch (err) {
      // fallback calls (safe)
      try {
        const sales = await api.get(`/reports/sales?from_days=${days}`);
        const purchases = await api.get(`/reports/purchases?from_days=${days}`);
        const inventoryVal = await api.get(`/reports/inventory/value`);
        const lowStock = await api.get(`/reports/inventory?low=1`);
        return {
          totalSales: sales.data.total || 0,
          totalPurchases: purchases.data.total || 0,
          profit: (sales.data.total || 0) - (purchases.data.total || 0),
          inventoryValue: inventoryVal.data.total || 0,
          lowStockCount: (lowStock.data || []).length || 0,
        };
      } catch (e) {
        console.error("dashboardService fallback failed", e);
        return {
          totalSales: 0,
          totalPurchases: 0,
          profit: 0,
          inventoryValue: 0,
          lowStockCount: 0,
        };
      }
    }
  },

  // time series for charts (sales/purchases)
  async getSeries(days = 30) {
    try {
      const res = await api.get(`/reports/combined?days=${days}`);
      // expected { sales: [...], purchases: [...] } with date & total
      return res.data;
    } catch (err) {
      // try separate endpoints
      try {
        const s = await api.get(`/reports/sales?from_days=${days}`);
        const p = await api.get(`/reports/purchases?from_days=${days}`);
        return { sales: s.data.series || [], purchases: p.data.series || [] };
      } catch (e) {
        console.error("getSeries failed", e);
        return { sales: [], purchases: [] };
      }
    }
  },
};

export default dashboardService;
