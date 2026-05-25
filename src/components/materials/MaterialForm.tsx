import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { useCreateMaterialMutation } from '../../features/materials/materialsApi';
import { MATERIAL_CATEGORY_LABELS } from '../../utils/statusLabels';
import type { CreateMaterialRequest } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS = Object.entries(MATERIAL_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));

export default function MaterialForm({ open, onClose }: Props) {
  const [form] = Form.useForm<CreateMaterialRequest>();
  const [createMaterial, { isLoading }] = useCreateMaterialMutation();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await createMaterial(values).unwrap();
      message.success('Материал создан');
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Ошибка при создании материала');
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
        <Form.Item name="article" label="Артикул *" rules={[{ required: true, message: 'Введите артикул' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label="Наименование *" rules={[{ required: true, message: 'Введите наименование' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="category" label="Категория *" rules={[{ required: true, message: 'Выберите категорию' }]}>
          <Select options={CATEGORY_OPTIONS} />
        </Form.Item>
        <Form.Item name="unit" label="Ед. изм. *" rules={[{ required: true, message: 'Введите единицу измерения' }]}>
          <Input placeholder="шт, кг, м и т.д." />
        </Form.Item>
        <Form.Item name="criticalStock" label="Критический остаток *" rules={[{ required: true, message: 'Введите критический остаток' }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="storageLocation" label="Место хранения *" rules={[{ required: true, message: 'Введите место хранения' }]}>
          <Input placeholder="Стеллаж A" />
        </Form.Item>
        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
