export interface User {
  id: number;
  username: string;
  name: string;
  surname: string;
  email: string;
  contacts: string;
  gender: string;
  type: string;
}

export interface UserResponse {
  roleID: number;
  user: {
    uName: string;
    uSurname: string;
    uGender: string;
    uPhone: string;
    uEmail: string;
    uType: string;
  };
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  token?: string;
  data?: any;
}

export interface RegisterManagerData {
  name: string;
  surname: string;
  gender: string;
  contacts: string;
  email: string;
  password?: string; // Made optional for updateManager
  type: string;
  username?: string;
}

export interface Shop {
  id: number;
  shopName: string;
  shopType: string;
  mangrID: number;
  mallID: number;
  managerName: string;
  shopImage?: string;
  imageBase64?: string;
}

export interface Mall {
  mallID: number;
  mallName: string;
  mallAddr: string;
  mallContacts: string;
  mallImage?: string;
  imageBase64?: string;
}

export interface Product {
  id: number;
  prod_Name: string;
  prod_Desc: string;
  prod_Categ: string;
  prod_Subcateg: string;
  price: number;
  prod_Weight: string;
  quantity: number;
  shopId: number;
  imageUrl?: string;
  onSaleOffer?: string;
  type: string;
  variants?: { id: number; size: string; color: string; colorPic: string; quantity: number }[];
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  todayRevenue: number;
  todayOrders: number;
  totalProducts: number;
  lowStockCount: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface WeeklySale {
  day: string;
  revenue: number;
}

export interface TopProduct {
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface RecentOrder {
  orderId: number;
  customerName: string;
  total: number;
  status: string;
}

export interface DashboardAlerts {
  lowStock: { message: string; type: string }[];
  pendingReturns: { message: string; type: string }[];
  paymentFailed: { message: string; type: string }[];
}

// ─── Reports Types ────────────────────────────────────────────────────────────

export interface ReportDateParams {
  range?: 'today' | 'thisWeek' | 'thisMonth' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface SalesSummary {
  totalRevenue: number;
  ordersCompleted: number;
  averageOrderValue: number;
  topProduct: string;
}

export interface SalesTrendItem {
  month: string;
  thisYear: number;
  lastYear: number;
}

export interface SalesTopProduct {
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface SalesBestSeller {
  rank: number;
  productName: string;
  revenue: number;
  units: number;
  growth: number;
}