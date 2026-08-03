import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchDailyRevenue } from '@/api/endpoints';
import { previousPeriod } from '@/utils/comparison';
import type { DailyRevenuePoint } from '@/types/domain';

interface ComparisonState {
  current: DailyRevenuePoint[];
  previous: DailyRevenuePoint[];
  loading: boolean;
  error: string | null;
  /** Request that owns the current state; anything older is discarded. */
  requestId: string | null;
}

const initialState: ComparisonState = {
  current: [],
  previous: [],
  loading: false,
  error: null,
  requestId: null,
};

export interface LoadComparisonArgs {
  storeIds: string[];
  from: string;
  to: string;
}

/**
 * Fetches the selected range and the equally-long range before it, so the
 * grid can show period-over-period change. Both go out in parallel — with
 * 300–1500ms of injected latency, sequencing them would double the wait.
 */
export const loadComparison = createAsyncThunk(
  'comparison/load',
  async ({ storeIds, from, to }: LoadComparisonArgs, { signal }) => {
    const prev = previousPeriod(from, to);
    const [current, previous] = await Promise.all([
      fetchDailyRevenue({ storeIds, from, to }, { signal }),
      fetchDailyRevenue({ storeIds, from: prev.from, to: prev.to }, { signal }),
    ]);
    return { current, previous };
  }
);

const comparisonSlice = createSlice({
  name: 'comparison',
  initialState,
  reducers: {
    cleared() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadComparison.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(loadComparison.fulfilled, (state, action) => {
        // Responses can arrive out of order because latency is randomised:
        // a slow request for store A can land after a fast one for store B
        // and overwrite it. Only the newest request may write to state.
        if (state.requestId !== action.meta.requestId) return;
        state.current = action.payload.current;
        state.previous = action.payload.previous;
        state.loading = false;
      })
      .addCase(loadComparison.rejected, (state, action) => {
        if (action.meta.aborted) return;
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = 'Could not load comparison data.';
      });
  },
});

export const { cleared } = comparisonSlice.actions;
export default comparisonSlice.reducer;
