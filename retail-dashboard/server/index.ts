/**
 * REST API Endpoints:
 *   POST /api/login                     — fake auth, returns token + user
 *   GET  /api/stores                    — all stores
 *   GET  /api/stores/:id                — one store
 *   GET  /api/transactions              — ?storeId=&from=&to=&limit=
 *   GET  /api/daily-revenue             — ?storeIds=s01,s02&from=&to=
 *                                         revenue per store per local calendar
 *                                         day, aggregated server-side
 *
 * Simulated conditions on purpose:
 *   • every request is delayed by 300–1500 ms
 *   • ~5% of data requests fail with a 500
 * 
 * Candidate Notes:
 * No need to fix issues in the server, handling should be in the Front end.
 */
import express from 'express';
import cors from 'cors';
import { STORES, USERS, allTransactions, localDateOf, type SeedTransaction } from './seed.ts';

const PORT = 4000;
const app = express();
app.use(cors());
app.use(express.json());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (min: number, max: number) => min + Math.random() * (max - min);

// Injected on purpose: latency on everything
app.use(async (_req, _res, next) => {
  await sleep(jitter(300, 1500));
  next();
});

// Injected on purpose: 5% failure on data endpoints (login excluded)
app.use('/api', (req, res, next) => {
  const exempt = req.path === '/login';
  if (!exempt && Math.random() < 0.05) {
    res.status(500).json({ error: 'Upstream data warehouse timeout (simulated)' });
    return;
  }
  next();
});

// Helpers
function inRange(t: SeedTransaction, from?: string, to?: string): boolean {
  const d = localDateOf(t);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

// Auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({
    token: `fake-token-${user.id}`,
    user: { id: user.id, username: user.username, displayName: user.displayName },
  });
});

// Stores
app.get('/api/stores', (_req, res) => {
  res.json(STORES.map(({ sizeFactor, lateNightShare, ...pub }) => pub));
});

app.get('/api/stores/:id', (req, res) => {
  const store = STORES.find((s) => s.id === req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Store not found' });
    return;
  }
  const { sizeFactor, lateNightShare, ...pub } = store;
  res.json(pub);
});

// Transactions
// GET /api/transactions?storeId=s01&from=2026-06-01&to=2026-06-30&limit=500
app.get('/api/transactions', (req, res) => {
  const storeId = req.query.storeId ? String(req.query.storeId) : undefined;
  if (!storeId) {
    res.status(400).json({ error: 'storeId is required' });
    return;
  }
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  let rows = allTransactions().filter((t) => t.storeId === storeId && inRange(t, from, to));
  rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)); // newest first
  if (limit && Number.isFinite(limit)) rows = rows.slice(0, limit);
  res.json(rows);
});

// Daily revenue (aggregated server-side, by local calendar day)
// GET /api/daily-revenue?storeIds=s01,s02&from=2026-06-01&to=2026-06-30
app.get('/api/daily-revenue', (req, res) => {
  const storeIds = String(req.query.storeIds ?? '')
    .split(',')
    .filter(Boolean);
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  if (!storeIds.length || !from || !to) {
    res.status(400).json({ error: 'storeIds, from and to are required' });
    return;
  }

  const wanted = new Set(storeIds);
  const buckets = new Map<string, { date: string; storeId: string; revenue: number; transactions: number }>();
  for (const t of allTransactions()) {
    if (!wanted.has(t.storeId) || !inRange(t, from, to)) continue;
    const date = localDateOf(t);
    const key = `${t.storeId}|${date}`;
    let b = buckets.get(key);
    if (!b) {
      b = { date, storeId: t.storeId, revenue: 0, transactions: 0 };
      buckets.set(key, b);
    }
    b.revenue = Math.round((b.revenue + t.amount) * 100) / 100;
    b.transactions += 1;
  }
  const out = [...buckets.values()].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.storeId.localeCompare(b.storeId)
  );
  res.json(out);
});

app.listen(PORT, () => {
  const txCount = allTransactions().length;
  console.log(`[mock] listening on http://localhost:${PORT}`);
  console.log(`[mock] seeded ${STORES.length} stores, ${txCount} transactions (90 days)`);
  console.log(`[mock] chaos enabled: 300-1500ms latency, 5% errors`);
});
