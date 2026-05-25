import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';
import type { RootState } from '../../app/store';
import { canAccess } from '../../utils/roleAccess';

interface Props {
  routeKey: string;
  children: React.ReactNode;
}

export default function RoleGuard({ routeKey, children }: Props) {
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);

  // Нет токена — явно не авторизован
  if (!token) return <Navigate to="/login" replace />;

  // Токен есть, но /user/me ещё не вернул данные — ждём
  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  if (!canAccess(user.role, routeKey)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
