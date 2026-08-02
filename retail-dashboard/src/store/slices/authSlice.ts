import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/domain';

interface AuthState {
  user: User | null;
  token: string | null;
}

function loadInitial(): AuthState {
  try {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    if (token && raw) {
      return { token, user: JSON.parse(raw) as User };
    }
  } catch {
    // corrupted storage — start logged out
  }
  return { user: null, token: null };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitial(),
  reducers: {
    loggedIn(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loggedOut(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { loggedIn, loggedOut } = authSlice.actions;
export default authSlice.reducer;