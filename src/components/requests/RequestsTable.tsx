import { useState } from 'react';
import { Table, Tag, Button, Input, Select, Row, Col, Tooltip, DatePicker, Space, Popconfirm, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons';
import type { Request, RequestStatus, RequestType, Role } from '../../types';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLOR, REQUEST_TYPE_LABELS } from '../../utils/statusLabels';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

type ArchiveMode = 'active' | 'all' | 'only';

interface Props {
  data: Request[];
  loading: boolean;
  onRowClick: (req: Request) => void;
  onAdd?: () => void;
  showAdd?: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  dateRange?: [string, string] | null;
  onDateRangeChange?: (range: [string, string] | null) => void;
  sourceFilter?: string;
  onSourceChange?: (v: string) => void;
  sourceFilterLabel?: string;
  archiveMode: ArchiveMode;
  onArchiveModeChange: (m: ArchiveMode) => void;
  addLabel?: string;
  // роль и inline-действия
  userRole?: Role;
  onInlineApprove?: (req: Request) => void;
  onInlineReject?: (req: Request) => void;
  onInlineAccept?: (req: Request) => void;
  onInlineCancel?: (req: Request) => void;
  onInlineEdit?: (req: Request) => void;
  onInlineConfirm?: (req: Request) => void;
}

const TYPE_OPTIONS = Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }));
const STATUS_OPTIONS = Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

const ARCHIVE_OPTIONS = [
  { value: 'active', label: 'Только активные' },
  { value: 'all', label: 'Включая архивированные' },
  { value: 'only', label: 'Только архивированные' },
];

function renderIssueStatus(status: RequestStatus) {
  if (status === 'WAITING_CONFIRMATION') {
    return (
      <Space size={4} direction="vertical">
        <Tag color="green">Одобрена</Tag>
        <Tag color="orange">Не подтверждена</Tag>
      </Space>
    );
  }
  if (status === 'CONFIRMED') {
    return (
      <Space size={4} direction="vertical">
        <Tag color="green">Одобрена</Tag>
        <Tag color="green">Подтверждена</Tag>
      </Space>
    );
  }
  return <Tag color={REQUEST_STATUS_COLOR[status] ?? 'default'}>{REQUEST_STATUS_LABELS[status] ?? status}</Tag>;
}

export default function RequestsTable({
  data, loading, onRowClick, onAdd, showAdd = false,
  search, onSearchChange, typeFilter, onTypeChange,
  statusFilter, onStatusChange, dateRange, onDateRangeChange,
  sourceFilter, onSourceChange, sourceFilterLabel = 'Склад / участок',
  archiveMode, onArchiveModeChange,
  addLabel = 'Создать заявку',
  userRole,
  onInlineApprove, onInlineReject, onInlineAccept, onInlineCancel, onInlineEdit, onInlineConfirm,
}: Props) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const renderInlineActions = (r: Request) => {
    if (!userRole) return null;

    if (userRole === 'WORKER') {
      const isOwnRequest = r.type === 'RECEIPT' || r.type === 'REPLENISHMENT';
      if (isOwnRequest) {
        if (r.status === 'UNDER_CONSIDERATION' || r.status === 'SENT_FOR_REVISION') {
          return (
            <Space size={4} wrap>
              {onInlineEdit && (
                <Button size="small" onClick={(e) => { e.stopPropagation(); onInlineEdit(r); }}>
                  Редакт.
                </Button>
              )}
              {onInlineCancel && (
                <Popconfirm
                  title="Отменить заявку?"
                  onConfirm={() => onInlineCancel(r)}
                  okText="Да"
                  cancelText="Нет"
                >
                  <Button size="small" danger onClick={(e) => e.stopPropagation()}>Отменить</Button>
                </Popconfirm>
              )}
            </Space>
          );
        }
        return null;
      }
      // Входящие
      if (r.status === 'UNDER_CONSIDERATION') {
        if (r.type === 'RETURN') {
          return onInlineAccept ? (
            <Button size="small" type="primary" icon={<CheckOutlined />}
              onClick={(e) => { e.stopPropagation(); onInlineAccept(r); }}>
              Принять
            </Button>
          ) : null;
        }
        return (
          <Space size={4}>
            {onInlineApprove && (
              <Button size="small" type="primary" icon={<CheckOutlined />}
                onClick={(e) => { e.stopPropagation(); onInlineApprove(r); }}>
                Одобрить
              </Button>
            )}
            {onInlineReject && (
              <Button size="small" danger icon={<CloseOutlined />}
                onClick={(e) => { e.stopPropagation(); onInlineReject(r); }}>
                Откл.
              </Button>
            )}
          </Space>
        );
      }
      return null;
    }

    if (userRole === 'EMPLOYEE') {
      if (r.status === 'UNDER_CONSIDERATION' || r.status === 'SENT_FOR_REVISION') {
        return (
          <Space size={4} wrap>
            {onInlineEdit && (
              <Button size="small" onClick={(e) => { e.stopPropagation(); onInlineEdit(r); }}>
                Редакт.
              </Button>
            )}
            {onInlineCancel && (
              <Popconfirm
                title="Отменить заявку?"
                onConfirm={() => onInlineCancel(r)}
                okText="Да"
                cancelText="Нет"
              >
                <Button size="small" danger icon={<StopOutlined />} onClick={(e) => e.stopPropagation()}>
                  Отменить
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      }
      if (r.status === 'WAITING_CONFIRMATION' && r.type === 'ISSUE') {
        return onInlineConfirm ? (
          <Button size="small" type="primary" icon={<CheckOutlined />}
            onClick={(e) => { e.stopPropagation(); onInlineConfirm(r); }}>
            Подтвердить
          </Button>
        ) : null;
      }
      return null;
    }

    return null;
  };

  const columns = [
    { title: '№', key: 'number', width: 110,
      render: (_: unknown, r: Request) => r.number ?? r.requestNumber ?? r.id?.slice(-6) ?? '—' },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (v: RequestType) => REQUEST_TYPE_LABELS[v] ?? v,
    },
    {
      title: 'Дата создания',
      key: 'createdDate',
      width: 150,
      render: (_: unknown, r: Request) => {
        const d = r.createdDate ?? r.createdAt;
        return d ? dayjs(d).format('DD.MM.YYYY HH:mm') : '—';
      },
    },
    { title: 'Заявитель', key: 'requesterName', width: 150,
      render: (_: unknown, r: Request) => r.requesterName ?? r.createdByName ?? '—' },
    { title: 'Источник', dataIndex: 'sourceName', key: 'sourceName', width: 130 },
    { title: 'Адресат', dataIndex: 'destinationName', key: 'destinationName', width: 130 },
    {
      title: 'Позиций',
      key: 'itemsCount',
      width: 110,
      render: (_: unknown, r: Request) => {
        const count = r.items?.length ?? 0;
        const total = r.items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0;
        return count > 0 ? `${count} наим., ${total} шт.` : '0';
      },
    },
    {
      title: 'Статус',
      key: 'status',
      width: 200,
      render: (_: unknown, r: Request) =>
        r.type === 'ISSUE'
          ? renderIssueStatus(r.status)
          : <Tag color={REQUEST_STATUS_COLOR[r.status] ?? 'default'}>{REQUEST_STATUS_LABELS[r.status] ?? r.status}</Tag>,
    },
    {
      title: 'Комментарий',
      key: 'comment',
      width: 160,
      render: (_: unknown, r: Request) =>
        r.comment
          ? <Typography.Text ellipsis={{ tooltip: r.comment }} style={{ maxWidth: 140 }}>{r.comment}</Typography.Text>
          : '—',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Request) => (
        <Space size={4}>
          {renderInlineActions(record)}
          <Tooltip title="Просмотр">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => { e.stopPropagation(); onRowClick(record); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Input
            placeholder="Поиск по № или материалу"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Тип"
            value={typeFilter || undefined}
            onChange={onTypeChange}
            allowClear
            style={{ width: '100%' }}
            options={TYPE_OPTIONS}
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Статус"
            value={statusFilter || undefined}
            onChange={onStatusChange}
            allowClear
            style={{ width: '100%' }}
            options={STATUS_OPTIONS}
          />
        </Col>
        {onSourceChange && (
          <Col xs={12} sm={6} md={4}>
            <Input
              placeholder={sourceFilterLabel}
              value={sourceFilter}
              onChange={(e) => onSourceChange(e.target.value)}
              allowClear
            />
          </Col>
        )}
        {onDateRangeChange && (
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  onDateRangeChange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                } else {
                  onDateRangeChange(null);
                }
              }}
            />
          </Col>
        )}
        <Col xs={12} sm={8} md={5}>
          <Select
            value={archiveMode}
            onChange={onArchiveModeChange}
            style={{ width: '100%' }}
            options={ARCHIVE_OPTIONS}
          />
        </Col>
        {showAdd && onAdd && (
          <Col xs={12} sm={6} md={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
              {addLabel}
            </Button>
          </Col>
        )}
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        size="middle"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: 'Нет заявок' }}
      />
    </div>
  );
}
