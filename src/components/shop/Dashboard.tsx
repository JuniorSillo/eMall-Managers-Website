'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  User,
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  accent: string;
}

interface Order {
  id: string;
  customer: string;
  total: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface TopProduct {
  name: string;
  unitsSold: number;
  category: string;
  trend: 'up' | 'down';
}

interface Alert {
  id: number;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const SALES_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SALES_DATA = [3200, 4100, 3800, 5200, 4700, 6300, 5800];

const SUMMARY_CARDS: SummaryCard[] = [
  {
    label: "Today's Sales",
    value: 'R 5,842',
    change: '+12.4%',
    positive: true,
    icon: <CircleDollarSign className="h-5 w-5" />,
    accent: 'text-green-600',
  },
  {
    label: 'Orders Today',
    value: '38',
    change: '+5 from yesterday',
    positive: true,
    icon: <ShoppingCart className="h-5 w-5" />,
    accent: 'text-blue-600',
  },
  {
    label: 'Total Products',
    value: '214',
    change: '+3 added this week',
    positive: true,
    icon: <Package className="h-5 w-5" />,
    accent: 'text-violet-600',
  },
  {
    label: 'Low Stock Items',
    value: '7',
    change: '2 critical',
    positive: false,
    icon: <AlertTriangle className="h-5 w-5" />,
    accent: 'text-red-500',
  },
];

const TOP_PRODUCTS: TopProduct[] = [
  { name: 'Wireless Earbuds Pro', unitsSold: 142, category: 'Electronics', trend: 'up' },
  { name: 'Running Sneakers — White/Black', unitsSold: 118, category: 'Footwear', trend: 'up' },
  { name: 'Moisturising Face Cream 50ml', unitsSold: 97, category: 'Skincare', trend: 'down' },
  { name: 'Stainless Steel Water Bottle', unitsSold: 84, category: 'Lifestyle', trend: 'up' },
  { name: 'Yoga Mat — Eco Series', unitsSold: 73, category: 'Fitness', trend: 'up' },
  { name: 'Laptop Stand Adjustable', unitsSold: 61, category: 'Electronics', trend: 'down' },
];

const RECENT_ORDERS: Order[] = [
  { id: '#ORD-4821', customer: 'Sipho Dlamini', total: 'R 349.00', status: 'completed' },
  { id: '#ORD-4820', customer: 'Amara Osei', total: 'R 1,120.50', status: 'pending' },
  { id: '#ORD-4819', customer: 'Liam van Wyk', total: 'R 89.99', status: 'completed' },
  { id: '#ORD-4818', customer: 'Zanele Mokoena', total: 'R 560.00', status: 'cancelled' },
  { id: '#ORD-4817', customer: 'Ravi Pillay', total: 'R 2,300.00', status: 'completed' },
  { id: '#ORD-4816', customer: 'Hannah Botha', total: 'R 445.75', status: 'pending' },
];

const ALERTS: Alert[] = [
  {
    id: 1,
    type: 'error',
    title: 'Critical Low Stock',
    message: '"Wireless Earbuds Pro" has only 2 units left.',
    time: '5 min ago',
  },
  {
    id: 2,
    type: 'warning',
    title: 'Low Stock',
    message: '"Yoga Mat — Eco Series" is down to 5 units.',
    time: '22 min ago',
  },
  {
    id: 3,
    type: 'warning',
    title: 'Pending Return',
    message: 'Order #ORD-4801 has a return request awaiting review.',
    time: '1 hr ago',
  },
  {
    id: 4,
    type: 'error',
    title: 'Payment Failed',
    message: 'Order #ORD-4810 payment of R 780.00 could not be processed.',
    time: '2 hr ago',
  },
  {
    id: 5,
    type: 'info',
    title: 'New Review',
    message: 'Your shop received a 5-star review on "Running Sneakers".',
    time: '3 hr ago',
  },
];

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Order['status'] }) {
  const config = {
    completed: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
  const config = {
    error: {
      border: 'border-l-red-500',
      icon: 'text-red-500',
      bg: 'bg-red-50',
    },
    warning: {
      border: 'border-l-amber-500',
      icon: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    info: {
      border: 'border-l-blue-500',
      icon: 'text-blue-500',
      bg: 'bg-blue-50',
    },
  };

  const c = config[alert.type];

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border border-l-4 ${c.border} ${c.bg} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${c.icon}`}>
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{alert.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{alert.message}</p>
        <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ──────────────────────────────────────────────────

export default function RetailManagerDashboardd() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('Just now');
    }, 1200);
  };

  // Chart.js config
  const chartData = {
    labels: SALES_LABELS,
    datasets: [
      {
        label: 'Sales (R)',
        data: SALES_DATA,
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
        callbacks: {
          label: (ctx: any) => ` R ${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 12 } },
        border: { display: false },
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: {
          color: '#9ca3af',
          font: { size: 12 },
          callback: (val: any) => `R ${(val / 1000).toFixed(0)}k`,
        },
        border: { display: false },
      },
    },
  };

  const maxSales = Math.max(...SALES_DATA);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Shop Manager Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastUpdated}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="hidden sm:flex"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            
            
          </div>
        </div>
      </header>

      {/* ── Page Body ──────────────────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Summary Cards ──────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY_CARDS.map((card) => (
            <Card
              key={card.label}
              className="rounded-xl shadow-sm border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${card.accent}`}>
                    {card.icon}
                  </div>
                  <span
                    className={`text-xs font-medium flex items-center gap-0.5 ${
                      card.positive ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {card.positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {card.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* ── Main Grid: Chart + Top Products ────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Sales Chart */}
          <Card className="lg:col-span-2 rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Sales — Last 7 Days
                  </CardTitle>
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
                <Line data={chartData} options={chartOptions as any} />
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-gray-800">
                Top Selling Products
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Units sold this week</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ul className="space-y-3">
                {TOP_PRODUCTS.map((product, idx) => (
                  <li
                    key={product.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150 group"
                  >
                    {/* Rank */}
                    <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Bar + Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-800 truncate pr-2 group-hover:text-green-700 transition-colors">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {product.trend === 'up' ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                          )}
                          <span className="text-xs font-semibold text-gray-700">
                            {product.unitsSold}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(product.unitsSold / maxSales) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* ── Bottom Grid: Orders + Alerts ───────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Orders Table */}
          <Card className="lg:col-span-2 rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Recent Orders
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Latest customer activity</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={() => {}}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Order ID
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Customer
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Total
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {RECENT_ORDERS.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors duration-150 group"
                      >
                        <td className="py-3 px-2 font-mono text-xs text-gray-500 group-hover:text-green-700 transition-colors">
                          {order.id}
                        </td>
                        <td className="py-3 px-2 font-medium text-gray-800">
                          {order.customer}
                        </td>
                        <td className="py-3 px-2 font-semibold text-gray-900">
                          {order.total}
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Panel */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Alerts
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Needs your attention</p>
                </div>
                <Badge
                  variant="destructive"
                  className="text-xs h-5 px-1.5"
                >
                  {ALERTS.filter((a) => a.type === 'error').length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {ALERTS.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}