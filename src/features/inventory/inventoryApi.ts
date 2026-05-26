import { baseApi } from '../../api/baseApi';

export interface InventoryEntry {
  materialId: string;
  materialName: string;
  unit: string;
  quantity: number;
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductionLineInventory: builder.query<InventoryEntry[], void>({
      query: () => '/inventory/production-line',
      transformResponse: (r: { data: InventoryEntry[] }) => r.data ?? [],
    }),
  }),
});

export const { useGetProductionLineInventoryQuery } = inventoryApi;
