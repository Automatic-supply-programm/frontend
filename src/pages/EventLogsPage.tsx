import { useState } from 'react';
import { Table, Input, Select, Button, Row, Col, Typography, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useGetEventLogsQuery, useGetEventLogTypesQuery } from '../features/eventLogs/eventLogsApi';
import { useGetAdminUsersQuery } from '../features/users/usersApi';
import type { EventLog, Role } from '../types';
import { ROLE_LABELS } from '../utils/statusLabels';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function EventLogsPage() {
  const location = useLocation();
  const initialSearch = (location.state as { search?: string } | null)?.search ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [eventType, setEventType] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { data: logs = [], isLoading } = useGetEventLogsQuery({
    search: search || undefined,
    userId: userId || undefined,
    userRole: userRole || undefined,
    eventType: eventType || undefined,
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });

  const { data: eventTypes = [] } = useGetEventLogTypesQuery();
  const { data: users = [] } = useGetAdminUsersQuery();

  const userOptions = users.map((u) => ({ value: u.id, label: u.fullName }));
  const eventTypeOptions = eventTypes.map((t) => ({ value: t, label: t }));
  const roleOptions = Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }));

  const handleReset = () => {
    setSearch('');
    setUserId('');
    setUserRole('');
    setEventType('');
    setDateRange(null);
  };

  const columns = [
    {
      title: 'Дата и время',
      key: 'timestamp',
      width: 160,
      render: (_: unknown, r: EventLog) => {
        const d = r.timestamp ?? r.createdAt;
        return d ? dayjs(d).format('DD.MM.YYYY HH:mm:ss') : '—';
      },
    },
    { title: 'Пользователь', dataIndex: 'userFullName', key: 'userFullName', width: 180 },
    {
      title: 'Роль',
      dataIndex: 'userRole',
      key: 'userRole',
      width: 130,
      render: (v: Role) => v ? ROLE_LABELS[v] ?? v : '—',
    },
    { title: 'Тип события', dataIndex: 'eventType', key: 'eventType', width: 140 },
    { title: 'Объект', dataIndex: 'objectType', key: 'objectType', width: 110 },
    { title: '№ объекта', dataIndex: 'objectNumber', key: 'objectNumber', width: 110 },
    { title: 'Описание', dataIndex: 'description', key: 'description' },
    {
      title: 'Результат',
      dataIndex: 'result',
      key: 'result',
      width: 110,
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 20 }}>Журнал событий</Typography.Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10} md={6}>
          <Input
            placeholder="Поиск"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={7} md={5}>
          <Select
            placeholder="Пользователь"
            value={userId || undefined}
            onChange={setUserId}
            allowClear
            showSearch
            filterOption={(input, opt) =>
              (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
            options={userOptions}
          />
        </Col>
        <Col xs={12} sm={7} md={4}>
          <Select
            placeholder="Роль"
            value={userRole || undefined}
            onChange={setUserRole}
            allowClear
            style={{ width: '100%' }}
            options={roleOptions}
          />
        </Col>
        <Col xs={12} sm={7} md={4}>
          <Select
            placeholder="Тип события"
            value={eventType || undefined}
            onChange={setEventType}
            allowClear
            style={{ width: '100%' }}
            options={eventTypeOptions}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: '100%' }}
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              } else {
                setDateRange(null);
              }
            }}
          />
        </Col>
        <Col xs={12} sm={6} md={2}>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>Сбросить</Button>
        </Col>
      </Row>

      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 30, showSizeChanger: false }}
        locale={{ emptyText: 'Нет событий' }}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
