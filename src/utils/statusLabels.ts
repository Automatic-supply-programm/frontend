import type { RequestStatus, RequestType, MaterialStatus, MaterialCategory, Role } from '../types';

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  UNDER_CONSIDERATION: 'На рассмотрении',
  APPROVED: 'Одобрена',
  WAITING_CONFIRMATION: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждена',
  REJECTED: 'Отклонена',
  SENT_FOR_REVISION: 'На доработке',
  CANCELLED: 'Отменена',
  ACCEPTED: 'Принята',
};

export const REQUEST_STATUS_COLOR: Record<RequestStatus, string> = {
  UNDER_CONSIDERATION: 'blue',
  APPROVED: 'green',
  WAITING_CONFIRMATION: 'orange',
  CONFIRMED: 'green',
  REJECTED: 'red',
  SENT_FOR_REVISION: 'gold',
  CANCELLED: 'default',
  ACCEPTED: 'cyan',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  ISSUE: 'На обеспечение',
  REPLENISHMENT: 'На пополнение',
  RECEIPT: 'На оформление поступления',
  RETURN: 'Возврат остатка',
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  NORMAL: 'В норме',
  LOW: 'Низкий',
  CRITICAL: 'Критический',
  OUT_OF_STOCK: 'Отсутствует',
};

export const MATERIAL_STATUS_COLOR: Record<MaterialStatus, string> = {
  NORMAL: 'green',
  LOW: 'gold',
  CRITICAL: 'orange',
  OUT_OF_STOCK: 'default',
};

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  RAW_MATERIAL: 'Сырьё',
  CONSUMABLE: 'Расходный материал',
  SPARE_PART: 'Запчасть',
  EQUIPMENT: 'Оборудование',
  OTHER: 'Прочее',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  BATCH_RECEIVED: 'Поступление',
  MATERIALS_ISSUED: 'Выдача',
  REQUEST_STATUS_CHANGED: 'Смена статуса',
  REQUEST_CREATED: 'Создание заявки',
  REQUEST_UPDATED: 'Изменение заявки',
  REQUEST_ARCHIVED: 'Архивирование заявки',
  MATERIAL_CREATED: 'Создание материала',
  MATERIAL_UPDATED: 'Изменение материала',
  MATERIAL_ARCHIVED: 'Архивирование материала',
  LOGIN: 'Вход в систему',
  LOGOUT: 'Выход из системы',
};

export const RESULT_LABELS: Record<string, string> = {
  CREATED: 'Создано',
  UPDATED: 'Обновлено',
  RECEIVED: 'Получено',
  CONFIRMED: 'Подтверждено',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
  ACCEPTED: 'Принято',
  CANCELLED: 'Отменено',
  ARCHIVED: 'Архивировано',
  WAITING_CONFIRMATION: 'Ожидает подтверждения',
  SENT_FOR_REVISION: 'На доработке',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Администратор',
  WORKER: 'Работник склада',
  EMPLOYEE: 'Сотрудник участка',
  MANAGER: 'Менеджер',
};
