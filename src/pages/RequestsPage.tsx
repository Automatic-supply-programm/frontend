import { useState } from 'react';
import { Typography } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import {
  useGetMyRequestsQuery,
  useGetAllRequestsQuery,
  useGetIncomingRequestsQuery,
} from '../features/requests/requestsApi';
import RequestsTable from '../components/requests/RequestsTable';
import RequestModal from '../components/requests/RequestModal';
import CreateRequestForm from '../components/requests/CreateRequestForm';
import type { Request, RequestType } from '../types';

const WORKER_TYPES: RequestType[] = ['REPLENISHMENT', 'RECEIPT'];
const EMPLOYEE_TYPES: RequestType[] = ['ISSUE', 'RETURN'];
const ADMIN_TYPES: RequestType[] = ['ISSUE', 'REPLENISHMENT', 'RECEIPT', 'RETURN'];

export default function RequestsPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const skipAdmin = user?.role !== 'ADMIN';
  const skipWorker = user?.role !== 'WORKER';
  const skipEmployee = user?.role !== 'EMPLOYEE';
  const skipManager = user?.role !== 'MANAGER';

  const { data: allRequests = [], isLoading: loadingAll } = useGetAllRequestsQuery(
    {
      archived: showArchived || undefined,
      search: search || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      sourceId: sourceId || undefined,
      startDate: dateRange?.[0],
      endDate: dateRange?.[1],
    },
    { skip: skipAdmin }
  );
  const { data: myRequests = [], isLoading: loadingMy } = useGetMyRequestsQuery(
    { archived: showArchived },
    { skip: skipEmployee && skipWorker }
  );
  const { data: incomingWorker = [], isLoading: loadingIncomingW } = useGetIncomingRequestsQuery(
    { type: typeFilter || undefined, status: statusFilter || undefined, sourceId: sourceId || undefined, startDate: dateRange?.[0], endDate: dateRange?.[1] },
    { skip: skipWorker }
  );
  const { data: incomingManager = [], isLoading: loadingIncomingM } = useGetIncomingRequestsQuery(
    { type: typeFilter || undefined, status: statusFilter || undefined, sourceId: sourceId || undefined, startDate: dateRange?.[0], endDate: dateRange?.[1] },
    { skip: skipManager }
  );

  if (!user) return null;

  const { data, loading } = (() => {
    if (user.role === 'ADMIN') return { data: allRequests, loading: loadingAll };
    if (user.role === 'WORKER') {
      // WORKER видит как входящие (ISSUE/RETURN от участков), так и свои созданные (RECEIPT/REPLENISHMENT)
      const combined = [...incomingWorker];
      myRequests.forEach((r) => {
        if (!combined.find((c) => c.id === r.id)) combined.push(r);
      });
      return { data: combined, loading: loadingIncomingW || loadingMy };
    }
    if (user.role === 'EMPLOYEE') return { data: myRequests, loading: loadingMy };
    return { data: incomingManager, loading: loadingIncomingM };
  })();

  const allowedTypes = user.role === 'WORKER' ? WORKER_TYPES
    : user.role === 'EMPLOYEE' ? EMPLOYEE_TYPES
    : user.role === 'MANAGER' ? ([] as RequestType[])
    : ADMIN_TYPES;

  const canCreate = user.role !== 'MANAGER';

  const pageTitle = user.role === 'MANAGER' ? 'Заявки и поступления'
    : user.role === 'WORKER' ? 'Заявки и поступления'
    : 'Заявки';

  const filteredData = data.filter((r) => {
    if (search) {
      const s = search.toLowerCase();
      const num = (r.number ?? r.requestNumber ?? r.id ?? '').toLowerCase();
      const mat = (r.items ?? []).map((i) => i.materialName).join(' ').toLowerCase();
      const requester = (r.requesterName ?? r.createdByName ?? '').toLowerCase();
      if (!num.includes(s) && !mat.includes(s) && !requester.includes(s)) return false;
    }
    if (typeFilter && r.type !== typeFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 20 }}>{pageTitle}</Typography.Title>

      <RequestsTable
        data={filteredData}
        loading={loading}
        onRowClick={setSelectedRequest}
        onAdd={() => setShowCreate(true)}
        showAdd={canCreate}
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sourceFilter={sourceId}
        onSourceChange={setSourceId}
        sourceFilterLabel={user.role === 'WORKER' ? 'Участок (ID)' : 'Склад (ID)'}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      />

      <RequestModal
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        userRole={user.role}
        onEdit={() => { setEditingRequest(selectedRequest); setSelectedRequest(null); }}
      />

      {canCreate && allowedTypes.length > 0 && (
        <CreateRequestForm
          open={showCreate}
          onClose={() => setShowCreate(false)}
          allowedTypes={allowedTypes}
        />
      )}

      {editingRequest && (
        <CreateRequestForm
          open={!!editingRequest}
          onClose={() => setEditingRequest(null)}
          allowedTypes={allowedTypes.length > 0 ? allowedTypes : ['ISSUE', 'REPLENISHMENT', 'RECEIPT', 'RETURN']}
          editRequest={editingRequest}
        />
      )}
    </div>
  );
}
