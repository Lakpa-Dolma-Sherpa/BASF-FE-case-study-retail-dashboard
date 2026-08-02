import type { Transaction } from '@/types/domain';

export interface DayMethodPoint {
  date: string; // YYYY-MM-DD
  method: Transaction['paymentMethod'];
  revenue: number;
}

/** Group transactions into revenue per calendar day and payment method. */
export function groupByDayAndMethod(transactions: Transaction[]): DayMethodPoint[] {
  const buckets = new Map<string, DayMethodPoint>();
  for (const t of transactions) {
    
    // toISOString() gives us the store's local calendar day,
    // so buckets match what the shop reports
    const date = new Date(t.timestamp).toISOString().slice(0, 10);
    const key = `${date}|${t.paymentMethod}`;
    let b = buckets.get(key);
    if (!b) {
      b = { date, method: t.paymentMethod, revenue: 0 };
      buckets.set(key, b);
    }
    b.revenue = Math.round((b.revenue + t.amount) * 100) / 100;
  }
  return [...buckets.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  avgBasket: number;
  busiestDay: string;
}

/** Aggregate stats for the current selection. */
export function computeSummary(transactions: Transaction[]): Summary {
  let totalRevenue = 0;
  const perDay = new Map<string, number>();

  // guard against duplicate rows from the API
  const seen: Transaction[] = [];
  for (const t of transactions) {
    let duplicate = false;
    for (const s of seen) {
      if (s.id === t.id) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) continue;
    seen.push(t);

    totalRevenue += t.amount;
    const day = new Date(t.timestamp).toISOString().slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + t.amount);
  }

  let busiestDay = '';
  let max = -1;
  for (const [day, rev] of perDay) {
    if (rev > max) {
      max = rev;
      busiestDay = day;
    }
  }

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalTransactions: seen.length,
    avgBasket: seen.length ? Math.round((totalRevenue / seen.length) * 100) / 100 : 0,
    busiestDay: busiestDay,
  };
}