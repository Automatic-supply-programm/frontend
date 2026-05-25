import { Table, Tag, Button, Input, Select, Row, Col, Checkbox, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Material, MaterialStatus, MaterialCategory } from '../../types';
import { MATERIAL_STATUS_LABELS, MATERIAL_STATUS_COLOR, MATERIAL_CATEGORY_LABELS } from '../../utils/statusLabels';

interface Props {
  data: Material[];
  loading: boolean;
  onRowClick: (material: Material) => void;
  onAdd: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  showArchived: boolean;
  onShowArchivedChange: (v: boolean) => void;
  canAdd: boolean;
  onReset: () => void;
}

const CATEGORIES = Object.entries(MATERIAL_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));
const STATUSES = Object.entries(MATERIAL_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));

export default function MaterialsTable({
  data, loading, onRowClick, onAdd,
  search, onSearchChange, categoryFilter, onCategoryChange,
  statusFilter, onStatusChange, showArchived, onShowArchivedChange,
  canAdd, onReset,
}: Props) {
  const columns = [
    { title: 'Артикул', dataIndex: 'article', key: 'article', width: 130 },
    { title: 'Наименование', dataIndex: 'name', key: 'name' },
    { title: 'Ед. изм.', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Остаток',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      render: (v: number) => v ?? 0,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: MaterialStatus) => (
        <Tag color={MATERIAL_STATUS_COLOR[v] ?? 'default'}>
          {MATERIAL_STATUS_LABELS[v] ?? v}
        </Tag>
      ),
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (v: MaterialCategory) => MATERIAL_CATEGORY_LABELS[v] ?? v,
    },
    { title: 'Место хранения', dataIndex: 'storageLocation', key: 'storageLocation' },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Material) => (
        <Tooltip title="Карточка">
          <Button
            size="small"
            icon={<FileTextOutlined />}
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
            placeholder="Поиск по артикулу / наименованию"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Категория"
            value={categoryFilter || undefined}
            onChange={onCategoryChange}
            allowClear
            style={{ width: '100%' }}
            options={CATEGORIES}
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Статус"
            value={statusFilter || undefined}
            onChange={onStatusChange}
            allowClear
            style={{ width: '100%' }}
            options={STATUSES}
          />
        </Col>
        <Col xs={12} sm={6} md={3} style={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
          >
            Архивированные
          </Checkbox>
        </Col>
        <Col xs={12} sm={6} md={3} style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            Сбросить
          </Button>
        </Col>
        {canAdd && (
          <Col xs={12} sm={6} md={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
              Добавить материал
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
        locale={{ emptyText: 'Нет материалов' }}
        rowClassName={(r) => r.archived ? 'row-archived' : ''}
      />
    </div>
  );
}
