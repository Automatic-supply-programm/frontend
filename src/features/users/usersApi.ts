import { baseApi } from '../../api/baseApi';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<User[], void>({
      query: () => '/admin/users',
      providesTags: ['User'],
    }),
    getManagerUsers: builder.query<User[], void>({
      query: () => '/manager/users',
      providesTags: ['User'],
    }),
    // Справочник пользователей по роли — доступен всем авторизованным
    getUsersDirectory: builder.query<User[], string | void>({
      query: (role) => role ? `/user/list?role=${role}` : '/user/list',
      providesTags: ['User'],
    }),
    // Справочник складов (уникальные warehouseId из профилей активных WORKER'ов)
    getWarehousesDirectory: builder.query<Array<{ warehouseId: string; workerName: string; workerId: string }>, void>({
      query: () => '/user/warehouses',
      providesTags: ['User'],
    }),
    // Справочник производственных участков (уникальные productionLineId из профилей активных EMPLOYEE)
    getProductionLinesDirectory: builder.query<string[], void>({
      query: () => '/user/production-lines',
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({ url: `/admin/users/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<void, { id: string; newPassword: string }>({
      query: ({ id, newPassword }) => ({
        url: `/admin/users/${id}/change-password?newPassword=${encodeURIComponent(newPassword)}`,
        method: 'POST',
      }),
    }),
    toggleUserAccess: builder.mutation<void, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `/admin/users/${id}/toggle?active=${active}`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useGetManagerUsersQuery,
  useGetUsersDirectoryQuery,
  useGetWarehousesDirectoryQuery,
  useGetProductionLinesDirectoryQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangePasswordMutation,
  useToggleUserAccessMutation,
  useDeleteUserMutation,
} = usersApi;
