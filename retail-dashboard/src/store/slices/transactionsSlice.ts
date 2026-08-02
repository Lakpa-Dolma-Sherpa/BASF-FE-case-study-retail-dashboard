import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchTransactions } from '@/api/endpoints';
import type { Transaction } from '@/types/domain';

interface TransactionsState {
  items: Transaction[];
  filtered: Transaction[];
  loading: boolean;
}

const initialState: TransactionsState = {
  items: [],
  filtered: [],
  loading: false,
};

export const loadTransactions = createAsyncThunk(
  'transactions/load',
  async (params: { storeId: string; from: string; to: string }) => {
    return fetchTransactions(params) as Promise<Transaction[]>;
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    filteredUpdated(state, action: PayloadAction<Transaction[]>) {
      state.filtered = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadTransactions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.filtered = action.payload;
        state.loading = false;
      });
  },
});

export const { filteredUpdated } = transactionsSlice.actions;
export default transactionsSlice.reducer;