import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { setToken, setUser } from '../features/auth/authSlice';
import { authApi, useLoginMutation, useGetMeQuery } from '../features/auth/authApi';
import type { User } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const [login, { isLoading, error }] = useLoginMutation();

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const onFinish = async (values: { login: string; password: string }) => {
    try {
      const res = await login(values).unwrap();
      const tokenStr = typeof res === 'string' ? res : (res as { token?: string }).token ?? String(res);
      dispatch(setToken(tokenStr));

      // Сразу грузим юзера, чтобы сайдбар отобразился без задержки после перехода
      const meResult = await dispatch(
        authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })
      );
      if ('data' in meResult && meResult.data) {
        dispatch(setUser(meResult.data as User));
      }

      navigate('/', { replace: true });
    } catch { /* ошибка показывается через error */ }
  };

  const errorMsg = error
    ? (error && typeof error === 'object' && 'data' in error
        ? (error.data as { message?: string })?.message ?? 'Неверный логин или пароль'
        : 'Ошибка соединения с сервером')
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
    }}>
      <Card style={{ width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <InboxOutlined style={{ fontSize: 40, color: '#1677ff' }} />
          <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 2 }}>
            Система управления складом
          </Typography.Title>
          <Typography.Text type="secondary">Введите данные для входа</Typography.Text>
        </div>

        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="login"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Логин" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export function UserLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);
  const { data } = useGetMeQuery(undefined, { skip: !token || !!user });

  useEffect(() => {
    if (data) dispatch(setUser(data));
  }, [data, dispatch]);

  return <>{children}</>;
}
