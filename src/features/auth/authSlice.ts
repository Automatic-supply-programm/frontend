import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { mockUser } from '../../api/mockData';

const TOKEN_KEY = 'wh_token';
const IS_MOCK = import.meta.env.VITE_MOCK === 'true';

interface AuthState {
  token: string | null;
  user: User | null;
}

const initialState: AuthState = IS_MOCK
  ? { token: 'mock-token', user: mockUser }
  : { token: localStorage.getItem(TOKEN_KEY), user: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      if (!IS_MOCK) localStorage.setItem(TOKEN_KEY, action.payload);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      if (!IS_MOCK) localStorage.removeItem(TOKEN_KEY);
    },
  },
});

export const { setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
