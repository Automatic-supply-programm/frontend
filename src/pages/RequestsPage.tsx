import { useState, useEffect } from 'react';
import { Typography, message } from 'antd';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState } from '../app/store';
import {
  useGetMyRequestsQuery,
  useGetAllRequestsQuery,
  useGetIncomingRequestsQuery,
  useChangeRequestStatusMutation,
  useConfirmRequestMutation,
} from '../features/requests/requestsApi';
import RequestsTable from '../components/requests/RequestsTable';
import RequestModal from '../components/requests/RequestModal';
import CreateRequestForm from '../components/requests/CreateRequestForm';
import type { Request, RequestType } from '../types';
import { getApiErrorMessage } from '../utils/apiError';

type ArchiveMode = 'active' | 'all' | 'only';

const WORKER_TYPES: RequestType[] = ['REPLENISHMENT', 'RECEIPT'];
const EMPLOYEE_TYPES: RequestType[] = ['ISSUE', 'RETURN'];
const ADMIN_TYPES: RequestType[] = ['ISSUE', 'REPLENISHMENT', 'RECEIPT', 'RETURN'];

interface NavState {
  typeFilter?: string;
  statusFilter?: string;
  openCreate?: boolean;
  defaultType?: string;
}

export default function RequestsPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const location = useLocation();
  const navState = (location.state as NavState | null) ?? {};

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(navState.typeFilter ?? '');
  const [statusFilter, setStatusFilter] = useState(navState.statusFilter ?? '');
  const [sourceId, setSourceId] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>('active');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [showCreate, setShowCreate] = useState(!!navState.openCreate);
  const [createDefaultType, setCreateDefaultType] = useState<RequestType | undefined>(
    navState.defaultType as RequestType | undefined
  );

  // Сбрасываем location.state, чтобы не применялся при повторном заходе
  useEffect(() => {
    window.history.replaceState({}, '');
  }, []);

  const includeArchived = archiveMode !== 'active';

  const skipAdmin = user?.role !== 'ADMIN';
  const skipWorker = user?.role !== 'WORKER';
  const skipEmployee = user?.role !== 'EMPLOYEE';
  const skipManager = user?.role !== 'MANAGER';

  const { data: allRequests = [], isLoading: loadingAll } = useGetAllRequestsQuery(
    {
      archived: includeArchived || undefined,
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
    { archived: includeArchived },
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

  const [changeStatusMutation] = useChangeRequestStatusMutation();
  const [confirmMutation] = useConfirmRequestMutation();

  const handleInlineAction = async (action: () => Promise<void>, successMsg: string) => {
    try {
      await action();
      message.success(successMsg);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Ошибка при выполнении действия'));
    }
  };

  const onInlineApprove = (req: Request) =>
    handleInlineAction(() => changeStatusMutation({ id: req.id, status: 'APPROVED' }).unwrap(), 'Заявка одобрена');
  const onInlineReject = (req: Request) =>
    handleInlineAction(() => changeStatusMutation({ id: req.id, status: 'REJECTED' }).unwrap(), 'Заявка отклонена');
  const onInlineAccept = (req: Request) =>
    handleInlineAction(() => changeStatusMutation({ id: req.id, status: 'ACCEPTED' }).unwrap(), 'Заявка принята');
  const onInlineCancel = (req: Request) =>
    handleInlineAction(() => changeStatusMutation({ id: req.id, status: 'CANCELLED' }).unwrap(), 'Заявка отменена');
  const onInlineConfirm = (req: Request) =>
    handleInlineAction(() => confirmMutation(req.id).unwrap(), 'Получение подтверждено');

  if (!user) return null;

  const { data, loading } = (() => {
    if (user.role === 'ADMIN') return { data: allRequests, loading: loadingAll };
    if (user.role === 'WORKER') {
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

  const pageTitle = user.role === 'MANAGER' || user.role === 'WORKER'
    ? 'Заявки и поступления'
    : 'Заявки';

  const filteredData = data.filter((r) => {
    if (archiveMode === 'only' && !r.archived) return false;
    if (archiveMode === 'active' && r.archived) return false;
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
        onAdd={() => { setCreateDefaultType(undefined); setShowCreate(true); }}
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
        archiveMode={archiveMode}
        onArchiveModeChange={setArchiveMode}
        userRole={user.role}
        onInlineApprove={onInlineApprove}
        onInlineReject={onInlineReject}
        onInlineAccept={onInlineAccept}
        onInlineCancel={onInlineCancel}
        onInlineEdit={(req) => { setEditingRequest(req); }}
        onInlineConfirm={onInlineConfirm}
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
          onClose={() => { setShowCreate(false); setCreateDefaultType(undefined); }}
          allowedTypes={allowedTypes}
          defaultType={createDefaultType}
        />
      )}

      {editingRequest && (
        <CreateRequestForm
          open={!!editingRequest}
          onClose={() => setEditingRequest(null)}
          allowedTypes={allowedTypes.length > 0 ? allowedTypes : ADMIN_TYPES}
          editRequest={editingRequest}
        />
      )}
    </div>
  );
}
