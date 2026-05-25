import { useState } from 'react';
import {
  Modal, Form, Select, Input, Button, Space, InputNumber,
  Divider, message
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCreateRequestMutation } from '../../features/requests/requestsApi';
import { useGetMaterialsQuery } from '../../features/materials/materialsApi';
import type { CreateRequestPayload, RequestType } from '../../types';
import { REQUEST_TYPE_LABELS } from '../../utils/statusLabels';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultType?: RequestType;
  allowedTypes: RequestType[];
}

interface ItemRow {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export default function CreateRequestForm({ open, onClose, defaultType, allowedTypes }: Props) {
  const [form] = Form.useForm();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [createRequest, { isLoading }] = useCreateRequestMutation();
  const { data: materials = [] } = useGetMaterialsQuery({ archived: false });

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
    setItems([...items, { materialId: '', materialName: '', quantity: 1, unit: '' }]);
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
      next[idx] = { ...next[idx], [field]: value };
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
        comment: values.comment,
      };

      await createRequest(payload).unwrap();
      message.success('Заявка создана');
      form.resetFields();
      setItems([]);
      onClose();
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Ошибка при создании заявки');
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
      title="Создать заявку"
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={isLoading}
      okText="Отправить"
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
          <Select options={typeOptions} />
        </Form.Item>

        <Form.Item name="sourceName" label="Источник (склад / участок)">
          <Input placeholder="Склад №1 или Участок сборки" />
        </Form.Item>

        <Form.Item name="destinationName" label="Адресат">
          <Input placeholder="ФИО или наименование" />
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
            style={{ width: 280 }}
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
            style={{ width: 90 }}
            placeholder="Кол-во"
          />
          <Input
            value={item.unit}
            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
            placeholder="ед."
            style={{ width: 60 }}
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
