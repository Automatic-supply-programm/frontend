import type { Role } from '../types';

export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: string;
}

const ALL_NAV: NavItem[] = [
  { key: 'dashboard', path: '/', label: 'Главная', icon: 'HomeOutlined' },
  { key: 'warehouse', path: '/warehouse', label: 'Склад', icon: 'InboxOutlined' },
  { key: 'requests', path: '/requests', label: 'Заявки', icon: 'FileTextOutlined' },
  { key: 'users', path: '/users', label: 'Пользователи', icon: 'TeamOutlined' },
  { key: 'event-logs', path: '/event-logs', label: 'Журнал событий', icon: 'AuditOutlined' },
  { key: 'manager-logs', path: '/manager-logs', label: 'Журнал склада', icon: 'AuditOutlined' },
];

const ROLE_NAV_KEYS: Record<Role, string[]> = {
  ADMIN: ['dashboard', 'warehouse', 'requests', 'users', 'event-logs'],
  WORKER: ['dashboard', 'warehouse', 'requests'],
  EMPLOYEE: ['dashboard', 'requests'],
  MANAGER: ['dashboard', 'warehouse', 'requests', 'users', 'manager-logs'],
};

export function getNavItems(role: Role): NavItem[] {
  const keys = ROLE_NAV_KEYS[role] ?? [];
  return ALL_NAV.filter((item) => keys.includes(item.key));
}

export function canAccess(role: Role, routeKey: string): boolean {
  return ROLE_NAV_KEYS[role]?.includes(routeKey) ?? false;
}
