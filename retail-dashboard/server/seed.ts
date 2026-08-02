/**
 * Mock backend data.
 *
 * Generates ~90 days of transactions for 10 stores. Data is seeded per
 * (store, date) so it is stable across server restarts for the same day.
 *
 * All timestamps are in German timezone (UTC+02:00 offset). 
 */

export interface SeedStore {
  id: string;
  name: string;
  city: string;
  region: 'North' | 'South' | 'East' | 'West';
  openedAt: string;
  /** relative size factor, drives revenue volume */
  sizeFactor: number;
  /** share of traffic in the 00:00–01:59 window */
  lateNightShare: number;
}

export interface SeedTransaction {
  id: string;
  storeId: string;
  timestamp: string; // example 2026-06-12T23:41:00+02:00
  amount: number;
  items: number;
  paymentMethod: 'card' | 'cash' | 'mobile';
}

export const STORES: SeedStore[] = [
  { id: 's01', name: 'Store Mitte',        city: 'Berlin',    region: 'East',  openedAt: '2018-03-01', sizeFactor: 1.35, lateNightShare: 0.18 },
  { id: 's02', name: 'Store Altona',       city: 'Hamburg',   region: 'North', openedAt: '2019-06-15', sizeFactor: 1.1,  lateNightShare: 0.12 },
  { id: 's03', name: 'Store Schwabing',    city: 'Munich',    region: 'South', openedAt: '2017-11-20', sizeFactor: 1.25, lateNightShare: 0.05 },
  { id: 's04', name: 'Store Ehrenfeld',    city: 'Cologne',   region: 'West',  openedAt: '2020-02-10', sizeFactor: 0.9,  lateNightShare: 0.15 },
  { id: 's05', name: 'Store Nordend',      city: 'Frankfurt', region: 'West',  openedAt: '2019-09-01', sizeFactor: 1.0,  lateNightShare: 0.08 },
  { id: 's06', name: 'Store Neustadt',     city: 'Dresden',   region: 'East',  openedAt: '2021-04-12', sizeFactor: 0.7,  lateNightShare: 0.2  },
  { id: 's07', name: 'Store Südstadt',     city: 'Hannover',  region: 'North', openedAt: '2020-08-25', sizeFactor: 0.75, lateNightShare: 0.06 },
  { id: 's08', name: 'Store Plagwitz',     city: 'Leipzig',   region: 'East',  openedAt: '2022-01-30', sizeFactor: 0.65, lateNightShare: 0.22 },
  { id: 's09', name: 'Store Weststadt',    city: 'Karlsruhe', region: 'South', openedAt: '2018-07-04', sizeFactor: 0.85, lateNightShare: 0.04 },
  { id: 's10', name: 'Store Hafencity',    city: 'Hamburg',   region: 'North', openedAt: '2023-05-18', sizeFactor: 1.05, lateNightShare: 0.1  },
];

export const USERS = [
  { id: 'u1', username: 'ops_maria', password: 'password123', displayName: 'Maria Ops' },
  { id: 'u2', username: 'analyst_bob', password: 'password123', displayName: 'Bob Analyst' },
];

/** days of history to generate, counting back from today (local) */
export const HISTORY_DAYS = 90;

// Deterministic PRNG (mulberry32) seeded from a string hash
// Stable across server restarts, but different for each (store, date) pair.
function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generation
const OFFSET = '+02:00';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** local date string N days before today */
function localDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekdayOf(dateStr: string): number {
  // 0 = Sunday … 6 = Saturday (offset-agnostic: date part only)
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

const METHODS: SeedTransaction['paymentMethod'][] = ['card', 'card', 'card', 'mobile', 'mobile', 'cash'];

function generateDay(store: SeedStore, dateStr: string): SeedTransaction[] {
  const rnd = mulberry32(hashString(`${store.id}|${dateStr}`));
  const weekday = weekdayOf(dateStr);
  const weekendBoost = weekday === 5 || weekday === 6 ? 1.35 : weekday === 0 ? 0.8 : 1.0;

  const count = Math.round((28 + rnd() * 40) * store.sizeFactor * weekendBoost);
  const txs: SeedTransaction[] = [];

  for (let i = 0; i < count; i++) {
    const lateNight = rnd() < store.lateNightShare;
    let hour: number;
    if (lateNight) {
      hour = rnd() < 0.5 ? 0 : 1; // 00:xx or 01:xx local
    } else {
      // business hours with an evening peak
      const r = rnd();
      hour = r < 0.25 ? 8 + Math.floor(rnd() * 4) : r < 0.6 ? 12 + Math.floor(rnd() * 5) : 17 + Math.floor(rnd() * 7); // up to 23
    }
    const minute = Math.floor(rnd() * 60);
    const amount = Math.round((6 + rnd() * rnd() * 140) * 100) / 100;
    const items = 1 + Math.floor(rnd() * rnd() * 11);

    txs.push({
      id: `${store.id}-${dateStr}-${i}`,
      storeId: store.id,
      timestamp: `${dateStr}T${pad(hour)}:${pad(minute)}:00${OFFSET}`,
      amount,
      items,
      paymentMethod: METHODS[Math.floor(rnd() * METHODS.length)],
    });
  }
  return txs;
}

/** Generate (and cache) the full dataset for the last HISTORY_DAYS days. */
let cache: SeedTransaction[] | null = null;
let cacheKey = '';

export function allTransactions(): SeedTransaction[] {
  const today = localDateNDaysAgo(0);
  if (cache && cacheKey === today) return cache;

  const txs: SeedTransaction[] = [];
  for (let n = HISTORY_DAYS - 1; n >= 0; n--) {
    const dateStr = localDateNDaysAgo(n);
    for (const store of STORES) {
      txs.push(...generateDay(store, dateStr));
    }
  }
  cache = txs;
  cacheKey = today;
  return txs;
}

/** Local calendar date of a transaction (the date the shop would report). */
export function localDateOf(t: SeedTransaction): string {
  return t.timestamp.slice(0, 10);
}
