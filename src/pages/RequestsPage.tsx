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
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const skipAdmin = user?.role !== 'ADMIN';
  const skipWorker = user?.role !== 'WORKER';
  const skipEmployee = user?.role !== 'EMPLOYEE';
  const skipManager = user?.role !== 'MANAGER';

  const { data: allRequests = [], isLoading: loadingAll } = useGetAllRequestsQuery(
    { archived: showArchived || undefined, search: search || undefined, type: typeFilter || undefined, status: statusFilter || undefined },
    { skip: skipAdmin }
  );
  const { data: myRequests = [], isLoading: loadingMy } = useGetMyRequestsQuery(
    { archived: showArchived },
    { skip: skipEmployee }
  );
  const { data: incomingWorker = [], isLoading: loadingIncomingW } = useGetIncomingRequestsQuery(
    { type: typeFilter || undefined, status: statusFilter || undefined },
    { skip: skipWorker }
  );
  const { data: incomingManager = [], isLoading: loadingIncomingM } = useGetIncomingRequestsQuery(
    { type: typeFilter || undefined, status: statusFilter || undefined },
    { skip: skipManager }
  );

  if (!user) return null;

  const { data, loading } = (() => {
    if (user.role === 'ADMIN') return { data: allRequests, loading: loadingAll };
    if (user.role === 'WORKER') return { data: incomingWorker, loading: loadingIncomingW };
    if (user.role === 'EMPLOYEE') return { data: myRequests, loading: loadingMy };
    return { data: incomingManager, loading: loadingIncomingM };
  })();

  const allowedTypes = user.role === 'WORKER' ? WORKER_TYPES
    : user.role === 'EMPLOYEE' ? EMPLOYEE_TYPES
    : ADMIN_TYPES;

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
        showAdd={true}
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      />

      <RequestModal
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        userRole={user.role}
      />

      <CreateRequestForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        allowedTypes={allowedTypes}
      />
    </div>
  );
}
