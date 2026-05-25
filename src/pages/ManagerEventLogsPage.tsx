import { useState } from 'react';
import { Table, Button, Row, Col, Typography, DatePicker, Select, Input } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useGetManagerEventLogsQuery } from '../features/eventLogs/eventLogsApi';
import { useGetManagerUsersQuery } from '../features/users/usersApi';
import type { EventLog, Role } from '../types';
import { ROLE_LABELS } from '../utils/statusLabels';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ManagerEventLogsPage() {
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [eventType, setEventType] = useState('');
  const [userId, setUserId] = useState('');

  const { data: logs = [], isLoading } = useGetManagerEventLogsQuery({
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
    eventType: eventType || undefined,
    userId: userId || undefined,
  });

  const { data: users = [] } = useGetManagerUsersQuery();
  const userOptions = users.map((u) => ({ value: u.id, label: u.fullName }));

  const handleReset = () => {
    setDateRange(null);
    setEventType('');
    setUserId('');
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
    { title: 'Тип события', dataIndex: 'eventType', key: 'eventType', width: 160 },
    { title: 'Объект', dataIndex: 'objectType', key: 'objectType', width: 100 },
    { title: '№ объекта', dataIndex: 'objectNumber', key: 'objectNumber', width: 120 },
    { title: 'Описание', dataIndex: 'description', key: 'description' },
    { title: 'Результат', dataIndex: 'result', key: 'result', width: 110 },
    { title: 'Склад', dataIndex: 'warehouseId', key: 'warehouseId', width: 120,
      render: (v: string) => v ?? '—' },
    { title: 'Участок', dataIndex: 'productionLineId', key: 'productionLineId', width: 120,
      render: (v: string) => v ?? '—' },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 20 }}>Журнал событий склада</Typography.Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10} md={6}>
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
        <Col xs={24} sm={10} md={5}>
          <Input
            placeholder="Тип события"
            prefix={<SearchOutlined />}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={14} md={8}>
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
        <Col>
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
        locale={{ emptyText: 'Нет событий по подконтрольным складам' }}
        scroll={{ x: 1100 }}
      />
    </div>
  );
}
