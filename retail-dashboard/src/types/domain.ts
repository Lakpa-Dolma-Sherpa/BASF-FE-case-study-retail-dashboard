export interface Store {
  id: string;
  name: string;
  city: string;
  region: 'North' | 'South' | 'East' | 'West';
  openedAt: string; // ISO date
}

export type PaymentMethod = 'card' | 'cash' | 'mobile';

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  card: '#2f54eb',
  mobile: '#08979c',
  cash: '#d48806',
};

export interface Transaction {
  id: string;
  storeId: string;
  /** ISO datetime WITH timezone offset, e.g. "2026-06-12T23:41:00+02:00" */
  timestamp: string;
  amount: number; // EUR
  items: number;
  paymentMethod: PaymentMethod;
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