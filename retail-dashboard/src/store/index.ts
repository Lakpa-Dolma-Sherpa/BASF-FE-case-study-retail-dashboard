import { combineReducers, configureStore } from '@reduxjs/toolkit';
import auth, { loggedOut } from './slices/authSlice';
import comparison from './slices/comparisonSlice';
import filters from './slices/filtersSlice';
import transactions from './slices/transactionsSlice';

const appReducer = combineReducers({
  auth,
  comparison,
  filters,
  transactions,
});

const rootReducer: typeof appReducer = (state, action) =>
  appReducer(action.type === loggedOut.type ? undefined : state, action);

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
