import { baseApi } from '../../api/baseApi';
import type { Material, MaterialBatch, CreateMaterialRequest } from '../../types';

interface MaterialsFilter {
  archived?: boolean;
  search?: string;
  category?: string;
  warehouseId?: string;
  status?: string;
}

export const materialsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaterials: builder.query<Material[], MaterialsFilter>({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.archived !== undefined) q.set('archived', String(params.archived));
        if (params.search) q.set('search', params.search);
        if (params.category) q.set('category', params.category);
        if (params.warehouseId) q.set('warehouseId', params.warehouseId);
        if (params.status) q.set('status', params.status);
        return `/materials?${q.toString()}`;
      },
      providesTags: ['Material'],
    }),
    getMaterial: builder.query<Material, string>({
      query: (id) => `/materials/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Material', id }],
    }),
    getDeficitMaterials: builder.query<Material[], void>({
      query: () => '/materials/deficit',
      providesTags: ['Material'],
    }),
    createMaterial: builder.mutation<Material, CreateMaterialRequest>({
      query: (body) => ({ url: '/materials', method: 'POST', body }),
      invalidatesTags: ['Material'],
    }),
    updateMaterial: builder.mutation<Material, { id: string; data: Partial<CreateMaterialRequest> }>({
      query: ({ id, data }) => ({ url: `/materials/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Material', id }, 'Material'],
    }),
    archiveMaterial: builder.mutation<void, string>({
      query: (id) => ({ url: `/materials/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Material'],
    }),
    addBatch: builder.mutation<Material, { id: string; batch: Partial<MaterialBatch> }>({
      query: ({ id, batch }) => ({ url: `/materials/${id}/batch`, method: 'POST', body: batch }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Material', id }, 'Material'],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialQuery,
  useGetDeficitMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useArchiveMaterialMutation,
  useAddBatchMutation,
} = materialsApi;
