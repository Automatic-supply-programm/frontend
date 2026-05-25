import { useState, useEffect } from 'react';
import {
  Modal, Descriptions, Tag, Button, Form, Input, Select, InputNumber,
  Space, Popconfirm, Divider, Typography, message, DatePicker
} from 'antd';
import { EditOutlined, SaveOutlined, DeleteOutlined, PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Material } from '../../types';
import { MATERIAL_STATUS_LABELS, MATERIAL_STATUS_COLOR, MATERIAL_CATEGORY_LABELS } from '../../utils/statusLabels';
import { useUpdateMaterialMutation, useArchiveMaterialMutation, useAddBatchMutation } from '../../features/materials/materialsApi';
import { getApiErrorMessage } from '../../utils/apiError';
import BatchHistoryTable from './BatchHistoryTable';
import CreateRequestForm from '../requests/CreateRequestForm';
import type { Role } from '../../types';
import dayjs from 'dayjs';

interface Props {
  material: Material | null;
  open: boolean;
  onClose: () => void;
  userRole: Role;
  startEditing?: boolean;
}

const CATEGORY_OPTIONS = Object.entries(MATERIAL_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));

export default function MaterialCardModal({ material, open, onClose, userRole, startEditing }: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [addingBatch, setAddingBatch] = useState(false);
  const [showReplenishment, setShowReplenishment] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [updateMaterial, { isLoading: updating }] = useUpdateMaterialMutation();
  const [archiveMaterial, { isLoading: archiving }] = useArchiveMaterialMutation();
  const [addBatch, { isLoading: addingBatchLoading }] = useAddBatchMutation();

  useEffect(() => {
    if (open && startEditing && material) {
      form.setFieldsValue({
        name: material.name,
        article: material.article,
        category: material.category,
        unit: material.unit,
        criticalStock: material.criticalStock,
        storageLocation: material.storageLocation,
        description: material.description,
      });
    }
  }, [open, startEditing, material, form]);

  if (!material) return null;

  const canEdit = userRole === 'ADMIN' || userRole === 'WORKER';
  const canArchive = userRole === 'ADMIN';
  const canEditBatches = userRole === 'ADMIN';
  const canAddBatch = userRole === 'ADMIN' || userRole === 'WORKER';
  const canReplenish = userRole === 'ADMIN' || userRole === 'WORKER';
  const canCreateIssue = userRole === 'ADMIN' || userRole === 'EMPLOYEE';

  const handleEdit = () => {
    form.setFieldsValue({
      name: material.name,
      article: material.article,
      category: material.category,
      unit: material.unit,
      criticalStock: material.criticalStock,
      storageLocation: material.storageLocation,
      description: material.description,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await updateMaterial({ id: material.id, data: { ...values, warehouses: material.warehouses } }).unwrap();
      message.success('Карточка обновлена');
      setEditing(false);
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(getApiErrorMessage(e, 'Ошибка при сохранении'));
    }
  };

  const handleArchive = async () => {
    try {
      await archiveMaterial(material.id).unwrap();
      message.success('Материал архивирован');
      onClose();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Ошибка при архивировании'));
    }
  };

  const handleAddBatch = async () => {
    try {
      const values = await batchForm.validateFields();
      const batchData = {
        ...values,
        // DatePicker возвращает dayjs-объект, конвертируем в строку YYYY-MM-DD
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : undefined,
        // currentQuantity выставляется на бэке равным initialQuantity
        currentQuantity: undefined,
      };
      await addBatch({ id: material.id, batch: batchData }).unwrap();
      message.success('Партия добавлена');
      setAddingBatch(false);
      batchForm.resetFields();
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(getApiErrorMessage(e, 'Ошибка при добавлении партии'));
    }
  };

  const footer = (
    <Space wrap>
      {!editing && canEdit && (
        <Button icon={<EditOutlined />} onClick={handleEdit}>Редактировать</Button>
      )}
      {editing && (
        <>
          <Button type="primary" icon={<SaveOutlined />} loading={updating} onClick={handleSave}>
            Сохранить
          </Button>
          <Button onClick={() => setEditing(false)}>Отмена</Button>
        </>
      )}
      {!editing && canCreateIssue && (
        <Button icon={<PlusOutlined />} onClick={() => setShowIssue(true)}>
          Создать заявку на выдачу
        </Button>
      )}
      {!editing && canReplenish && (
        <Button icon={<PlusOutlined />} onClick={() => setShowReplenishment(true)}>
          Создать заявку на пополнение
        </Button>
      )}
      {!editing && (
        <Button
          icon={<HistoryOutlined />}
          onClick={() => { onClose(); navigate('/event-logs', { state: { search: material.article } }); }}
        >
          История событий
        </Button>
      )}
      {!editing && canArchive && !material.archived && (
        <Popconfirm
          title="Архивировать материал?"
          description="Карточка не будет отображаться в основном списке."
          onConfirm={handleArchive}
          okText="Архивировать"
          cancelText="Отмена"
        >
          <Button danger icon={<DeleteOutlined />} loading={archiving}>Архивировать</Button>
        </Popconfirm>
      )}
    </Space>
  );

  const infoBlock = editing ? (
    <Form form={form} layout="vertical" size="small">
      <Form.Item name="name" label="Наименование" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="article" label="Артикул" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="category" label="Категория">
        <Select options={CATEGORY_OPTIONS} />
      </Form.Item>
      <Form.Item name="unit" label="Ед. изм." rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="criticalStock" label="Критический остаток">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="storageLocation" label="Место хранения *" rules={[{ required: true, message: 'Введите место хранения' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Описание">
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  ) : (
    <Descriptions size="small" column={2} bordered>
      <Descriptions.Item label="Наименование" span={2}>{material.name}</Descriptions.Item>
      <Descriptions.Item label="Артикул">{material.article}</Descriptions.Item>
      <Descriptions.Item label="Категория">{MATERIAL_CATEGORY_LABELS[material.category] ?? material.category}</Descriptions.Item>
      <Descriptions.Item label="Ед. изм.">{material.unit}</Descriptions.Item>
      <Descriptions.Item label="Статус">
        <Tag color={MATERIAL_STATUS_COLOR[material.status] ?? 'default'}>
          {MATERIAL_STATUS_LABELS[material.status] ?? material.status}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Текущий остаток">{material.currentStock}</Descriptions.Item>
      <Descriptions.Item label="Критический остаток">{material.criticalStock}</Descriptions.Item>
      <Descriptions.Item label="Место хранения" span={2}>{material.storageLocation ?? '—'}</Descriptions.Item>
      {material.description && (
        <Descriptions.Item label="Описание" span={2}>{material.description}</Descriptions.Item>
      )}
      {material.lastReceiptDate && (
        <Descriptions.Item label="Последнее поступление">
          {dayjs(material.lastReceiptDate).format('DD.MM.YYYY')}
        </Descriptions.Item>
      )}
      {material.lastIssueDate && (
        <Descriptions.Item label="Последняя выдача">
          {dayjs(material.lastIssueDate).format('DD.MM.YYYY')}
        </Descriptions.Item>
      )}
      {material.warehouses && material.warehouses.length > 0 && (
        <Descriptions.Item label="Склады" span={2}>{material.warehouses.join(', ')}</Descriptions.Item>
      )}
      {material.createdAt && (
        <Descriptions.Item label="Создан">{dayjs(material.createdAt).format('DD.MM.YYYY')}</Descriptions.Item>
      )}
    </Descriptions>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<Typography.Text strong>{material.name}</Typography.Text>}
      width={900}
      footer={footer}
      destroyOnClose
      afterOpenChange={(visible) => {
        if (visible && startEditing && material) setEditing(true);
        else if (!visible) setEditing(false);
      }}
    >
      {infoBlock}

      <Divider>История партий</Divider>
      <BatchHistoryTable
        batches={material.batches ?? []}
        canAdd={canAddBatch}
        onAdd={() => setAddingBatch(true)}
      />

      <Modal
        open={addingBatch}
        title="Добавить партию"
        onCancel={() => { setAddingBatch(false); batchForm.resetFields(); }}
        onOk={handleAddBatch}
        confirmLoading={addingBatchLoading}
        okText="Добавить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={batchForm} layout="vertical" size="small">
          <Form.Item name="initialQuantity" label="Количество (шт.)" rules={[{ required: true, message: 'Укажите количество' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="storageLocation" label="Место хранения">
            <Input />
          </Form.Item>
          <Form.Item name="receiptActNumber" label="№ акта приёмки">
            <Input />
          </Form.Item>
          <Form.Item name="expiryDate" label="Срок годности">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          {canEditBatches && (
            <>
              <Form.Item name="acceptedByName" label="Принял">
                <Input />
              </Form.Item>
              <Form.Item name="confirmedByName" label="Подтвердил">
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {showReplenishment && (
        <CreateRequestForm
          open={showReplenishment}
          onClose={() => setShowReplenishment(false)}
          defaultType="REPLENISHMENT"
          allowedTypes={['REPLENISHMENT', 'RECEIPT', 'RETURN']}
        />
      )}

      {showIssue && (
        <CreateRequestForm
          open={showIssue}
          onClose={() => setShowIssue(false)}
          defaultType="ISSUE"
          allowedTypes={['ISSUE']}
          defaultMaterial={{ materialId: material.id, materialName: material.name, unit: material.unit }}
        />
      )}
    </Modal>
  );
}
