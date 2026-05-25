import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';
import { mockBaseQuery } from './mockBaseQuery';

const IS_MOCK = import.meta.env.VITE_MOCK === 'true';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      // Бэкенд требует префикс Bearer_ (с подчёркиванием)
      headers.set('Authorization', `Bearer_${token}`);
    }
    return headers;
  },
});

// Бэкенд всегда возвращает { message: string | null, data: T }
// Разворачиваем data автоматически
const realBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.data && typeof result.data === 'object' && 'data' in result.data) {
    return { ...result, data: (result.data as { data: unknown }).data };
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: IS_MOCK ? mockBaseQuery : realBaseQuery,
  tagTypes: ['Material', 'Request', 'User', 'EventLog', 'Dashboard'],
  endpoints: () => ({}),
});
