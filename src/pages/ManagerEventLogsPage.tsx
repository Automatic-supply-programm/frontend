import { useState } from 'react';
import { Table, Button, Row, Col, Typography, DatePicker } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useGetManagerEventLogsQuery } from '../features/eventLogs/eventLogsApi';
import type { EventLog, Role } from '../types';
import { ROLE_LABELS } from '../utils/statusLabels';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ManagerEventLogsPage() {
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { data: logs = [], isLoading } = useGetManagerEventLogsQuery({
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });

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
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 20 }}>Журнал событий склада</Typography.Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={14} md={10}>
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
          <Button icon={<ReloadOutlined />} onClick={() => setDateRange(null)}>Сбросить</Button>
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
        scroll={{ x: 900 }}
      />
    </div>
  );
}
