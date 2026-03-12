'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { DashboardSummary, WeeklySale, TopProduct, RecentOrder, DashboardAlerts } from '@/lib/authTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  CircleDollarSign,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const normalised = status.toLowerCase() as 'completed' | 'pending' | 'cancelled';
  const config: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 border-green-200',
    pending:   'bg-amber-100 text-amber-700 border-amber-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  };
  const cls = config[normalised] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({ title, message, type, time }: { title: string; message: string; type: string; time: string }) {
  const alertType = type === 'error' ? 'error' : type === 'info' ? 'info' : 'warning';
  const config = {
    error:   { border: 'border-l-red-500',   icon: 'text-red-500',   bg: 'bg-red-50'   },
    warning: { border: 'border-l-amber-500', icon: 'text-amber-500', bg: 'bg-amber-50' },
    info:    { border: 'border-l-blue-500',  icon: 'text-blue-500',  bg: 'bg-blue-50'  },
  };
  const c = config[alertType];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border border-l-4 ${c.border} ${c.bg} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className={`mt-0.5 flex-shrink-0 ${c.icon}`}>
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{message}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function RetailManagerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [shopId, setShopId]       = useState<number | null>(null);
  const [summary, setSummary]     = useState<DashboardSummary | null>(null);
  const [weeklySales, setWeekly]  = useState<WeeklySale[]>([]);
  const [topProducts, setTopProds]= useState<TopProduct[]>([]);
  const [recentOrders, setOrders] = useState<RecentOrder[]>([]);
  const [alerts, setAlerts]       = useState<DashboardAlerts | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated]   = useState('—');
  const [fetchError, setFetchError]     = useState<string | null>(null);

  // ── Resolve shopId on mount (same pattern as ProductsSection) ──────────────
  useEffect(() => {
    if (loading) return;
    if (!user?.id) { router.push('/login'); return; }

    const resolveShop = async () => {
      try {
        const userData   = await authAPI.getUserById(user.id);
        const resolvedId = await authAPI.getShopByMngrID(userData.roleID);
        setShopId(resolvedId);
      } catch (err: any) {
        setFetchError(err.message || 'Failed to resolve shop');
      }
    };

    resolveShop();
  }, [user, loading, router]);

  // ── Fetch all dashboard data once shopId is known ─────────────────────────
  useEffect(() => {
    if (shopId === null) return;
    fetchDashboard(shopId);
  }, [shopId]);

  const fetchDashboard = async (id: number) => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const [sum, sales, top, orders, alertData] = await Promise.all([
        authAPI.getDashboardSummary(id),
        authAPI.getWeeklySales(id),
        authAPI.getDashboardTopProducts(id),
        authAPI.getRecentOrders(id),
        authAPI.getDashboardAlerts(id),
      ]);
      setSummary(sum);
      setWeekly(sales);
      setTopProds(top);
      setOrders(orders);
      setAlerts(alertData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load dashboard');
    } finally {
      setIsFetching(false);
    }
  };

  const handleRefresh = async () => {
    if (!shopId) return;
    setIsRefreshing(true);
    await fetchDashboard(shopId);
    setIsRefreshing(false);
  };

  // ── Derived alert list (flatten all alert categories) ─────────────────────
  const flatAlerts = alerts
    ? [
        ...alerts.lowStock.map((a, i)       => ({ id: `ls-${i}`,  title: 'Low Stock',       ...a, time: 'Just now' })),
        ...alerts.pendingReturns.map((a, i) => ({ id: `pr-${i}`,  title: 'Pending Return',  ...a, time: 'Just now' })),
        ...alerts.paymentFailed.map((a, i)  => ({ id: `pf-${i}`,  title: 'Payment Failed',  ...a, time: 'Just now' })),
      ]
    : [];

  const errorCount = flatAlerts.filter((a) => a.type === 'error').length;

  // ── Summary cards derived from API data ───────────────────────────────────
  const summaryCards = summary
    ? [
        {
          label: "Today's Revenue",
          value: `R ${summary.todayRevenue.toLocaleString()}`,
          change: `${summary.completedOrders} completed`,
          positive: true,
          icon: <CircleDollarSign className="h-5 w-5" />,
          accent: 'text-green-600',
        },
        {
          label: 'Orders Today',
          value: `${summary.todayOrders}`,
          change: `${summary.pendingOrders} pending`,
          positive: summary.pendingOrders === 0,
          icon: <ShoppingCart className="h-5 w-5" />,
          accent: 'text-blue-600',
        },
        {
          label: 'Total Products',
          value: `${summary.totalProducts}`,
          change: 'In your shop',
          positive: true,
          icon: <Package className="h-5 w-5" />,
          accent: 'text-violet-600',
        },
        {
          label: 'Low Stock Items',
          value: `${summary.lowStockCount}`,
          change: summary.lowStockCount > 0 ? 'Needs attention' : 'All good',
          positive: summary.lowStockCount === 0,
          icon: <AlertTriangle className="h-5 w-5" />,
          accent: 'text-red-500',
        },
      ]
    : [];

  // ── Chart config ──────────────────────────────────────────────────────────
  const chartData = {
    labels: weeklySales.map((s) => s.day),
    datasets: [
      {
        label: 'Sales (R)',
        data: weeklySales.map((s) => s.revenue),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1fae5',
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: (ctx: any) => ` R ${ctx.parsed.y.toLocaleString()}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 12 } }, border: { display: false } },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { color: '#9ca3af', font: { size: 12 }, callback: (val: any) => `R ${(val / 1000).toFixed(0)}k` },
        border: { display: false },
      },
    },
  };

  const maxSales = topProducts.length ? Math.max(...topProducts.map((p) => p.totalSold)) : 1;

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading || (isFetching && !summary)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-pulse">
          <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{fetchError}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Shop Manager Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastUpdated}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="hidden sm:flex">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="rounded-xl shadow-sm border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${card.accent}`}>{card.icon}</div>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${card.positive ? 'text-green-600' : 'text-red-500'}`}>
                    {card.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {card.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Chart + Top Products */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800">Sales — Last 7 Days</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Daily revenue in Rands</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-xs text-gray-500">Revenue</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-[260px]">
                {weeklySales.length > 0
                  ? <Line data={chartData} options={chartOptions as any} />
                  : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No sales data available</div>
                }
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-gray-800">Top Selling Products</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Units sold this week</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {topProducts.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No data available</p>
                : (
                  <ul className="space-y-3">
                    {topProducts.map((product, idx) => (
                      <li key={product.productName} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150 group">
                        <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-800 truncate pr-2 group-hover:text-green-700 transition-colors">
                              {product.productName}
                            </p>
                            <span className="text-xs font-semibold text-gray-700 flex-shrink-0">{product.totalSold}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${(product.totalSold / maxSales) * 100}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              }
            </CardContent>
          </Card>
        </section>

        {/* Recent Orders + Alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800">Recent Orders</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Latest customer activity</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 px-3">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {recentOrders.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No recent orders</p>
                : (
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {['Order ID', 'Customer', 'Total', 'Status'].map((h) => (
                            <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentOrders.map((order) => (
                          <tr key={order.orderId} className="hover:bg-gray-50 transition-colors duration-150 group">
                            <td className="py-3 px-2 font-mono text-xs text-gray-500 group-hover:text-green-700 transition-colors">
                              #{order.orderId}
                            </td>
                            <td className="py-3 px-2 font-medium text-gray-800">{order.customerName}</td>
                            <td className="py-3 px-2 font-semibold text-gray-900">R {order.total.toLocaleString()}</td>
                            <td className="py-3 px-2"><StatusBadge status={order.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800">Alerts</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Needs your attention</p>
                </div>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-5 px-1.5">{errorCount}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {flatAlerts.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No alerts right now</p>
                : (
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {flatAlerts.map((alert) => (
                      <AlertCard key={alert.id} title={alert.title} message={alert.message} type={alert.type} time={alert.time} />
                    ))}
                  </div>
                )
              }
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}