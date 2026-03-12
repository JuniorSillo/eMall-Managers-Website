'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import {
  SalesSummary,
  SalesTrendItem,
  SalesTopProduct,
  SalesBestSeller,
  ReportDateParams,
  DashboardSummary,
  WeeklySale,
  TopProduct,
  RecentOrder,
  DashboardAlerts,
} from '@/lib/authTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  FileText,
  Calendar,
  Download,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Bell,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { toast } from 'sonner';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportTab = 'sales' | 'inventory' | 'orders' | 'financial';
type DateRange = 'today' | 'week' | 'month' | 'custom';

interface KPICard {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface Insight {
  type: 'warning' | 'success' | 'danger' | 'info';
  title: string;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toApiRange(range: DateRange): string {
  switch (range) {
    case 'today': return 'today';
    case 'week':  return 'thisWeek';
    case 'month': return 'thisMonth';
    default:      return 'thisMonth';
  }
}

function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function generateHTMLReport(opts: {
  title: string;
  dateLabel: string;
  kpis: { label: string; value: string }[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  insights: Insight[];
}) {
  const insightColor = (t: Insight['type']) =>
    ({ success: '#16a34a', warning: '#d97706', danger: '#dc2626', info: '#2563eb' }[t]);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${opts.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111827; padding: 40px; }
    h1 { font-size: 24px; font-weight: 700; }
    .meta { font-size: 13px; color: #6b7280; margin-top: 4px; margin-bottom: 32px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .kpi { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
    .kpi-value { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .kpi-label { font-size: 13px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; margin-bottom: 32px; }
    th { background: #f3f4f6; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; }
    td { padding: 12px 14px; font-size: 14px; border-top: 1px solid #f3f4f6; }
    .section-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .insights { display: flex; flex-direction: column; gap: 10px; }
    .insight { display: flex; gap: 12px; padding: 12px 16px; border-radius: 8px; border-left: 4px solid; }
    .insight-title { font-size: 13px; font-weight: 600; }
    .insight-msg { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; }
    @media print { body { background: #fff; padding: 20px; } }
  </style>
</head>
<body>
  <h1>${opts.title}</h1>
  <p class="meta">Period: ${opts.dateLabel} &nbsp;•&nbsp; Generated: ${new Date().toLocaleString()}</p>
  ${opts.kpis.length ? `
  <div class="kpis">
    ${opts.kpis.map(k => `<div class="kpi"><div class="kpi-value">${k.value}</div><div class="kpi-label">${k.label}</div></div>`).join('')}
  </div>` : ''}
  ${opts.tableHeaders.length ? `
  <p class="section-title">Detailed Breakdown</p>
  <table>
    <thead><tr>${opts.tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${opts.tableRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>` : ''}
  ${opts.insights.length ? `
  <p class="section-title">Insights</p>
  <div class="insights">
    ${opts.insights.map(i => `
      <div class="insight" style="border-color:${insightColor(i.type)};background:${insightColor(i.type)}15;">
        <div>
          <div class="insight-title" style="color:${insightColor(i.type)}">${i.title}</div>
          <div class="insight-msg">${i.message}</div>
        </div>
      </div>`).join('')}
  </div>` : ''}
  <div class="footer">Generated by Shop Manager System</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────

function KPICardComponent({ kpi }: { kpi: KPICard }) {
  return (
    <Card className="rounded-xl shadow-sm border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gray-50 ${kpi.color}`}>{kpi.icon}</div>
          {kpi.trend && kpi.change && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
              {kpi.trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {kpi.change}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
        <p className="text-sm text-gray-500">{kpi.label}</p>
        {kpi.change && !kpi.trend && <p className="text-xs text-gray-400 mt-1">{kpi.change}</p>}
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const config = {
    warning: { border: 'border-l-amber-500', icon: 'text-amber-500', bg: 'bg-amber-50' },
    success: { border: 'border-l-green-500', icon: 'text-green-500', bg: 'bg-green-50' },
    danger:  { border: 'border-l-red-500',   icon: 'text-red-500',   bg: 'bg-red-50'   },
    info:    { border: 'border-l-blue-500',  icon: 'text-blue-500',  bg: 'bg-blue-50'  },
  };
  const c = config[insight.type];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border border-l-4 ${c.border} ${c.bg} shadow-sm`}>
      <div className={`mt-0.5 flex-shrink-0 ${c.icon}`}><AlertCircle className="h-4 w-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{insight.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insight.message}</p>
      </div>
    </div>
  );
}

function FilterPanel({
  dateRange, setDateRange, onExport,
  customStart, setCustomStart, customEnd, setCustomEnd,
}: {
  dateRange: DateRange; setDateRange: (v: DateRange) => void;
  onExport: () => void;
  customStart: string; setCustomStart: (v: string) => void;
  customEnd: string;   setCustomEnd:   (v: string) => void;
}) {
  return (
    <Card className="rounded-xl shadow-sm border bg-white">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</Label>
            <div className="flex gap-2 flex-wrap">
              {(['today', 'week', 'month', 'custom'] as DateRange[]).map((r) => (
                <Button key={r} variant={dateRange === r ? 'default' : 'outline'} size="sm"
                  onClick={() => setDateRange(r)}
                  className={dateRange === r ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                  {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'Custom'}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </div>
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-500 whitespace-nowrap">From:</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-8 text-sm w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-500 whitespace-nowrap">To:</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-8 text-sm w-40" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    completed:  'bg-green-100 text-green-700 border-green-200',
    pending:    'bg-amber-100 text-amber-700 border-amber-200',
    cancelled:  'bg-red-100 text-red-600 border-red-200',
    'in transit':'bg-blue-100 text-blue-700 border-blue-200',
  };
  const cls = cfg[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────

function SalesReport({
  dateRange, setDateRange, shopId,
  onGenerateReport,
}: {
  dateRange: DateRange; setDateRange: (v: DateRange) => void;
  shopId: number;
  onGenerateReport: (opts: Parameters<typeof generateHTMLReport>[0]) => void;
}) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [selectedProduct, setSelectedProduct] = useState<SalesBestSeller | null>(null);
  const [summary,     setSummary]     = useState<SalesSummary | null>(null);
  const [trend,       setTrend]       = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<SalesTopProduct[]>([]);
  const [bestSellers, setBestSellers] = useState<SalesBestSeller[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);

  const buildParams = useCallback((): ReportDateParams => {
    const base: ReportDateParams = { range: toApiRange(dateRange) };
    if (dateRange === 'custom' && customStart && customEnd) {
      base.startDate = new Date(customStart).toISOString();
      base.endDate   = new Date(customEnd).toISOString();
    }
    return base;
  }, [dateRange, customStart, customEnd]);

  const fetchAll = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const params = buildParams();
      const [s, t, tp, bs] = await Promise.all([
        authAPI.getSalesSummary(shopId, params),
        authAPI.getSalesTrend(shopId, params),
        authAPI.getSalesTopProducts(shopId, params),
        authAPI.getSalesBestSellers(shopId, params),
      ]);
      setSummary(s); setTrend(t); setTopProducts(tp); setBestSellers(bs);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sales report');
    } finally {
      setIsLoading(false);
    }
  }, [shopId, buildParams]);

  useEffect(() => {
    if (dateRange === 'custom' && (!customStart || !customEnd)) return;
    fetchAll();
  }, [fetchAll]);

  const salesKPI: KPICard[] = summary ? [
    { label: 'Total Revenue',       value: `R ${summary.totalRevenue.toLocaleString()}`,       trend: 'up', icon: <DollarSign className="h-5 w-5" />,   color: 'text-green-600'  },
    { label: 'Orders Completed',    value: summary.ordersCompleted.toLocaleString(),            trend: 'up', icon: <ShoppingCart className="h-5 w-5" />,  color: 'text-blue-600'   },
    { label: 'Avg Order Value',     value: `R ${summary.averageOrderValue.toLocaleString()}`,               icon: <TrendingUp className="h-5 w-5" />,     color: 'text-violet-600' },
    { label: 'Top Product',         value: summary.topProduct, change: bestSellers[0] ? `${bestSellers[0].units} units` : undefined, icon: <Package className="h-5 w-5" />, color: 'text-amber-600' },
  ] : [];

  const trendChartData = {
    labels: trend.map((t) => t.month),
    datasets: [
      { label: 'This Year', data: trend.map((t) => t.thisYear),  borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)',   borderWidth: 2.5, tension: 0.4, fill: true },
      { label: 'Last Year', data: trend.map((t) => t.lastYear),  borderColor: '#9ca3af', backgroundColor: 'rgba(156,163,175,0.05)', borderWidth: 2,   tension: 0.4, fill: true },
    ],
  };
  const barChartData = {
    labels: topProducts.map((p) => p.productName),
    datasets: [{ label: 'Revenue (R)', data: topProducts.map((p) => p.revenue), backgroundColor: ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0'] }],
  };
  const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' as const }, tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' }, ticks: { callback: (v: any) => `R ${(v/1000).toFixed(0)}k` } } } };
  const barOpts  = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' } } } };

  const handleExport = () => {
    if (!bestSellers.length) { toast.error('No data to export'); return; }
    exportToCSV(`sales-best-sellers-${dateRange}.csv`,
      ['Rank','Product','Revenue (R)','Units Sold','Growth (%)'],
      bestSellers.map((r) => [r.rank, r.productName, r.revenue, r.units, r.growth]));
    toast.success('CSV exported successfully');
  };

  const handleGenerate = () => {
    if (!summary) { toast.error('No data to generate report'); return; }
    onGenerateReport({
      title: 'Sales Report',
      dateLabel: dateRange === 'custom' ? `${customStart} – ${customEnd}` : dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month',
      kpis: salesKPI.map((k) => ({ label: k.label, value: k.value })),
      tableHeaders: ['Rank','Product','Revenue (R)','Units Sold','Growth (%)'],
      tableRows: bestSellers.map((r) => [r.rank, r.productName, `R ${r.revenue.toLocaleString()}`, r.units, `${r.growth >= 0 ? '+' : ''}${r.growth}%`]),
      insights: [],
    });
  };

  useEffect(() => { (window as any).__activeTabGenerate = handleGenerate; });

  return (
    <div className="space-y-6">
      <FilterPanel dateRange={dateRange} setDateRange={setDateRange} onExport={handleExport} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {salesKPI.map((kpi) => <KPICardComponent key={kpi.label} kpi={kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Revenue Trend — Year Over Year</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Monthly comparison</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[280px]">
                  {trend.length > 0 ? <Line data={trendChartData} options={lineOpts as any} /> : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No trend data</div>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Top Products by Revenue</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Click a bar to drill down</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[280px]">
                  {topProducts.length > 0
                    ? <Bar data={barChartData} options={{ ...barOpts, onClick: (_: any, els: any[]) => { if (els.length) { const bs = bestSellers[els[0].index]; if (bs) setSelectedProduct(bs); } } } as any} />
                    : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No product data</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-gray-800">Best Selling Products</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Revenue & units sold — click row to drill down</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {bestSellers.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No data available</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {['Rank','Product','Revenue','Units','Growth'].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bestSellers.map((row) => (
                          <tr key={row.rank} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedProduct(row)}>
                            <td className="py-3 px-2 font-semibold text-gray-700">#{row.rank}</td>
                            <td className="py-3 px-2 font-medium text-gray-800">{row.productName}</td>
                            <td className="py-3 px-2 font-semibold text-green-700">R {row.revenue.toLocaleString()}</td>
                            <td className="py-3 px-2">{row.units}</td>
                            <td className="py-3 px-2">
                              <span className={`text-xs font-medium ${row.growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {row.growth >= 0 ? '+' : ''}{row.growth}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.productName}</DialogTitle>
            <DialogDescription>Sales breakdown</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-2 gap-4 py-4">
              {[
                { label: 'Total Revenue', value: `R ${selectedProduct.revenue.toLocaleString()}` },
                { label: 'Units Sold',    value: String(selectedProduct.units) },
                { label: 'Growth',        value: `${selectedProduct.growth >= 0 ? '+' : ''}${selectedProduct.growth}%` },
                { label: 'Rank',          value: `#${selectedProduct.rank}` },
              ].map((item) => (
                <div key={item.label} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Inventory Tab ────────────────────────────────────────────────────────────

function InventoryReport({
  dateRange, setDateRange, shopId,
  onGenerateReport,
}: {
  dateRange: DateRange; setDateRange: (v: DateRange) => void;
  shopId: number;
  onGenerateReport: (opts: Parameters<typeof generateHTMLReport>[0]) => void;
}) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [summary,   setSummary]   = useState<DashboardSummary | null>(null);
  const [topProds,  setTopProds]  = useState<TopProduct[]>([]);
  const [alerts,    setAlerts]    = useState<DashboardAlerts | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const [s, tp, a] = await Promise.all([
        authAPI.getDashboardSummary(shopId),
        authAPI.getDashboardTopProducts(shopId),
        authAPI.getDashboardAlerts(shopId),
      ]);
      setSummary(s); setTopProds(tp); setAlerts(a);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load inventory report');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const inventoryKPI: KPICard[] = summary ? [
    { label: 'Total Products',    value: String(summary.totalProducts), icon: <Package className="h-5 w-5" />,      color: 'text-green-600' },
    { label: 'Low Stock Items',   value: String(summary.lowStockCount), trend: summary.lowStockCount > 0 ? 'down' : undefined, change: summary.lowStockCount > 0 ? 'Needs attention' : 'All good', icon: <AlertCircle className="h-5 w-5" />, color: 'text-red-600' },
  ] : [];

  // Stock distribution — derive from alerts
  const lowStockCount    = alerts?.lowStock.length ?? 0;
  const inStockCount     = summary ? Math.max(0, summary.totalProducts - lowStockCount) : 0;

  const stockDistData = {
    labels: ['In Stock', 'Low Stock'],
    datasets: [{ data: [inStockCount, lowStockCount], backgroundColor: ['#16a34a', '#f59e0b'], borderWidth: 0 }],
  };

  // Top products bar chart
  const topProdsChartData = {
    labels: topProds.map((p) => p.productName),
    datasets: [{ label: 'Units Sold', data: topProds.map((p) => p.totalSold), backgroundColor: '#16a34a' }],
  };

  const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const }, tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 } } };
  const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' } } } };

  // Flatten low stock alerts into table rows
  const lowStockRows = alerts?.lowStock ?? [];

  // Derive insights from live data
  const insights: Insight[] = [
    ...(summary && summary.lowStockCount > 0 ? [{ type: 'warning' as const, title: 'Low Stock Alert', message: `${summary.lowStockCount} product${summary.lowStockCount > 1 ? 's are' : ' is'} running low on stock.` }] : []),
    ...(summary && summary.lowStockCount === 0 ? [{ type: 'success' as const, title: 'Stock Levels Healthy', message: 'All products are sufficiently stocked.' }] : []),
    ...(topProds.length > 0 ? [{ type: 'info' as const, title: 'Top Mover', message: `"${topProds[0].productName}" leads with ${topProds[0].totalSold} units sold.` }] : []),
  ];

  const handleExport = () => {
    if (!lowStockRows.length) { toast.error('No low stock data to export'); return; }
    exportToCSV('inventory-low-stock.csv', ['Message', 'Type'], lowStockRows.map((r) => [r.message, r.type]));
    toast.success('CSV exported successfully');
  };

  const handleGenerate = () => {
    if (!summary) { toast.error('No data to generate report'); return; }
    onGenerateReport({
      title: 'Inventory Report',
      dateLabel: 'Current',
      kpis: inventoryKPI.map((k) => ({ label: k.label, value: k.value })),
      tableHeaders: ['Message', 'Alert Type'],
      tableRows: lowStockRows.map((r) => [r.message, r.type]),
      insights,
    });
  };

  useEffect(() => { (window as any).__activeTabGenerate = handleGenerate; });

  return (
    <div className="space-y-6">
      <FilterPanel dateRange={dateRange} setDateRange={setDateRange} onExport={handleExport} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inventoryKPI.map((kpi) => <KPICardComponent key={kpi.label} kpi={kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Stock Distribution</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">In stock vs low stock</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[260px]">
                  {summary ? <Doughnut data={stockDistData} options={pieOpts as any} /> : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Top Products by Units Sold</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Best performing stock</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[260px]">
                  {topProds.length > 0 ? <Bar data={topProdsChartData} options={barOpts as any} /> : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Low Stock Alerts</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Items requiring attention</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {lowStockRows.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No low stock alerts</p>
                  : (
                    <div className="space-y-2.5">
                      {lowStockRows.map((alert, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-l-4 border-l-amber-500 shadow-sm">
                          <Bell className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                            <Badge variant="secondary" className="mt-1 text-xs">{alert.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Insights</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-2.5">
                  {insights.map((i, idx) => <InsightCard key={idx} insight={i} />)}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersReport({
  dateRange, setDateRange, shopId,
  onGenerateReport,
}: {
  dateRange: DateRange; setDateRange: (v: DateRange) => void;
  shopId: number;
  onGenerateReport: (opts: Parameters<typeof generateHTMLReport>[0]) => void;
}) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [summary,       setSummary]       = useState<DashboardSummary | null>(null);
  const [recentOrders,  setRecentOrders]  = useState<RecentOrder[]>([]);
  const [alerts,        setAlerts]        = useState<DashboardAlerts | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);

  const fetchAll = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const [s, o, a] = await Promise.all([
        authAPI.getDashboardSummary(shopId),
        authAPI.getRecentOrders(shopId),
        authAPI.getDashboardAlerts(shopId),
      ]);
      setSummary(s); setRecentOrders(o); setAlerts(a);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load orders report');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const ordersKPI: KPICard[] = summary ? [
    { label: 'Orders Today',      value: String(summary.todayOrders),      trend: 'up',                         icon: <ShoppingCart className="h-5 w-5" />, color: 'text-green-600'  },
    { label: 'Completed Orders',  value: String(summary.completedOrders),  trend: 'up',                         icon: <Activity className="h-5 w-5" />,     color: 'text-blue-600'   },
    { label: 'Pending Orders',    value: String(summary.pendingOrders),    trend: summary.pendingOrders > 0 ? 'down' : undefined, change: summary.pendingOrders > 0 ? 'Awaiting action' : 'All clear', icon: <AlertCircle className="h-5 w-5" />, color: 'text-amber-600' },
  ] : [];

  // Status breakdown doughnut
  const statusChartData = {
    labels: ['Completed', 'Pending'],
    datasets: [{ data: [summary?.completedOrders ?? 0, summary?.pendingOrders ?? 0], backgroundColor: ['#16a34a', '#f59e0b'], borderWidth: 0 }],
  };
  const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const }, tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 } } };

  const paymentFailedAlerts = alerts?.paymentFailed ?? [];
  const pendingReturnAlerts = alerts?.pendingReturns ?? [];

  const insights: Insight[] = [
    ...(summary && summary.pendingOrders > 0 ? [{ type: 'warning' as const, title: 'Pending Orders', message: `${summary.pendingOrders} order${summary.pendingOrders > 1 ? 's are' : ' is'} awaiting fulfillment.` }] : []),
    ...(summary && summary.completedOrders > 0 ? [{ type: 'success' as const, title: 'Orders Fulfilled', message: `${summary.completedOrders} order${summary.completedOrders > 1 ? 's' : ''} completed today.` }] : []),
    ...(paymentFailedAlerts.length > 0 ? [{ type: 'danger' as const, title: 'Payment Failures', message: `${paymentFailedAlerts.length} payment${paymentFailedAlerts.length > 1 ? 's' : ''} failed and need attention.` }] : []),
    ...(pendingReturnAlerts.length > 0 ? [{ type: 'info' as const, title: 'Pending Returns', message: `${pendingReturnAlerts.length} return request${pendingReturnAlerts.length > 1 ? 's' : ''} awaiting review.` }] : []),
  ];

  const handleExport = () => {
    if (!recentOrders.length) { toast.error('No orders to export'); return; }
    exportToCSV('recent-orders.csv', ['Order ID', 'Customer', 'Total (R)', 'Status'],
      recentOrders.map((o) => [o.orderId, o.customerName, o.total, o.status]));
    toast.success('CSV exported successfully');
  };

  const handleGenerate = () => {
    if (!summary) { toast.error('No data to generate report'); return; }
    onGenerateReport({
      title: 'Orders & Fulfillment Report',
      dateLabel: 'Today',
      kpis: ordersKPI.map((k) => ({ label: k.label, value: k.value })),
      tableHeaders: ['Order ID', 'Customer', 'Total (R)', 'Status'],
      tableRows: recentOrders.map((o) => [`#${o.orderId}`, o.customerName, `R ${o.total.toLocaleString()}`, o.status]),
      insights,
    });
  };

  useEffect(() => { (window as any).__activeTabGenerate = handleGenerate; });

  return (
    <div className="space-y-6">
      <FilterPanel dateRange={dateRange} setDateRange={setDateRange} onExport={handleExport} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ordersKPI.map((kpi) => <KPICardComponent key={kpi.label} kpi={kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Order Status Breakdown</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Today's orders</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[260px]">
                  {summary ? <Doughnut data={statusChartData} options={pieOpts as any} /> : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Recent Orders</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Latest customer activity</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {recentOrders.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No recent orders</p>
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {['Order ID','Customer','Total','Status'].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {recentOrders.map((order) => (
                            <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-2 font-mono text-xs text-gray-500">#{order.orderId}</td>
                              <td className="py-3 px-2 font-medium text-gray-800">{order.customerName}</td>
                              <td className="py-3 px-2 font-semibold text-gray-900">R {order.total.toLocaleString()}</td>
                              <td className="py-3 px-2"><StatusBadge status={order.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-gray-800">Insights & Alerts</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {insights.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No alerts at this time</p>
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{insights.map((i, idx) => <InsightCard key={idx} insight={i} />)}</div>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Financial Tab ────────────────────────────────────────────────────────────

function FinancialReport({
  dateRange, setDateRange, shopId,
  onGenerateReport,
}: {
  dateRange: DateRange; setDateRange: (v: DateRange) => void;
  shopId: number;
  onGenerateReport: (opts: Parameters<typeof generateHTMLReport>[0]) => void;
}) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [weeklySales,  setWeeklySales]  = useState<WeeklySale[]>([]);
  const [topProds,     setTopProds]     = useState<TopProduct[]>([]);
  const [isLoading,    setIsLoading]    = useState(false);

  const buildParams = useCallback((): ReportDateParams => {
    const base: ReportDateParams = { range: toApiRange(dateRange) };
    if (dateRange === 'custom' && customStart && customEnd) {
      base.startDate = new Date(customStart).toISOString();
      base.endDate   = new Date(customEnd).toISOString();
    }
    return base;
  }, [dateRange, customStart, customEnd]);

  const fetchAll = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const params = buildParams();
      const [ss, ws, tp] = await Promise.all([
        authAPI.getSalesSummary(shopId, params),
        authAPI.getWeeklySales(shopId),
        authAPI.getDashboardTopProducts(shopId),
      ]);
      setSalesSummary(ss); setWeeklySales(ws); setTopProds(tp);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load financial report');
    } finally {
      setIsLoading(false);
    }
  }, [shopId, buildParams]);

  useEffect(() => {
    if (dateRange === 'custom' && (!customStart || !customEnd)) return;
    fetchAll();
  }, [fetchAll]);

  const financialKPI: KPICard[] = salesSummary ? [
    { label: 'Total Revenue',      value: `R ${salesSummary.totalRevenue.toLocaleString()}`,      trend: 'up', icon: <DollarSign className="h-5 w-5" />,   color: 'text-green-600'  },
    { label: 'Orders Completed',   value: String(salesSummary.ordersCompleted),                   trend: 'up', icon: <ShoppingCart className="h-5 w-5" />,  color: 'text-blue-600'   },
    { label: 'Avg Order Value',    value: `R ${salesSummary.averageOrderValue.toLocaleString()}`,               icon: <TrendingUp className="h-5 w-5" />,     color: 'text-violet-600' },
    { label: 'Top Earning Product',value: salesSummary.topProduct,                                              icon: <Package className="h-5 w-5" />,        color: 'text-amber-600'  },
  ] : [];

  // Weekly revenue chart
  const revenueChartData = {
    labels: weeklySales.map((s) => s.day),
    datasets: [{
      label: 'Revenue (R)', data: weeklySales.map((s) => s.revenue),
      borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)',
      borderWidth: 2.5, tension: 0.4, fill: true,
    }],
  };

  // Top products revenue bar
  const topProdsChartData = {
    labels: topProds.map((p) => p.productName),
    datasets: [{ label: 'Revenue (R)', data: topProds.map((p) => p.revenue), backgroundColor: ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0'] }],
  };

  const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' }, ticks: { callback: (v: any) => `R ${(v/1000).toFixed(0)}k` } } } };
  const barOpts  = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' } } } };

  const insights: Insight[] = [
    ...(salesSummary && salesSummary.totalRevenue > 0 ? [{ type: 'success' as const, title: 'Revenue Generated', message: `Total revenue of R ${salesSummary.totalRevenue.toLocaleString()} recorded for this period.` }] : []),
    ...(salesSummary && salesSummary.averageOrderValue > 0 ? [{ type: 'info' as const, title: 'Average Order Value', message: `Customers are spending an average of R ${salesSummary.averageOrderValue.toLocaleString()} per order.` }] : []),
    ...(topProds.length > 0 ? [{ type: 'info' as const, title: 'Top Revenue Driver', message: `"${topProds[0].productName}" is driving the most revenue with ${topProds[0].totalSold} units sold.` }] : []),
  ];

  const handleExport = () => {
    if (!topProds.length) { toast.error('No data to export'); return; }
    exportToCSV('financial-top-products.csv', ['Product', 'Units Sold', 'Revenue (R)'],
      topProds.map((p) => [p.productName, p.totalSold, p.revenue]));
    toast.success('CSV exported successfully');
  };

  const handleGenerate = () => {
    if (!salesSummary) { toast.error('No data to generate report'); return; }
    onGenerateReport({
      title: 'Financial Report',
      dateLabel: dateRange === 'custom' ? `${customStart} – ${customEnd}` : dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month',
      kpis: financialKPI.map((k) => ({ label: k.label, value: k.value })),
      tableHeaders: ['Product', 'Units Sold', 'Revenue (R)'],
      tableRows: topProds.map((p) => [p.productName, p.totalSold, `R ${p.revenue.toLocaleString()}`]),
      insights,
    });
  };

  useEffect(() => { (window as any).__activeTabGenerate = handleGenerate; });

  return (
    <div className="space-y-6">
      <FilterPanel dateRange={dateRange} setDateRange={setDateRange} onExport={handleExport} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialKPI.map((kpi) => <KPICardComponent key={kpi.label} kpi={kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Weekly Revenue Trend</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[280px]">
                  {weeklySales.length > 0 ? <Line data={revenueChartData} options={lineOpts as any} /> : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Revenue by Product</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Top earning products</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[280px]">
                  {topProds.length > 0 ? <Bar data={topProdsChartData} options={barOpts as any} /> : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Top Products by Revenue</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Revenue & units sold</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {topProds.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No data available</p>
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {['#','Product','Units Sold','Revenue'].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {topProds.map((p, idx) => (
                            <tr key={p.productName} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-2 font-semibold text-gray-400">{idx + 1}</td>
                              <td className="py-3 px-2 font-medium text-gray-800">{p.productName}</td>
                              <td className="py-3 px-2">{p.totalSold}</td>
                              <td className="py-3 px-2 font-semibold text-green-700">R {p.revenue.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-800">Insights</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-2.5">
                  {insights.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-4">No insights available</p>
                    : insights.map((i, idx) => <InsightCard key={idx} insight={i} />)}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [shopId,    setShopId]    = useState<number>(0);
  const [shopReady, setShopReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) { router.push('/login'); return; }
    const resolve = async () => {
      try {
        const userData = await authAPI.getUserById(user.id);
        const id       = await authAPI.getShopByMngrID(userData.roleID);
        setShopId(id);
        setShopReady(true);
      } catch (err: any) {
        toast.error(err.message || 'Failed to resolve shop');
      }
    };
    resolve();
  }, [user, loading, router]);

  const handleGenerateReport = (opts: Parameters<typeof generateHTMLReport>[0]) => {
    generateHTMLReport(opts);
    toast.success('Report opened in new tab — print or save as PDF');
  };

  const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
    { key: 'sales',     label: 'Sales',     icon: <TrendingUp className="h-4 w-4" />   },
    { key: 'inventory', label: 'Inventory', icon: <Package className="h-4 w-4" />      },
    { key: 'orders',    label: 'Orders',    icon: <ShoppingCart className="h-4 w-4" /> },
    { key: 'financial', label: 'Financial', icon: <DollarSign className="h-4 w-4" />   },
  ];

  if (loading || !shopReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-pulse">
          <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  const sharedProps = { dateRange, setDateRange, shopId, onGenerateReport: handleGenerateReport };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Analyze performance and trends across your business</p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => (window as any).__activeTabGenerate?.()}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <Button key={tab.key} variant={activeTab === tab.key ? 'default' : 'outline'} size="sm"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap ${activeTab === tab.key ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-gray-50'}`}>
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'sales'     && <SalesReport     {...sharedProps} />}
        {activeTab === 'inventory' && <InventoryReport {...sharedProps} />}
        {activeTab === 'orders'    && <OrdersReport    {...sharedProps} />}
        {activeTab === 'financial' && <FinancialReport {...sharedProps} />}
      </div>
    </div>
  );
}