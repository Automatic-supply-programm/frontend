import { useState } from 'react';
import {
  Modal, Descriptions, Tag, Button, Space, Table, Typography,
  Input, Popconfirm, message, Divider
} from 'antd';
import {
  CheckOutlined, CloseOutlined, RollbackOutlined,
  StopOutlined, EditOutlined, InboxOutlined
} from '@ant-design/icons';
import type { Request, RequestStatus, Role } from '../../types';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLOR, REQUEST_TYPE_LABELS } from '../../utils/statusLabels';
import {
  useChangeRequestStatusMutation,
  useConfirmRequestMutation,
  useArchiveRequestMutation,
} from '../../features/requests/requestsApi';
import { getApiErrorMessage } from '../../utils/apiError';
import dayjs from 'dayjs';

interface Props {
  request: Request | null;
  open: boolean;
  onClose: () => void;
  userRole: Role;
  onEdit?: () => void;
}

export default function RequestModal({ request, open, onClose, userRole, onEdit }: Props) {
  const [commentInput, setCommentInput] = useState('');
  const [changeStatus, { isLoading: changing }] = useChangeRequestStatusMutation();
  const [confirmRequest, { isLoading: confirming }] = useConfirmRequestMutation();
  const [archiveRequest, { isLoading: archiving }] = useArchiveRequestMutation();

  if (!request) return null;

  const doChangeStatus = async (status: RequestStatus, comment?: string) => {
    try {
      await changeStatus({ id: request.id, status, comment: comment || commentInput || undefined }).unwrap();
      message.success(`Статус изменён: ${REQUEST_STATUS_LABELS[status]}`);
      setCommentInput('');
      onClose();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Ошибка при изменении статуса'));
    }
  };

  const doConfirm = async () => {
    try {
      await confirmRequest(request.id).unwrap();
      message.success('Получение подтверждено');
      onClose();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Ошибка при подтверждении'));
    }
  };

  const doArchive = async () => {
    try {
      await archiveRequest(request.id).unwrap();
      message.success('Заявка архивирована');
      onClose();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Ошибка при архивировании'));
    }
  };

  const archivableStatuses: RequestStatus[] = ['CONFIRMED', 'ACCEPTED', 'APPROVED', 'REJECTED', 'SENT_FOR_REVISION', 'CANCELLED'];
  const canArchive = !request.archived && archivableStatuses.includes(request.status);

  const renderActions = () => {
    const status = request.status;
    const loading = changing || confirming;

    if (userRole === 'WORKER') {
      const isOwnRequest = request.type === 'RECEIPT' || request.type === 'REPLENISHMENT';
      if (isOwnRequest) {
        if (status === 'UNDER_CONSIDERATION' || status === 'SENT_FOR_REVISION') return (
          <Space wrap>
            {onEdit && <Button icon={<EditOutlined />} onClick={onEdit}>Редактировать</Button>}
            <Popconfirm title="Отменить заявку?" onConfirm={() => doChangeStatus('CANCELLED')} okText="Да" cancelText="Нет">
              <Button danger icon={<StopOutlined />} loading={loading}>Отменить</Button>
            </Popconfirm>
          </Space>
        );
        return null;
      }
      if (status === 'UNDER_CONSIDERATION') {
        const isReturn = request.type === 'RETURN';
        if (isReturn) {
          return (
            <Space wrap>
              <Input.TextArea
                placeholder="Комментарий (необязательно)"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                rows={1}
                style={{ width: 240 }}
              />
              <Button type="primary" icon={<CheckOutlined />} loading={loading}
                onClick={() => doChangeStatus('ACCEPTED')}>Принять</Button>
            </Space>
          );
        }
        return (
          <Space wrap>
            <Input.TextArea
              placeholder="Комментарий (необязательно)"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              rows={1}
              style={{ width: 240 }}
            />
            <Button type="primary" icon={<CheckOutlined />} loading={loading}
              onClick={() => doChangeStatus('APPROVED')}>Одобрить</Button>
            <Button danger icon={<CloseOutlined />} loading={loading}
              onClick={() => doChangeStatus('REJECTED')}>Отклонить</Button>
          </Space>
        );
      }
    }

    if (userRole === 'EMPLOYEE') {
      const cancellable = status !== 'CONFIRMED' && status !== 'CANCELLED';
      const editable = status === 'UNDER_CONSIDERATION' || status === 'SENT_FOR_REVISION';
      if (status === 'WAITING_CONFIRMATION') return (
        <Space wrap>
          <Popconfirm title="Подтвердить получение материалов?" onConfirm={doConfirm} okText="Подтвердить" cancelText="Нет">
            <Button type="primary" icon={<CheckOutlined />} loading={loading}>Подтвердить получение</Button>
          </Popconfirm>
          {cancellable && (
            <Popconfirm title="Отменить заявку?" onConfirm={() => doChangeStatus('CANCELLED')} okText="Да" cancelText="Нет">
              <Button danger icon={<StopOutlined />} loading={loading}>Отменить</Button>
            </Popconfirm>
          )}
        </Space>
      );
      if (editable || cancellable) return (
        <Space wrap>
          {editable && onEdit && <Button icon={<EditOutlined />} onClick={onEdit}>Редактировать</Button>}
          {cancellable && (
            <Popconfirm title="Отменить заявку?" onConfirm={() => doChangeStatus('CANCELLED')} okText="Да" cancelText="Нет">
              <Button danger icon={<StopOutlined />} loading={loading}>Отменить</Button>
            </Popconfirm>
          )}
        </Space>
      );
    }

    if (userRole === 'MANAGER') {
      if (status === 'UNDER_CONSIDERATION') return (
        <Space wrap>
          <Input.TextArea
            placeholder="Комментарий (необязательно)"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            rows={1}
            style={{ width: 240 }}
          />
          <Button type="primary" icon={<CheckOutlined />} loading={loading}
            onClick={() => doChangeStatus('APPROVED')}>Одобрить</Button>
          <Button danger icon={<CloseOutlined />} loading={loading}
            onClick={() => doChangeStatus('REJECTED')}>Отклонить</Button>
          <Button icon={<RollbackOutlined />} loading={loading}
            onClick={() => doChangeStatus('SENT_FOR_REVISION')}>На доработку</Button>
        </Space>
      );
    }

    if (userRole === 'ADMIN') {
      const availableStatuses: RequestStatus[] = ['APPROVED', 'REJECTED', 'SENT_FOR_REVISION', 'CANCELLED'];
      const filtered = availableStatuses.filter((s) => s !== status);
      if (filtered.length) return (
        <Space wrap>
          <Input.TextArea
            placeholder="Комментарий"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            rows={1}
            style={{ width: 200 }}
          />
          {filtered.map((s) => (
            <Button key={s} loading={loading} onClick={() => doChangeStatus(s)}
              type={s === 'APPROVED' ? 'primary' : s === 'REJECTED' || s === 'CANCELLED' ? 'default' : 'default'}
              danger={s === 'REJECTED' || s === 'CANCELLED'}>
              → {REQUEST_STATUS_LABELS[s]}
            </Button>
          ))}
        </Space>
      );
    }

    return null;
  };

  const itemColumns = [
    { title: 'Материал', dataIndex: 'materialName', key: 'materialName' },
    { title: 'Количество', dataIndex: 'quantity', key: 'quantity', width: 110 },
    { title: 'Ед. изм.', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Размещение', dataIndex: 'exactLocation', key: 'exactLocation', width: 150,
      render: (v: string) => v ?? '—' },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<Typography.Text strong>Заявка {request.number ?? request.requestNumber ?? `#${request.id?.slice(-6)}`}</Typography.Text>}
      width={760}
      footer={null}
      destroyOnClose
    >
      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Тип">{REQUEST_TYPE_LABELS[request.type] ?? request.type}</Descriptions.Item>
        <Descriptions.Item label="Статус">
          <Tag color={REQUEST_STATUS_COLOR[request.status] ?? 'default'}>
            {REQUEST_STATUS_LABELS[request.status] ?? request.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Дата создания">
          {(request.createdDate ?? request.createdAt)
            ? dayjs(request.createdDate ?? request.createdAt).format('DD.MM.YYYY HH:mm') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Заявитель">{request.requesterName ?? request.createdByName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Источник">{request.sourceName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Адресат">{request.destinationName ?? '—'}</Descriptions.Item>
        {request.comment && (
          <Descriptions.Item label="Комментарий" span={2}>{request.comment}</Descriptions.Item>
        )}
      </Descriptions>

      <Divider>Список материалов</Divider>
      <Table
        dataSource={request.items}
        columns={itemColumns}
        rowKey={(r, i) => `${r.materialId}-${i}`}
        size="small"
        pagination={false}
        locale={{ emptyText: 'Нет позиций' }}
      />

      {renderActions() && (
        <>
          <Divider />
          {renderActions()}
        </>
      )}

      {canArchive && (
        <>
          <Divider />
          <Popconfirm
            title="Архивировать заявку?"
            description="Заявка будет скрыта из основного списка."
            onConfirm={doArchive}
            okText="Архивировать"
            cancelText="Отмена"
          >
            <Button icon={<InboxOutlined />} loading={archiving}>Архивировать</Button>
          </Popconfirm>
        </>
      )}
    </Modal>
  );
}
