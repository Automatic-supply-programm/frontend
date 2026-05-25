import { Row, Col, Card, Statistic, Table, Typography, Button, Space, Spin, Tag, message } from 'antd';
import {
  TeamOutlined,
  InboxOutlined,
  FileTextOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetDashboardQuery, useGetDashboardRecentQuery } from '../features/dashboard/dashboardApi';
import { useGetMyRequestsQuery, useGetIncomingRequestsQuery, useChangeRequestStatusMutation } from '../features/requests/requestsApi';
import dayjs from 'dayjs';
import { ROLE_LABELS, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLOR, REQUEST_TYPE_LABELS, EVENT_TYPE_LABELS, RESULT_LABELS } from '../utils/statusLabels';
import { getApiErrorMessage } from '../utils/apiError';
import type { Request, RequestType, RequestStatus, EventLog } from '../types';

type RecentRow = Record<string, unknown>;
type CardItem = { title: string; value: number | string; icon: React.ReactNode; color: string; suffix?: string };

const { Title } = Typography;

interface DashboardStats {
  // ADMIN
  totalUsers?: number;
  activeUsers?: number;
  totalMaterials?: number;
  activeRequests?: number;
  deficitMaterials?: number;
  deficitCount?: number;
  // WORKER
  pendingRequests?: number;
  pendingReceipts?: number;
  warehouseId?: string;
  productionLineIds?: string[];
  // EMPLOYEE
  myRequests?: number;
  underConsideration?: number;
  waitingConfirmation?: number;
  rejected?: number;
  // MANAGER
  totalReplenishment?: number;
  pendingApproval?: number;
  approved?: number;
  managedWarehouseIds?: string[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: dashData, isLoading } = useGetDashboardQuery();
  const isAdmin = user?.role === 'ADMIN';
  const isWorker = user?.role === 'WORKER';
  const { data: recentData, isLoading: recentLoading } = useGetDashboardRecentQuery(
    { limit: 10 }, { skip: !isAdmin && !isWorker }
  );
  const { data: myRequests = [], isLoading: myLoading } = useGetMyRequestsQuery(
    {}, { skip: isAdmin || user?.role === 'WORKER' || user?.role === 'MANAGER' }
  );
  const isManager = user?.role === 'MANAGER';
  const { data: incomingRequests = [], isLoading: incomingLoading } = useGetIncomingRequestsQuery(
    isManager ? { type: 'REPLENISHMENT' } : {},
    { skip: isAdmin || user?.role === 'EMPLOYEE' }
  );

  const [changeStatusMutation] = useChangeRequestStatusMutation();
  const changeStatus = async (args: { id: string; status: RequestStatus }) => {
    try {
      await changeStatusMutation(args).unwrap();
      message.success('Статус обновлён');
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Ошибка при изменении статуса'));
    }
  };

  if (!user) return null;
  const stats = (dashData ?? {}) as DashboardStats;

  const renderCards = () => {
    if (user.role === 'ADMIN') {
      return [
        {
          title: 'Пользователи',
          value: stats.totalUsers ?? '—',
          suffix: stats.activeUsers !== undefined ? ` / ${stats.activeUsers} акт.` : '',
          icon: <TeamOutlined />,
          color: '#1677ff',
        },
        { title: 'Материалов на складе', value: stats.totalMaterials ?? '—', icon: <InboxOutlined />, color: '#722ed1' },
        { title: 'Активных заявок', value: stats.activeRequests ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
        { title: 'Дефицит', value: stats.deficitMaterials ?? stats.deficitCount ?? '—', icon: <WarningOutlined />, color: '#f5222d' },
      ];
    }
    if (user.role === 'WORKER') {
      return [
        { title: 'Заявки на обеспечение', value: stats.pendingRequests ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
        { title: 'Поступления', value: stats.pendingReceipts ?? '—', icon: <InboxOutlined />, color: '#1677ff' },
        { title: 'Материалов на складе', value: stats.totalMaterials ?? '—', icon: <InboxOutlined />, color: '#722ed1' },
        { title: 'Дефицит', value: stats.deficitMaterials ?? stats.deficitCount ?? '—', icon: <WarningOutlined />, color: '#f5222d' },
      ];
    }
    if (user.role === 'EMPLOYEE') {
      return [
        { title: 'Всего активных заявок', value: stats.myRequests ?? '—', icon: <FileTextOutlined />, color: '#1677ff' },
        { title: 'На рассмотрении', value: stats.underConsideration ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
        { title: 'Ожидают подтверждения', value: stats.waitingConfirmation ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
        { title: 'Отклонено', value: stats.rejected ?? '—', icon: <WarningOutlined />, color: '#f5222d' },
      ];
    }
    // MANAGER
    return [
      { title: 'Заявки на пополнение', value: stats.totalReplenishment ?? '—', icon: <FileTextOutlined />, color: '#1677ff' },
      { title: 'На рассмотрении', value: stats.pendingApproval ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
      { title: 'Одобрено', value: stats.approved ?? '—', icon: <FileTextOutlined />, color: '#52c41a' },
      { title: 'Отклонено', value: stats.rejected ?? '—', icon: <WarningOutlined />, color: '#f5222d' },
      { title: 'Дефицит материалов', value: stats.deficitMaterials ?? stats.deficitCount ?? '—', icon: <WarningOutlined />, color: '#f5222d' },
    ];
  };

  const requestColumns = [
    { title: '№', key: 'number', width: 110,
      render: (_: unknown, r: Request) => r.number ?? r.requestNumber ?? r.id?.slice(-6) ?? '—' },
    { title: 'Тип', dataIndex: 'type', key: 'type', width: 140,
      render: (v: RequestType) => REQUEST_TYPE_LABELS[v] ?? v },
    { title: 'Дата', key: 'createdDate', width: 130,
      render: (_: unknown, r: Request) => {
        const d = r.createdDate ?? r.createdAt;
        return d ? dayjs(d).format('DD.MM.YYYY') : '—';
      } },
    { title: 'Статус', dataIndex: 'status', key: 'status', width: 170,
      render: (v: RequestStatus) => (
        <Tag color={REQUEST_STATUS_COLOR[v] ?? 'default'}>{REQUEST_STATUS_LABELS[v] ?? v}</Tag>
      ) },
    ...(isManager ? [{
      title: '',
      key: 'managerActions',
      width: 160,
      render: (_: unknown, r: Request) => {
        if (r.status !== 'UNDER_CONSIDERATION') return null;
        return (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              onClick={(e) => { e.stopPropagation(); changeStatus({ id: r.id, status: 'APPROVED' }); }}
            >
              Одобрить
            </Button>
            <Button
              size="small"
              danger
              onClick={(e) => { e.stopPropagation(); changeStatus({ id: r.id, status: 'REJECTED' }); }}
            >
              Отклонить
            </Button>
          </Space>
        );
      },
    }] : []),
  ];

  const adminEventColumns = [
    { title: 'Дата и время', key: 'timestamp', width: 160,
      render: (_: unknown, r: RecentRow) => {
        const d = (r.timestamp ?? r.createdAt) as string | undefined;
        return d ? dayjs(d).format('DD.MM.YYYY HH:mm') : '—';
      } },
    { title: 'Пользователь', dataIndex: 'userFullName', key: 'userFullName' },
    { title: 'Роль', dataIndex: 'userRole', key: 'userRole',
      render: (v: string) => v ? ROLE_LABELS[v as keyof typeof ROLE_LABELS] ?? v : '—' },
    { title: 'Событие', dataIndex: 'description', key: 'description' },
  ];

  const workerEventColumns = [
    { title: 'Дата и время', key: 'timestamp', width: 160,
      render: (_: unknown, r: EventLog) => {
        const d = r.timestamp ?? r.createdAt;
        return d ? dayjs(d).format('DD.MM.YYYY HH:mm') : '—';
      } },
    { title: 'Материал', key: 'materialName', width: 180,
      render: (_: unknown, r: EventLog) => r.materialName ?? '—' },
    { title: 'Тип операции', key: 'eventType', width: 160,
      render: (_: unknown, r: EventLog) => EVENT_TYPE_LABELS[r.eventType] ?? r.eventType },
    { title: 'Количество', key: 'quantity', width: 100,
      render: (_: unknown, r: EventLog) => r.quantity != null ? r.quantity : '—' },
    { title: 'Документ', key: 'objectNumber', width: 160,
      render: (_: unknown, r: EventLog) => r.objectNumber ?? '—' },
    { title: 'Статус', key: 'result', width: 160,
      render: (_: unknown, r: EventLog) => r.result ? (RESULT_LABELS[r.result] ?? r.result) : '—' },
  ];

  const quickLinks = () => {
    if (user.role === 'ADMIN') return [
      { label: 'Пользователи', path: '/users', state: undefined },
      { label: 'Склад', path: '/warehouse', state: undefined },
      { label: 'Журнал событий', path: '/event-logs', state: undefined },
      { label: 'Заявки', path: '/requests', state: undefined },
    ];
    if (user.role === 'WORKER') return [
      { label: 'Склад', path: '/warehouse', state: undefined },
      { label: 'Обработать заявки на выдачу', path: '/requests', state: { typeFilter: 'ISSUE', statusFilter: 'UNDER_CONSIDERATION' } },
      { label: 'Оформить поступление', path: '/requests', state: { openCreate: true, defaultType: 'RECEIPT' } },
      { label: 'Создать заявку на пополнение', path: '/requests', state: { openCreate: true, defaultType: 'REPLENISHMENT' } },
    ];
    if (user.role === 'EMPLOYEE') return [
      { label: 'Мои заявки', path: '/requests', state: undefined },
    ];
    return [
      { label: 'Склад', path: '/warehouse', state: undefined },
      { label: 'Заявки на пополнение', path: '/requests', state: undefined },
      { label: 'Пользователи', path: '/users', state: undefined },
    ];
  };

  const cards = renderCards() as CardItem[];
  type QuickLink = { label: string; path: string; state?: unknown };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Главная</Title>

      {user.role === 'WORKER' && !isLoading && (stats.warehouseId || stats.productionLineIds?.length) && (
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            {stats.warehouseId && (
              <span><Typography.Text type="secondary">Склад:</Typography.Text>{' '}
                <Tag color="blue">{stats.warehouseId}</Tag>
              </span>
            )}
            {stats.productionLineIds && stats.productionLineIds.length > 0 && (
              <span><Typography.Text type="secondary">Производственные участки:</Typography.Text>{' '}
                {stats.productionLineIds.map((id) => <Tag key={id}>{id}</Tag>)}
              </span>
            )}
          </Space>
        </Card>
      )}

      {user.role === 'MANAGER' && !isLoading && stats.managedWarehouseIds && stats.managedWarehouseIds.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <Typography.Text type="secondary">Подконтрольные склады:</Typography.Text>
            {stats.managedWarehouseIds.map((id) => <Tag key={id} color="purple">{id}</Tag>)}
          </Space>
        </Card>
      )}

      {isLoading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {cards.map((card) => (
            <Col key={card.title} xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title={card.title}
                  value={card.value}
                  suffix={card.suffix}
                  prefix={<span style={{ color: card.color }}>{card.icon}</span>}
                  styles={{ content: { color: card.color } }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {(user.role === 'ADMIN' || user.role === 'WORKER') && (
        <Card
          title={user.role === 'ADMIN' ? 'Последние действия пользователей' : 'Последние складские операции'}
          style={{ marginBottom: 24 }}
        >
          {recentLoading ? (
            <Spin />
          ) : user.role === 'WORKER' ? (
            <Table
              dataSource={Array.isArray(recentData) ? recentData as unknown as EventLog[] : []}
              columns={workerEventColumns as Parameters<typeof Table>[0]['columns']}
              rowKey={(r) => String((r as EventLog).id ?? Math.random())}
              size="small"
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              locale={{ emptyText: 'Нет данных' }}
            />
          ) : (
            <Table
              dataSource={Array.isArray(recentData) ? recentData as RecentRow[] : []}
              columns={adminEventColumns as Parameters<typeof Table>[0]['columns']}
              rowKey={(r) => String((r as RecentRow).id ?? Math.random())}
              size="small"
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              locale={{ emptyText: 'Нет данных' }}
            />
          )}
        </Card>
      )}

      {(user.role === 'WORKER' || user.role === 'MANAGER') && (
        <Card title="Входящие заявки" style={{ marginBottom: 24 }}>
          {incomingLoading ? (
            <Spin />
          ) : (
            <Table
              dataSource={incomingRequests.slice(0, 10)}
              columns={requestColumns as Parameters<typeof Table>[0]['columns']}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: 'Нет входящих заявок' }}
            />
          )}
        </Card>
      )}

      {user.role === 'EMPLOYEE' && (
        <Card title="Мои актуальные заявки" style={{ marginBottom: 24 }}>
          {myLoading ? (
            <Spin />
          ) : (
            <Table
              dataSource={myRequests.slice(0, 10)}
              columns={requestColumns as Parameters<typeof Table>[0]['columns']}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: 'Нет заявок' }}
            />
          )}
        </Card>
      )}

      <Card title="Быстрый переход">
        <Space wrap>
          {(quickLinks() as QuickLink[]).map((link) => (
            <Button
              key={link.label}
              type="default"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(link.path, { state: link.state })}
            >
              {link.label}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
