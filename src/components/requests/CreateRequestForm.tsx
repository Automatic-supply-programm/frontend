import { useState, useEffect } from 'react';
import {
  Modal, Form, Select, Input, Button, Space, InputNumber,
  Divider, message
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useCreateRequestMutation, useUpdateRequestMutation } from '../../features/requests/requestsApi';
import { useGetMaterialsQuery } from '../../features/materials/materialsApi';
import { useGetUsersDirectoryQuery } from '../../features/users/usersApi';
import type { CreateRequestPayload, Request, RequestType } from '../../types';
import { REQUEST_TYPE_LABELS } from '../../utils/statusLabels';
import { getApiErrorMessage } from '../../utils/apiError';
import MaterialForm from '../materials/MaterialForm';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultType?: RequestType;
  allowedTypes: RequestType[];
  editRequest?: Request;
  defaultMaterial?: { materialId: string; materialName: string; unit: string };
}

interface ItemRow {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  exactLocation?: string;
}

export default function CreateRequestForm({ open, onClose, defaultType, allowedTypes, editRequest, defaultMaterial }: Props) {
  const [form] = Form.useForm();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [prevOpen, setPrevOpen] = useState(open);
  const watchedType = Form.useWatch<RequestType>('type', form);
  const currentType: RequestType = watchedType ?? (editRequest?.type as RequestType) ?? defaultType ?? allowedTypes[0];
  const [showNewMaterial, setShowNewMaterial] = useState(false);

  // Синхронизация items с пропом при смене open (паттерн React: useState для prev-значения)
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && editRequest) {
      setItems(
        (editRequest.items ?? []).map((i) => ({
          materialId: i.materialId,
          materialName: i.materialName,
          quantity: i.quantity,
          unit: i.unit,
          exactLocation: i.exactLocation ?? '',
        }))
      );
    } else if (open && !editRequest && defaultMaterial) {
      setItems([{ ...defaultMaterial, quantity: 1, exactLocation: '' }]);
    } else if (!open) {
      setItems([]);
    }
  }

  const [createRequest, { isLoading: creating }] = useCreateRequestMutation();
  const [updateRequest, { isLoading: updating }] = useUpdateRequestMutation();
  const { data: materials = [], refetch: refetchMaterials } = useGetMaterialsQuery({ archived: false });
  const { data: workers = [] } = useGetUsersDirectoryQuery('WORKER');
  const { data: managers = [] } = useGetUsersDirectoryQuery('MANAGER');
  const user = useSelector((s: RootState) => s.auth.user);

  const isEdit = !!editRequest;
  const isLoading = creating || updating;

  const defaultSourceId = user?.role === 'WORKER'
    ? (user.warehouseId ?? '')
    : user?.role === 'EMPLOYEE'
    ? (user.productionLineIds?.[0] ?? '')
    : '';

  const sourceFixed = user?.role === 'WORKER' || user?.role === 'EMPLOYEE';

  const filteredManagers =
    user?.role === 'WORKER' && user.warehouseId
      ? managers.filter((m) => m.managedWarehouseIds?.includes(user.warehouseId!))
      : managers;

  const destinationUsers =
    currentType === 'REPLENISHMENT' ? filteredManagers
    : (currentType === 'ISSUE' || currentType === 'RETURN') ? workers
    : [];

  const destinationOptions = destinationUsers.map((u) => ({
    value: u.id,
    label: `${u.fullName} (${u.login})`,
  }));

  useEffect(() => {
    if (open && editRequest) {
      form.setFieldsValue({
        type: editRequest.type,
        sourceId: editRequest.sourceId ?? '',
        sourceName: editRequest.sourceName ?? '',
        destinationId: editRequest.destinationId ?? undefined,
        destinationName: editRequest.destinationName ?? '',
        comment: editRequest.comment ?? '',
        orderNumber: (editRequest as unknown as Record<string, unknown>).orderNumber ?? undefined,
      });
    } else if (open && !editRequest) {
      const initType = defaultType ?? allowedTypes[0];
      const initial: Record<string, unknown> = {
        type: initType,
        sourceId: defaultSourceId,
      };
      if (initType === 'RECEIPT' && user) {
        initial.destinationId = user.id;
        initial.destinationName = user.fullName;
      }
      form.setFieldsValue(initial);
    } else if (!open) {
      form.resetFields();
    }
  }, [open, editRequest, form, defaultSourceId, user, defaultType, allowedTypes]);

  const handleTypeChange = (type: RequestType) => {
    if (type === 'RECEIPT' && user) {
      form.setFieldsValue({ destinationId: user.id, destinationName: user.fullName });
    } else {
      form.setFieldsValue({ destinationId: undefined, destinationName: '' });
    }
  };

  const handleDestinationChange = (userId: string) => {
    const selected = destinationUsers.find((u) => u.id === userId);
    form.setFieldValue('destinationName', selected?.fullName ?? '');
  };

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.article} — ${m.name}`,
    unit: m.unit,
  }));

  const typeOptions = allowedTypes.map((t) => ({
    value: t,
    label: REQUEST_TYPE_LABELS[t],
  }));

  const addExistingItem = () => {
    setItems([...items, { materialId: '', materialName: '', quantity: 1, unit: '', exactLocation: '' }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ItemRow, value: string | number) => {
    const next = [...items];
    if (field === 'materialId') {
      const mat = materials.find((m) => m.id === value);
      next[idx] = {
        ...next[idx],
        materialId: String(value),
        materialName: mat?.name ?? '',
        unit: mat?.unit ?? '',
      };
    } else {
      (next[idx] as unknown as Record<string, unknown>)[field] = value;
    }
    setItems(next);
  };

  const handleNewMaterialCreated = async () => {
    setShowNewMaterial(false);
    await refetchMaterials();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning('Добавьте хотя бы один материал');
        return;
      }
      const invalidItems = items.filter((i) => !i.materialId || i.quantity <= 0);
      if (invalidItems.length) {
        message.warning('Заполните все позиции материалов');
        return;
      }

      const payload: CreateRequestPayload = {
        type: values.type,
        sourceId: values.sourceId,
        sourceName: values.sourceName,
        destinationId: values.destinationId,
        destinationName: values.destinationName,
        items,
        orderNumber: values.orderNumber,
        comment: values.comment,
      };

      if (isEdit && editRequest) {
        await updateRequest({ id: editRequest.id, data: payload }).unwrap();
        message.success('Заявка обновлена');
      } else {
        await createRequest(payload).unwrap();
        message.success('Заявка создана');
      }
      form.resetFields();
      setItems([]);
      onClose();
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(getApiErrorMessage(e, isEdit ? 'Ошибка при обновлении заявки' : 'Ошибка при создании заявки'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setItems([]);
    onClose();
  };

  const destinationLabel =
    currentType === 'REPLENISHMENT' ? 'Менеджер-получатель'
    : currentType === 'RECEIPT' ? 'Сотрудник склада (вы)'
    : 'Работник склада-получатель';

  return (
    <>
      <Modal
        open={open}
        title={isEdit ? 'Редактировать заявку' : 'Создать заявку'}
        onCancel={handleCancel}
        onOk={handleOk}
        confirmLoading={isLoading}
        okText={isEdit ? 'Сохранить' : 'Отправить'}
        cancelText="Отмена"
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          size="small"
          initialValues={{ type: defaultType ?? allowedTypes[0] }}
        >
          <Form.Item name="type" label="Тип заявки" rules={[{ required: true }]}>
            <Select options={typeOptions} disabled={isEdit} onChange={handleTypeChange} />
          </Form.Item>

          <Form.Item name="sourceId" label="ID источника (склад / участок)">
            <Input
              placeholder={sourceFixed ? 'Заполняется из вашего профиля' : 'ID склада или участка'}
              disabled={sourceFixed}
            />
          </Form.Item>

          <Form.Item name="sourceName" label="Источник (название склада / участка)">
            <Input placeholder="Склад №1 или Участок сборки" />
          </Form.Item>

          <Form.Item name="destinationName" hidden>
            <Input />
          </Form.Item>

          {currentType === 'RECEIPT' ? (
            <Form.Item name="destinationId" label={destinationLabel}>
              <Input disabled />
            </Form.Item>
          ) : (
            <Form.Item
              name="destinationId"
              label={destinationLabel}
              rules={[{ required: true, message: 'Выберите получателя из списка' }]}
            >
              <Select
                options={destinationOptions}
                showSearch
                filterOption={(input, opt) =>
                  (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                placeholder={
                  currentType === 'REPLENISHMENT' ? 'Выберите менеджера' : 'Выберите работника склада'
                }
                onChange={handleDestinationChange}
                notFoundContent="Пользователи не найдены"
              />
            </Form.Item>
          )}

          {currentType === 'RECEIPT' && (
            <Form.Item name="orderNumber" label="Номер заказа">
              <Input placeholder="Введите номер заказа" />
            </Form.Item>
          )}

          <Form.Item name="comment" label="Комментарий">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>

        <Divider>Список материалов</Divider>

        {items.map((item, idx) => (
          <Space key={idx} style={{ display: 'flex', marginBottom: 8 }} align="start" wrap>
            <Select
              placeholder="Выберите материал"
              style={{ width: 230 }}
              options={materialOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              value={item.materialId || undefined}
              onChange={(v) => updateItem(idx, 'materialId', v)}
            />
            <InputNumber
              min={1}
              value={item.quantity}
              onChange={(v) => updateItem(idx, 'quantity', v ?? 1)}
              style={{ width: 80 }}
              placeholder="Кол-во"
            />
            <Input
              value={item.unit}
              onChange={(e) => updateItem(idx, 'unit', e.target.value)}
              placeholder="ед."
              style={{ width: 55 }}
              readOnly
            />
            <Input
              value={item.exactLocation ?? ''}
              onChange={(e) => updateItem(idx, 'exactLocation', e.target.value)}
              placeholder="Размещение"
              style={{ width: 130 }}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => removeItem(idx)}
            />
          </Space>
        ))}

        <Space style={{ marginTop: 8 }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addExistingItem}
          >
            Добавить существующий
          </Button>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setShowNewMaterial(true)}
          >
            Добавить новый материал
          </Button>
        </Space>
      </Modal>

      <MaterialForm
        open={showNewMaterial}
        onClose={handleNewMaterialCreated}
      />
    </>
  );
}
