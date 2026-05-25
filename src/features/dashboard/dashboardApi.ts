import { baseApi } from '../../api/baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<Record<string, unknown>, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    getDashboardRecent: builder.query<Record<string, unknown>[], { limit?: number }>({
      query: ({ limit = 10 } = {}) => `/dashboard/recent?limit=${limit}`,
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardQuery, useGetDashboardRecentQuery } = dashboardApi;
