import dayjs from 'dayjs';
import type { DailyRevenuePoint, Store } from '@/types/domain';

export const DATE_FORMAT = 'YYYY-MM-DD';

export interface ComparisonRow {
  storeId: string;
  storeName: string;
  city: string;
  totalRevenue: number;
  totalTransactions: number;
  avgBasket: number;
  /** null when the previous period has no revenue — undefined growth, not flat growth. */
  pctChange: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The equally-long period ending the day before `from`.
 * "1–7 Aug" (7 days) yields "25–31 Jul".
 */
export function previousPeriod(from: string, to: string): { from: string; to: string } {
  const days = dayjs(to).diff(dayjs(from), 'day') + 1;
  const prevTo = dayjs(from).subtract(1, 'day');
  const prevFrom = prevTo.subtract(days - 1, 'day');
  return { from: prevFrom.format(DATE_FORMAT), to: prevTo.format(DATE_FORMAT) };
}

interface StoreTotals {
  revenue: number;
  transactions: number;
}

/** Collapse per-store-per-day rows into one total per store. */
export function aggregateByStore(points: DailyRevenuePoint[]): Map<string, StoreTotals> {
  const totals = new Map<string, StoreTotals>();
  for (const p of points) {
    const acc = totals.get(p.storeId) ?? { revenue: 0, transactions: 0 };
    acc.revenue += p.revenue;
    acc.transactions += p.transactions;
    totals.set(p.storeId, acc);
  }
  return totals;
}

/**
 * One row per selected store, comparing the current period against the
 * previous one. Stores with no data in range still get a row (all zeroes)
 * so the user sees the store they picked rather than a silently shorter table.
 */
export function buildComparisonRows(
  current: DailyRevenuePoint[],
  previous: DailyRevenuePoint[],
  stores: Store[],
  selectedIds: string[]
): ComparisonRow[] {
  const cur = aggregateByStore(current);
  const prev = aggregateByStore(previous);
  const storesById = new Map(stores.map((s) => [s.id, s]));

  return selectedIds.map((id) => {
    const store = storesById.get(id);
    const c = cur.get(id) ?? { revenue: 0, transactions: 0 };
    const p = prev.get(id) ?? { revenue: 0, transactions: 0 };

    return {
      storeId: id,
      storeName: store?.name ?? id,
      city: store?.city ?? '—',
      totalRevenue: round2(c.revenue),
      totalTransactions: c.transactions,
      avgBasket: c.transactions ? round2(c.revenue / c.transactions) : 0,
      pctChange: p.revenue > 0 ? ((c.revenue - p.revenue) / p.revenue) * 100 : null,
    };
  });
}
