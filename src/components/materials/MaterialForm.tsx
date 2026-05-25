import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useCreateMaterialMutation } from '../../features/materials/materialsApi';
import { useGetWarehousesDirectoryQuery } from '../../features/users/usersApi';
import { MATERIAL_CATEGORY_LABELS } from '../../utils/statusLabels';
import { getApiErrorMessage } from '../../utils/apiError';
import type { CreateMaterialRequest } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS = Object.entries(MATERIAL_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));

const UNIT_OPTIONS = [
  { value: 'шт', label: 'шт — штука' },
  { value: 'кг', label: 'кг — килограмм' },
  { value: 'г', label: 'г — грамм' },
  { value: 'т', label: 'т — тонна' },
  { value: 'м', label: 'м — метр' },
  { value: 'м²', label: 'м² — квадратный метр' },
  { value: 'м³', label: 'м³ — кубический метр' },
  { value: 'л', label: 'л — литр' },
  { value: 'мл', label: 'мл — миллилитр' },
  { value: 'уп', label: 'уп — упаковка' },
  { value: 'рул', label: 'рул — рулон' },
  { value: 'пог.м', label: 'пог.м — погонный метр' },
];

export default function MaterialForm({ open, onClose }: Props) {
  const [form] = Form.useForm<CreateMaterialRequest>();
  const [createMaterial, { isLoading }] = useCreateMaterialMutation();
  const { data: warehouses = [] } = useGetWarehousesDirectoryQuery();
  const user = useSelector((s: RootState) => s.auth.user);

  const isWorker = user?.role === 'WORKER';
  const isAdmin = user?.role === 'ADMIN';

  const warehouseOptions = warehouses.map((w) => ({
    value: w.warehouseId,
    label: w.warehouseId,
  }));

  useEffect(() => {
    if (open && isWorker && user?.warehouseId) {
      form.setFieldValue('warehouses', [user.warehouseId]);
    }
  }, [open, isWorker, user, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await createMaterial(values).unwrap();
      message.success('Материал создан');
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(getApiErrorMessage(e, 'Ошибка при создании материала'));
    }
  };

  return (
    <Modal
      open={open}
      title="Новый материал"
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      confirmLoading={isLoading}
      okText="Создать"
      cancelText="Отмена"
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="small">
        <Form.Item name="article" label="Артикул" rules={[{ required: true, message: 'Введите артикул' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label="Наименование" rules={[{ required: true, message: 'Введите наименование' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="category" label="Категория" rules={[{ required: true, message: 'Выберите категорию' }]}>
          <Select options={CATEGORY_OPTIONS} />
        </Form.Item>
        <Form.Item name="unit" label="Ед. изм." rules={[{ required: true, message: 'Выберите единицу измерения' }]}>
          <Select
            options={UNIT_OPTIONS}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder="шт, кг, м и т.д."
          />
        </Form.Item>
        <Form.Item name="criticalStock" label="Критический остаток" rules={[{ required: true, message: 'Введите критический остаток' }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="storageLocation" label="Место хранения" rules={[{ required: true, message: 'Введите место хранения' }]}>
          <Input placeholder="Стеллаж A" />
        </Form.Item>

        {/* Склады: WORKER — автозаполняется и нередактируем; ADMIN — мультиселект */}
        {isWorker && (
          <Form.Item name="warehouses" label="Склад">
            <Select
              mode="multiple"
              options={warehouseOptions}
              disabled
              placeholder="Заполняется автоматически"
            />
          </Form.Item>
        )}
        {isAdmin && (
          <Form.Item name="warehouses" label="Склады">
            <Select
              mode="multiple"
              options={warehouseOptions}
              placeholder="Выберите склады из списка"
              allowClear
            />
          </Form.Item>
        )}

        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
