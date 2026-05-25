import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import {
  mockUser, mockMaterials, mockRequests, mockUsers,
  mockEventLogs, mockDashboard, mockDashboardRecent, mockEventLogTypes,
} from './mockData';

type QueryArgs = string | { url: string; method?: string; body?: unknown };

const delay = () => new Promise((r) => setTimeout(r, 150));

export const mockBaseQuery: BaseQueryFn<QueryArgs> = async (args) => {
  await delay();

  const url = typeof args === 'string' ? args : args.url;
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET');

  // Auth
  if (url.includes('/auth/login')) return { data: { token: 'mock-token' } };
  if (url.includes('/auth/logout')) return { data: null };
  if (url.includes('/user/me')) return { data: mockUser };

  // Dashboard
  if (url.includes('/dashboard/recent')) return { data: mockDashboardRecent };
  if (url === '/dashboard' || url.startsWith('/dashboard?')) return { data: mockDashboard };

  // Materials
  if (url.includes('/materials/deficit')) {
    return { data: mockMaterials.filter((m) => m.status === 'CRITICAL' || m.status === 'OUT_OF_STOCK') };
  }
  if (url.match(/\/materials\/[^/?]+\/batch/)) return { data: mockMaterials[0] };
  if (url.match(/\/materials\/[^/?]+$/) && method === 'GET') {
    const id = url.split('/').pop()?.split('?')[0];
    return { data: mockMaterials.find((m) => m.id === id) ?? mockMaterials[0] };
  }
  if (url.startsWith('/materials') && method === 'GET') {
    const showArchived = url.includes('archived=true');
    return { data: showArchived ? mockMaterials : mockMaterials.filter((m) => !m.archived) };
  }
  if (url.startsWith('/materials') && (method === 'POST' || method === 'PUT')) return { data: mockMaterials[0] };
  if (url.startsWith('/materials') && method === 'DELETE') return { data: null };

  // Requests
  if (url.includes('/requests/all')) return { data: mockRequests };
  if (url.includes('/requests/incoming')) {
    return { data: mockRequests.filter((r) => ['REPLENISHMENT', 'RECEIPT', 'ISSUE', 'RETURN'].includes(r.type)) };
  }
  if (url.match(/\/requests\/[^/?]+\/status/)) return { data: null };
  if (url.match(/\/requests\/[^/?]+\/confirm/)) return { data: null };
  if (url.match(/\/requests\/[^/?]+$/) && method === 'PUT') return { data: mockRequests[0] };
  if (url.startsWith('/requests') && method === 'GET') return { data: mockRequests };
  if (url.startsWith('/requests') && method === 'POST') return { data: mockRequests[0] };

  // Users
  if (url.startsWith('/admin/users') && method === 'GET') return { data: mockUsers };
  if (url.startsWith('/manager/users')) return { data: mockUsers };
  if (url.includes('/admin/users') && method === 'POST') return { data: mockUsers[0] };
  if (url.includes('/admin/users') && method === 'PUT') return { data: mockUsers[0] };
  if (url.includes('/admin/users') && method === 'DELETE') return { data: null };
  if (url.includes('/change-password')) return { data: null };
  if (url.includes('/toggle')) return { data: null };

  // Event logs
  if (url.includes('/event-logs/types')) return { data: mockEventLogTypes };
  if (url.includes('/manager/event-logs')) return { data: mockEventLogs };
  if (url.startsWith('/event-logs')) return { data: mockEventLogs };

  console.warn('[mock] Unhandled URL:', url, method);
  return { data: null };
};
