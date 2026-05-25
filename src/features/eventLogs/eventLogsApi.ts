import { baseApi } from '../../api/baseApi';
import type { EventLog } from '../../types';

interface EventLogsFilter {
  userId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const eventLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEventLogs: builder.query<EventLog[], EventLogsFilter>({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.userId) q.set('userId', params.userId);
        if (params.eventType) q.set('eventType', params.eventType);
        if (params.startDate) q.set('startDate', params.startDate);
        if (params.endDate) q.set('endDate', params.endDate);
        if (params.search) q.set('search', params.search);
        return `/event-logs?${q.toString()}`;
      },
      providesTags: ['EventLog'],
    }),
    getEventLogTypes: builder.query<string[], void>({
      query: () => '/event-logs/types',
    }),
    getManagerEventLogs: builder.query<EventLog[], { startDate?: string; endDate?: string }>({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.startDate) q.set('startDate', params.startDate);
        if (params.endDate) q.set('endDate', params.endDate);
        return `/manager/event-logs?${q.toString()}`;
      },
      providesTags: ['EventLog'],
    }),
  }),
});

export const {
  useGetEventLogsQuery,
  useGetEventLogTypesQuery,
  useGetManagerEventLogsQuery,
} = eventLogsApi;
