import { Table, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { MaterialBatch } from '../../types';
import dayjs from 'dayjs';

interface Props {
  batches: MaterialBatch[];
  canAdd: boolean;
  onAdd: () => void;
}

export default function BatchHistoryTable({ batches, canAdd, onAdd }: Props) {
  const columns = [
    { title: '№ партии', dataIndex: 'batchNumber', key: 'batchNumber', width: 100 },
    {
      title: 'Дата поступления',
      dataIndex: 'receiptDate',
      key: 'receiptDate',
      width: 150,
      render: (v: string) => v ? dayjs(v).format('DD.MM.YYYY') : '—',
    },
    { title: 'Количество', dataIndex: 'initialQuantity', key: 'initialQuantity', width: 110 },
    { title: 'Остаток', dataIndex: 'currentQuantity', key: 'currentQuantity', width: 100 },
    { title: 'Место хранения', dataIndex: 'storageLocation', key: 'storageLocation' },
    {
      title: 'Срок годности',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 130,
      render: (v: string) => v ? dayjs(v).format('DD.MM.YYYY') : '—',
    },
    { title: 'Акт', dataIndex: 'receiptActNumber', key: 'receiptActNumber', width: 110 },
    { title: 'Принял', dataIndex: 'acceptedByName', key: 'acceptedByName' },
    { title: 'Подтвердил', dataIndex: 'confirmedByName', key: 'confirmedByName' },
  ];

  return (
    <div>
      {canAdd && (
        <div style={{ marginBottom: 12 }}>
          <Button icon={<PlusOutlined />} onClick={onAdd} size="small">
            Добавить партию
          </Button>
        </div>
      )}
      <Table
        dataSource={batches}
        columns={columns}
        rowKey={(r, i) => r.id ?? String(i)}
        size="small"
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{ emptyText: 'Нет партий' }}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
