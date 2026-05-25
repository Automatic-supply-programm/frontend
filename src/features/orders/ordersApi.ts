import { baseApi } from '../../api/baseApi';
import type { Order } from '../../types';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], { all?: boolean } | void>({
      query: (params) => `/orders${params?.all ? '?all=true' : ''}`,
      providesTags: ['Order'],
    }),
    createOrder: builder.mutation<Order, Partial<Order>>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    updateOrder: builder.mutation<Order, { id: string; data: Partial<Order> }>({
      query: ({ id, data }) => ({ url: `/orders/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Order'],
    }),
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;
