import { baseApi } from '../../api/baseApi';
import type { Request, CreateRequestPayload, RequestStatus } from '../../types';

interface RequestsFilter {
  archived?: boolean;
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sourceId?: string;
}

export const requestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Для EMPLOYEE — свои заявки
    getMyRequests: builder.query<Request[], { archived?: boolean }>({
      query: ({ archived = false } = {}) => `/requests?archived=${archived}`,
      providesTags: ['Request'],
    }),
    // Для ADMIN — все заявки
    getAllRequests: builder.query<Request[], RequestsFilter>({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.archived !== undefined) q.set('archived', String(params.archived));
        if (params.search) q.set('search', params.search);
        if (params.type) q.set('type', params.type);
        if (params.status) q.set('status', params.status);
        if (params.startDate) q.set('startDate', params.startDate);
        if (params.endDate) q.set('endDate', params.endDate);
        if (params.sourceId) q.set('sourceId', params.sourceId);
        return `/requests/all?${q.toString()}`;
      },
      providesTags: ['Request'],
    }),
    // Для WORKER и MANAGER — входящие заявки
    getIncomingRequests: builder.query<Request[], RequestsFilter>({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.type) q.set('type', params.type);
        if (params.status) q.set('status', params.status);
        if (params.startDate) q.set('startDate', params.startDate);
        if (params.endDate) q.set('endDate', params.endDate);
        if (params.sourceId) q.set('sourceId', params.sourceId);
        return `/requests/incoming?${q.toString()}`;
      },
      providesTags: ['Request'],
    }),
    createRequest: builder.mutation<Request, CreateRequestPayload>({
      query: (body) => ({ url: '/requests', method: 'POST', body }),
      invalidatesTags: ['Request', 'Dashboard'],
    }),
    updateRequest: builder.mutation<Request, { id: string; data: Partial<CreateRequestPayload> }>({
      query: ({ id, data }) => ({ url: `/requests/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Request'],
    }),
    changeRequestStatus: builder.mutation<void, { id: string; status: RequestStatus; comment?: string }>({
      query: ({ id, status, comment }) => {
        const q = new URLSearchParams({ status });
        if (comment) q.set('comment', comment);
        return { url: `/requests/${id}/status?${q.toString()}`, method: 'POST' };
      },
      invalidatesTags: ['Request', 'Dashboard', 'Material'],
    }),
    confirmRequest: builder.mutation<void, string>({
      query: (id) => ({ url: `/requests/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['Request', 'Dashboard', 'Material', 'Inventory'],
    }),
    archiveRequest: builder.mutation<void, string>({
      query: (id) => ({ url: `/requests/${id}/archive`, method: 'POST' }),
      invalidatesTags: ['Request', 'Dashboard'],
    }),
  }),
});

export const {
  useGetMyRequestsQuery,
  useGetAllRequestsQuery,
  useGetIncomingRequestsQuery,
  useCreateRequestMutation,
  useUpdateRequestMutation,
  useChangeRequestStatusMutation,
  useConfirmRequestMutation,
  useArchiveRequestMutation,
} = requestsApi;
