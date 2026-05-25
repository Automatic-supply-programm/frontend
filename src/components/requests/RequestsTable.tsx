import { Table, Tag, Button, Input, Select, Row, Col, Checkbox, Tooltip, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import type { Request, RequestStatus, RequestType } from '../../types';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLOR, REQUEST_TYPE_LABELS } from '../../utils/statusLabels';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

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
  showArchived: boolean;
  onShowArchivedChange: (v: boolean) => void;
  addLabel?: string;
}

const TYPE_OPTIONS = Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }));
const STATUS_OPTIONS = Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

export default function RequestsTable({
  data, loading, onRowClick, onAdd, showAdd = false,
  search, onSearchChange, typeFilter, onTypeChange,
  statusFilter, onStatusChange, dateRange, onDateRangeChange,
  sourceFilter, onSourceChange, sourceFilterLabel = 'Склад / участок',
  showArchived, onShowArchivedChange,
  addLabel = 'Создать заявку',
}: Props) {
  const columns = [
    { title: '№', key: 'number', width: 110,
      render: (_: unknown, r: Request) => r.number ?? r.requestNumber ?? r.id?.slice(-6) ?? '—' },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 150,
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
    { title: 'Заявитель', key: 'requesterName',
      render: (_: unknown, r: Request) => r.requesterName ?? r.createdByName ?? '—' },
    { title: 'Источник', dataIndex: 'sourceName', key: 'sourceName' },
    { title: 'Адресат', dataIndex: 'destinationName', key: 'destinationName' },
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
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (v: RequestStatus) => (
        <Tag color={REQUEST_STATUS_COLOR[v] ?? 'default'}>
          {REQUEST_STATUS_LABELS[v] ?? v}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: Request) => (
        <Tooltip title="Просмотр">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); onRowClick(record); }}
          />
        </Tooltip>
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
        <Col xs={12} sm={6} md={4} style={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
          >
            Архивированные
          </Checkbox>
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
        size="middle"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: 'Нет заявок' }}
      />
    </div>
  );
}
