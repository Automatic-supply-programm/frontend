import { Row, Col, Card, Statistic, Table, Typography, Button, Space, Spin } from 'antd';
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
import { useGetMyRequestsQuery, useGetIncomingRequestsQuery } from '../features/requests/requestsApi';
import dayjs from 'dayjs';
import { ROLE_LABELS, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLOR, REQUEST_TYPE_LABELS } from '../utils/statusLabels';
import { Tag } from 'antd';
import type { Request, RequestType, RequestStatus } from '../types';

type RecentRow = Record<string, unknown>;

const { Title } = Typography;

interface DashboardStats {
  // ADMIN
  totalUsers?: number;
  activeUsers?: number;
  totalMaterials?: number;
  activeRequests?: number;
  deficitMaterials?: number;    // backend field name
  deficitCount?: number;        // alias
  // WORKER
  pendingRequests?: number;     // backend: all incoming requests
  // EMPLOYEE
  myRequests?: number;          // backend field name
  underConsideration?: number;
  // MANAGER
  pendingApproval?: number;     // backend field name
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: dashData, isLoading } = useGetDashboardQuery();
  const isAdmin = user?.role === 'ADMIN';
  const { data: recentData, isLoading: recentLoading } = useGetDashboardRecentQuery(
    { limit: 10 }, { skip: !isAdmin }
  );
  const { data: myRequests = [], isLoading: myLoading } = useGetMyRequestsQuery(
    {}, { skip: isAdmin || user?.role === 'WORKER' || user?.role === 'MANAGER' }
  );
  const { data: incomingRequests = [], isLoading: incomingLoading } = useGetIncomingRequestsQuery(
    {}, { skip: isAdmin || user?.role === 'EMPLOYEE' }
  );

  if (!user) return null;
  const stats = (dashData ?? {}) as DashboardStats;

  const renderCards = () => {
    if (user.role === 'ADMIN') {
      return [
        { title: 'Пользователей всего', value: stats.totalUsers ?? '—', icon: <TeamOutlined />, color: '#1677ff' },
        { title: 'Активных пользователей', value: stats.activeUsers ?? '—', icon: <TeamOutlined />, color: '#52c41a' },
        { title: 'Материалов на складе', value: stats.totalMaterials ?? '—', icon: <InboxOutlined />, color: '#722ed1' },
        { title: 'Активных заявок', value: stats.activeRequests ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
        { title: 'Дефицит', value: stats.deficitMaterials ?? stats.deficitCount ?? '—', icon: <WarningOutlined />, color: '#f5222d' },
      ];
    }
    if (user.role === 'WORKER') {
      return [
        { title: 'Входящих заявок', value: stats.pendingRequests ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
        { title: 'Материалов на складе', value: stats.totalMaterials ?? '—', icon: <InboxOutlined />, color: '#722ed1' },
        { title: 'Дефицит', value: stats.deficitMaterials ?? stats.deficitCount ?? '—', icon: <WarningOutlined />, color: '#f5222d' },
      ];
    }
    if (user.role === 'EMPLOYEE') {
      return [
        { title: 'Всего моих заявок', value: stats.myRequests ?? '—', icon: <FileTextOutlined />, color: '#1677ff' },
        { title: 'На рассмотрении', value: stats.underConsideration ?? '—', icon: <FileTextOutlined />, color: '#fa8c16' },
      ];
    }
    // MANAGER
    return [
      { title: 'Входящих заявок', value: stats.pendingApproval ?? '—', icon: <FileTextOutlined />, color: '#1677ff' },
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

  const quickLinks = () => {
    if (user.role === 'ADMIN') return [
      { label: 'Пользователи', path: '/users' },
      { label: 'Склад', path: '/warehouse' },
      { label: 'Журнал событий', path: '/event-logs' },
      { label: 'Заявки', path: '/requests' },
    ];
    if (user.role === 'WORKER') return [
      { label: 'Перейти к складу', path: '/warehouse' },
      { label: 'Обработать заявки', path: '/requests' },
    ];
    if (user.role === 'EMPLOYEE') return [
      { label: 'Мои заявки', path: '/requests' },
    ];
    return [
      { label: 'Склад', path: '/warehouse' },
      { label: 'Заявки на пополнение', path: '/requests' },
      { label: 'Пользователи', path: '/users' },
    ];
  };

  const cards = renderCards();

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Главная</Title>

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
                  prefix={<span style={{ color: card.color }}>{card.icon}</span>}
                  styles={{ content: { color: card.color } }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {user.role === 'ADMIN' && (
        <Card title="Последние действия пользователей" style={{ marginBottom: 24 }}>
          {recentLoading ? (
            <Spin />
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
          {quickLinks().map((link) => (
            <Button
              key={link.path}
              type="default"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
