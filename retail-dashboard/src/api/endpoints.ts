import { api } from './client';
import type { DailyRevenuePoint, Store, Transaction, User } from '@/types/domain';

export interface LoginResponse {
  token: string;
  user: User;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/login', { username, password });
  return res.data;
}

export async function fetchStores(config?: { signal?: AbortSignal }): Promise<Store[]> {
  const res = await api.get<Store[]>('/stores', { signal: config?.signal });
  return res.data;
}

export async function fetchTransactions(params: {
  storeId: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<Transaction[]> {
  const res = await api.get<Transaction[]>('/transactions', { params });
  return res.data;
}

export async function fetchDailyRevenue(
  params: { storeIds: string[]; from: string; to: string },
  config?: { signal?: AbortSignal }
): Promise<DailyRevenuePoint[]> {
  const res = await api.get<DailyRevenuePoint[]>('/daily-revenue', {
    params: { ...params, storeIds: params.storeIds.join(',') },
    signal: config?.signal,
  });
  return res.data;
}
