# Solutions

## 1. Component & state architecture

The guiding rule: **state belongs at the narrowest scope that satisfies its
requirements.** The comparison feature uses three homes.

| State | Lives in | Why |
|---|---|---|
| Filters (stores, date range) | **URL** | Must survive reload *and* be shareable |
| Fetched revenue data | **Redux** (`comparisonSlice`) | Has a lifecycle: loading, error, retry, stale-response arbitration |
| Store list, chart hover | **`useState`** | Single consumer, no lifecycle |

**Why the URL.** The task asks for two things — filters must survive a reload, and
produce a shareable link. One mechanism satisfies both: the filters survive a reload
because they were never in memory, and the address bar already is the shareable
link. `useComparisonFilters` wraps `useSearchParams` and stores plain strings rather
than `Dayjs` objects, so values round-trip cleanly; `Dayjs` is constructed only
where Ant Design's `RangePicker` demands it. Malformed or inverted ranges from a
hand-edited URL fall back to defaults.

**The stale-response guard**  Latency is randomised 300–1500 ms, so responses arrive out of order:

```
t=0ms     select store A  →  request A starts (1400ms)
t=200ms   select store B  →  request B starts (400ms)
t=600ms   B arrives       →  grid shows B ✓
t=1400ms  A arrives       →  grid shows A ✗   wrong data, no error
```

Each `pending` records `action.meta.requestId`; `fulfilled` and `rejected` refuse to
write unless they still own it. Superseded requests are also aborted, and
`action.meta.aborted` is checked so a deliberate cancellation never surfaces as a
user-facing error — which would otherwise fire on every mount under StrictMode.

---

## 2. Chart implementation

### Challenges

I encountered a few challenges while implementing the chart, particularly due to some D3 concepts that were new to me. However, the official documentation was comprehensive and helped me understand the library's APIs and resolve the issues I faced.

### Prior Experience

My experience with D3 primarily comes from personal projects, so a significant part of this task involved learning as I went. It was a valuable opportunity to deepen my understanding of D3 and its approach to data visualization.

---

## 3. User experience & styling

- All states handled: empty, error (with Retry), and loading
- API fails ~5% of requests intentionally → error handling tested regularly
- Layout width increased from 900px to 1440px (grid needed more space)
- Column minimum width trimmed to 750px
- Responsive behavior:
  - Chart height: 420px above 992px, 330px below
  - Card padding tightens on smaller screens
  - Axis labels shorten based on available space
- Formatting:
  - Currency/numbers/dates use shared `format` helpers (e.g. `18.357,04 €`)
  - Percentages use tabular numerals for alignment
- `pctChange` typed as `number | null` (not `0`) when no prior data exists
  - Displayed as `—`, sorted to bottom

---

## 4. Performance

- Memoization applied where recomputation was expensive or caused cascading re-renders:
  - `buildComparisonRows` → avoids aggregating up to 5 stores × 90 days per render
  - `layoutFor(width)` → prevents SVG rebuild on every render
  - `series` / `dates` → avoids reshaping dataset repeatedly
  - `columnDefs` / `defaultColDef` → prevents AG Grid from rebuilding columns
  - `useSeriesColors` → keeps color slot assignment stable
  - `presets` / `options` → keeps "Last 7 days" accurate to render time


---

## 5. Codebase review

### Fixed

| Issue | Impact | Fix |
|---|---|---|
| **Timezone bug** — `toISOString()` returned UTC while a comment claimed local | Revenue on the wrong calendar day, disagreeing with the server | `storeLocalDate()` reads the offset-bearing string directly |
| **Legend colours mismatched** — `SERIES` and `LEGEND` ordered differently, both indexing `COLORS[i]` | Chart actively mislabeled every line | Colour keyed off the method, so the two cannot drift |
| **Chart rebuilt every render** — no dependency array | Wasted work, leaked tooltip `<div>`s | Real dependencies declared |
| **Fixed 640×320 charts** | Dead space, overlapping date labels | Container-measured; ticks thinned |
| **`Promise<unknown>` API layer** | No type safety, casts at call sites | Properly typed |
| **No 401 handling, no timeout** | Expired token = permanently broken session | Response interceptor clears credentials; 10 s timeout |
| **AG Grid registration as import side effect** | Works only by bundle luck; breaks under lazy loading | Moved to `main.tsx` |


### Further improvements

- Adopt RTK Query for the data layer (replace manual thunk, request guard, loading/error state)
- Add caching to avoid refetching previously selected store/date combinations
- Add pagination to the transaction list
- Complete full mobile responsiveness