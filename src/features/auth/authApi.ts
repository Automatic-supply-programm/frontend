import { baseApi } from '../../api/baseApi';
import type { LoginRequest, User } from '../../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Бэкенд возвращает { message, data: "token_string" }
    // baseQuery разворачивает .data → тип становится string
    login: builder.mutation<string, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/user/me',
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
