import { useState, useMemo } from 'react';
import {
  Table, Button, Tag, Space, Popconfirm, Typography, Modal, Form,
  Input, Select, Row, Col, message, Checkbox
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  StopOutlined, CheckCircleOutlined, KeyOutlined, SearchOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import {
  useGetAdminUsersQuery, useGetManagerUsersQuery,
  useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation,
  useToggleUserAccessMutation, useChangePasswordMutation,
} from '../features/users/usersApi';
import type { User, Role } from '../types';
import { ROLE_LABELS } from '../utils/statusLabels';
import dayjs from 'dayjs';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }));

export default function UsersPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data: adminUsers = [], isLoading: loadingAdmin } = useGetAdminUsersQuery(undefined, { skip: !isAdmin });
  const { data: managerUsers = [], isLoading: loadingManager } = useGetManagerUsersQuery(undefined, { skip: isAdmin });

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [toggleAccess] = useToggleUserAccessMutation();
  const [changePassword, { isLoading: changingPwd }] = useChangePasswordMutation();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const allUsers = isAdmin ? adminUsers : managerUsers;
  const loading = isAdmin ? loadingAdmin : loadingManager;

  const users = useMemo(() => {
    return allUsers.filter((u) => {
      if (!showBlocked && !u.active) return false;
      if (roleFilter && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.fullName.toLowerCase().includes(q) && !u.login.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allUsers, search, roleFilter, showBlocked]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        ...values,
        productionLineIds: values.productionLineIds
          ? String(values.productionLineIds).split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined,
        managedWarehouseIds: values.managedWarehouseIds
          ? String(values.managedWarehouseIds).split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined,
      };
      await createUser(payload).unwrap();
      message.success('Пользователь создан');
      createForm.resetFields();
      setCreateOpen(false);
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Ошибка при создании пользователя');
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    try {
      const values = await editForm.validateFields();
      const payload = {
        ...values,
        productionLineIds: values.productionLineIds !== undefined
          ? String(values.productionLineIds).split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined,
        managedWarehouseIds: values.managedWarehouseIds !== undefined
          ? String(values.managedWarehouseIds).split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined,
      };
      await updateUser({ id: editUser.id, data: payload }).unwrap();
      message.success('Пользователь обновлён');
      setEditUser(null);
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Ошибка при обновлении');
    }
  };

  const handleChangePwd = async () => {
    if (!pwdUser) return;
    try {
      const values = await pwdForm.validateFields();
      await changePassword({ id: pwdUser.id, newPassword: values.newPassword }).unwrap();
      message.success('Пароль изменён');
      pwdForm.resetFields();
      setPwdUser(null);
    } catch (e: unknown) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Ошибка при смене пароля');
    }
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    editForm.setFieldsValue({
      fullName: u.fullName,
      login: u.login,
      role: u.role,
      warehouseId: u.warehouseId ?? '',
      productionLineIds: u.productionLineIds?.join(', ') ?? '',
      managedWarehouseIds: u.managedWarehouseIds?.join(', ') ?? '',
    });
  };

  const columns = [
    { title: 'ФИО', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Логин', dataIndex: 'login', key: 'login', width: 130 },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 180,
      render: (v: Role) => ROLE_LABELS[v] ?? v,
    },
    {
      title: 'Статус',
      dataIndex: 'active',
      key: 'active',
      width: 160,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Активен' : 'Приостановлен'}
        </Tag>
      ),
    },
    {
      title: 'Дата создания',
      key: 'regDate',
      width: 130,
      render: (_: unknown, u: User) => {
        const d = u.regDate ?? u.createdAt;
        return d ? dayjs(d).format('DD.MM.YYYY') : '—';
      },
    },
    {
      title: 'Последний вход',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (v: string) => v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
    },
    ...(isAdmin ? [{
      title: 'Действия',
      key: 'actions',
      width: 220,
      render: (_: unknown, u: User) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(u)} />
          <Button size="small" icon={<KeyOutlined />} onClick={() => setPwdUser(u)} />
          <Popconfirm
            title={u.active ? 'Приостановить доступ?' : 'Восстановить доступ?'}
            onConfirm={() => toggleAccess({ id: u.id, active: !u.active })}
            okText="Да" cancelText="Нет"
          >
            <Button
              size="small"
              icon={u.active ? <StopOutlined /> : <CheckCircleOutlined />}
              danger={u.active}
            />
          </Popconfirm>
          <Popconfirm
            title="Удалить пользователя? Его действия в журнале сохранятся, но вход будет невозможен."
            onConfirm={() => deleteUser(u.id)}
            okText="Удалить" cancelText="Отмена"
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Typography.Title level={4} style={{ margin: 0 }}>Пользователи</Typography.Title>
        </Col>
        {isAdmin && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Добавить пользователя
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10} md={7}>
          <Input
            placeholder="Поиск по ФИО / логину"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={7} md={5}>
          <Select
            placeholder="Роль"
            value={roleFilter || undefined}
            onChange={setRoleFilter}
            allowClear
            style={{ width: '100%' }}
            options={ROLE_OPTIONS}
          />
        </Col>
        <Col xs={12} sm={7} md={5} style={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox checked={showBlocked} onChange={(e) => setShowBlocked(e.target.checked)}>
            Показать заблокированных
          </Checkbox>
        </Col>
      </Row>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        locale={{ emptyText: 'Нет пользователей' }}
      />

      {/* Создание пользователя */}
      <Modal
        open={createOpen}
        title="Новый пользователь"
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="Создать"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" size="small">
          <Form.Item name="fullName" label="ФИО" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="login" label="Логин" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Роль" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.role !== curr.role}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              if (role === 'WORKER') return (
                <>
                  <Form.Item name="warehouseId" label="ID склада">
                    <Input placeholder="Например: WAREHOUSE_001" />
                  </Form.Item>
                  <Form.Item name="productionLineIds" label="Производственные участки (через запятую)">
                    <Input placeholder="LINE_001, LINE_002" />
                  </Form.Item>
                </>
              );
              if (role === 'MANAGER') return (
                <Form.Item name="managedWarehouseIds" label="Подконтрольные склады (через запятую)">
                  <Input placeholder="WAREHOUSE_001, WAREHOUSE_002" />
                </Form.Item>
              );
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Редактирование пользователя */}
      <Modal
        open={!!editUser}
        title="Редактировать пользователя"
        onCancel={() => setEditUser(null)}
        onOk={handleEdit}
        confirmLoading={updating}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" size="small">
          <Form.Item name="fullName" label="ФИО" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="login" label="Логин" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Роль">
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.role !== curr.role}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              if (role === 'WORKER') return (
                <>
                  <Form.Item name="warehouseId" label="ID склада">
                    <Input placeholder="WAREHOUSE_001" />
                  </Form.Item>
                  <Form.Item name="productionLineIds" label="Производственные участки (через запятую)">
                    <Input placeholder="LINE_001, LINE_002" />
                  </Form.Item>
                </>
              );
              if (role === 'MANAGER') return (
                <Form.Item name="managedWarehouseIds" label="Подконтрольные склады (через запятую)">
                  <Input placeholder="WAREHOUSE_001, WAREHOUSE_002" />
                </Form.Item>
              );
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Смена пароля */}
      <Modal
        open={!!pwdUser}
        title={`Сменить пароль — ${pwdUser?.fullName ?? ''}`}
        onCancel={() => { setPwdUser(null); pwdForm.resetFields(); }}
        onOk={handleChangePwd}
        confirmLoading={changingPwd}
        okText="Сменить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical" size="small">
          <Form.Item name="newPassword" label="Новый пароль" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
