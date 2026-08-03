import { configureStore } from '@reduxjs/toolkit';
import auth from './slices/authSlice';
import comparison from './slices/comparisonSlice';
import filters from './slices/filtersSlice';
import transactions from './slices/transactionsSlice';

export const store = configureStore({
  reducer: {
    auth,
    comparison,
    filters,
    transactions,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;