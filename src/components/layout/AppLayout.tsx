import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, theme } from 'antd';
import {
  HomeOutlined,
  InboxOutlined,
  FileTextOutlined,
  TeamOutlined,
  AuditOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { baseApi } from '../../api/baseApi';
import { getNavItems } from '../../utils/roleAccess';
import { ROLE_LABELS } from '../../utils/statusLabels';

const { Header, Sider, Content } = Layout;

const ICON_MAP: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  InboxOutlined: <InboxOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  TeamOutlined: <TeamOutlined />,
  AuditOutlined: <AuditOutlined />,
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [logoutMutation] = useLogoutMutation();
  const { token: designToken } = theme.useToken();

  const navItems = user ? getNavItems(user.role) : [];

  const selectedKey = navItems.find((item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  })?.key ?? 'dashboard';

  const handleLogout = async () => {
    try { await logoutMutation(); } catch { /* ignore */ }
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Выйти',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={{ background: designToken.colorBgContainer, borderRight: `1px solid ${designToken.colorBorderSecondary}` }}
        width={220}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 16px',
          borderBottom: `1px solid ${designToken.colorBorderSecondary}`,
        }}>
          <InboxOutlined style={{ fontSize: 22, color: designToken.colorPrimary }} />
          {!collapsed && (
            <Typography.Text strong style={{ marginLeft: 10, fontSize: 15, color: designToken.colorPrimary }}>
              Склад
            </Typography.Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: 'none', marginTop: 8 }}
          items={navItems.map((item) => ({
            key: item.key,
            icon: ICON_MAP[item.icon],
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: designToken.colorBgContainer,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${designToken.colorBorderSecondary}`,
          height: 64,
        }}>
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', fontSize: 18, color: designToken.colorText }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          {user && (
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: designToken.colorPrimary }} />
                <div style={{ lineHeight: 1.2 }}>
                  <Typography.Text strong style={{ display: 'block', fontSize: 13 }}>
                    {user.fullName}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {ROLE_LABELS[user.role]}
                  </Typography.Text>
                </div>
              </Space>
            </Dropdown>
          )}
        </Header>

        <Content style={{ padding: 24, background: designToken.colorBgLayout, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
