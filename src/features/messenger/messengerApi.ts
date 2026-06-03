import { baseApi } from '../../api/baseApi';
import type { MessageItem } from './messengerSlice';

export const messengerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversation: builder.query<MessageItem[], string>({
      query: (userId) => `/messages/conversation/${userId}`,
    }),
    getUnreadCount: builder.query<{ total: number; bySender: Record<string, number> }, void>({
      query: () => '/messages/unread/count',
    }),
    markAsRead: builder.mutation<void, string>({
      query: (senderId) => ({ url: `/messages/read/${senderId}`, method: 'POST' }),
    }),
  }),
});

export const { useGetConversationQuery, useGetUnreadCountQuery, useMarkAsReadMutation } =
  messengerApi;
