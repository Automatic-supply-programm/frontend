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
import type { CreateRequestPayload, Request, RequestType } from '../../types';
import { REQUEST_TYPE_LABELS } from '../../utils/statusLabels';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultType?: RequestType;
  allowedTypes: RequestType[];
  editRequest?: Request;
}

interface ItemRow {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  exactLocation?: string;
}

export default function CreateRequestForm({ open, onClose, defaultType, allowedTypes, editRequest }: Props) {
  const [form] = Form.useForm();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [createRequest, { isLoading: creating }] = useCreateRequestMutation();
  const [updateRequest, { isLoading: updating }] = useUpdateRequestMutation();
  const { data: materials = [] } = useGetMaterialsQuery({ archived: false });
  const user = useSelector((s: RootState) => s.auth.user);

  const isEdit = !!editRequest;
  const isLoading = creating || updating;

  // Derive default sourceId from user context
  const defaultSourceId = user?.role === 'WORKER'
    ? (user.warehouseId ?? '')
    : user?.role === 'EMPLOYEE'
    ? (user.productionLineIds?.[0] ?? '')
    : '';

  useEffect(() => {
    if (open && editRequest) {
      form.setFieldsValue({
        type: editRequest.type,
        sourceId: editRequest.sourceId ?? '',
        sourceName: editRequest.sourceName ?? '',
        destinationId: editRequest.destinationId ?? '',
        destinationName: editRequest.destinationName ?? '',
        comment: editRequest.comment ?? '',
        orderNumber: (editRequest as unknown as Record<string, unknown>).orderNumber ?? '',
      });
      setItems(
        (editRequest.items ?? []).map((i) => ({
          materialId: i.materialId,
          materialName: i.materialName,
          quantity: i.quantity,
          unit: i.unit,
          exactLocation: i.exactLocation ?? '',
        }))
      );
    } else if (open && !editRequest) {
      form.setFieldsValue({ sourceId: defaultSourceId });
    } else if (!open) {
      form.resetFields();
      setItems([]);
    }
  }, [open, editRequest, form, defaultSourceId]);

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: `${m.article} — ${m.name}`,
    unit: m.unit,
  }));

  const typeOptions = allowedTypes.map((t) => ({
    value: t,
    label: REQUEST_TYPE_LABELS[t],
  }));

  const addItem = () => {
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
      message.error(isEdit ? 'Ошибка при обновлении заявки' : 'Ошибка при создании заявки');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setItems([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Редактировать заявку' : 'Создать заявку'}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={isLoading}
      okText={isEdit ? 'Сохранить' : 'Отправить'}
      cancelText="Отмена"
      width={680}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        size="small"
        initialValues={{ type: defaultType ?? allowedTypes[0] }}
      >
        <Form.Item name="type" label="Тип заявки" rules={[{ required: true }]}>
          <Select options={typeOptions} disabled={isEdit} />
        </Form.Item>

        <Form.Item name="sourceId" label="ID источника (склад / участок)">
          <Input placeholder="ID склада или участка" />
        </Form.Item>

        <Form.Item name="sourceName" label="Источник (склад / участок)">
          <Input placeholder="Склад №1 или Участок сборки" />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type') as RequestType | undefined;
            const placeholder = type === 'REPLENISHMENT'
              ? 'ID менеджера-получателя'
              : type === 'RECEIPT'
              ? 'ID сотрудника склада (ваш ID)'
              : 'ID работника склада';
            return (
              <Form.Item
                name="destinationId"
                label="ID получателя (сотрудника)"
                rules={[{ required: true, message: 'Введите ID получателя' }]}
              >
                <Input placeholder={placeholder} />
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item name="destinationName" label="Адресат (имя)">
          <Input placeholder="ФИО или наименование" />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.type !== curr.type}
        >
          {({ getFieldValue }) =>
            getFieldValue('type') === 'RECEIPT' ? (
              <Form.Item name="orderNumber" label="По какому заказу (номер заказа)">
                <Input placeholder="Номер заказа" />
              </Form.Item>
            ) : null
          }
        </Form.Item>

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

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addItem}
        block
        style={{ marginTop: 8 }}
      >
        Добавить материал
      </Button>
    </Modal>
  );
}
