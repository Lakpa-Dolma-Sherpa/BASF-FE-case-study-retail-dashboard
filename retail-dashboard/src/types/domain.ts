export interface Store {
  id: string;
  name: string;
  city: string;
  region: 'North' | 'South' | 'East' | 'West';
  openedAt: string; // ISO date
}

export interface Transaction {
  id: string;
  storeId: string;
  /** ISO datetime WITH timezone offset, e.g. "2026-06-12T23:41:00+02:00" */
  timestamp: string;
  amount: number; // EUR
  items: number;
  paymentMethod: 'card' | 'cash' | 'mobile';
}

export interface DailyRevenuePoint {
  date: string; // YYYY-MM-DD
  storeId: string;
  revenue: number;
  transactions: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
}