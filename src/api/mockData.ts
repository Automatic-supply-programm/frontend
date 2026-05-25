import type { User, Material, Request, EventLog } from '../types';

export const mockUser: User = {
  id: 'mock-admin-1',
  login: 'admin',
  fullName: 'Казанцев А.В.',
  role: 'ADMIN',
  active: true,
  createdAt: '2025-01-10T09:00:00',
  lastLogin: '2026-05-24T08:45:00',
};

export const mockMaterials: Material[] = [
  {
    id: 'm1', article: 'MAT-001', name: 'Труба стальная ДУ50', category: 'RAW_MATERIAL',
    unit: 'м', currentStock: 120, criticalStock: 50, status: 'NORMAL',
    storageLocation: 'Стеллаж A-1', warehouses: ['WH001'],
    batches: [
      { id: 'b1', batchNumber: 'П-001', receiptDate: '2026-01-15T00:00:00', initialQuantity: 200, currentQuantity: 120, storageLocation: 'Стеллаж A-1', receiptActNumber: 'АП-001', acceptedByName: 'Иванов И.И.', confirmedByName: 'Петров П.П.' },
      { id: 'b2', batchNumber: 'П-002', receiptDate: '2026-03-20T00:00:00', initialQuantity: 100, currentQuantity: 0, storageLocation: 'Стеллаж A-2', receiptActNumber: 'АП-002', acceptedByName: 'Иванов И.И.', confirmedByName: 'Петров П.П.' },
    ],
  },
  {
    id: 'm2', article: 'MAT-002', name: 'Болт М10×40 ГОСТ 7798', category: 'CONSUMABLE',
    unit: 'шт', currentStock: 18, criticalStock: 100, status: 'CRITICAL',
    storageLocation: 'Стеллаж B-3', warehouses: ['WH001'],
    batches: [
      { id: 'b3', batchNumber: 'П-003', receiptDate: '2026-02-01T00:00:00', initialQuantity: 500, currentQuantity: 18, storageLocation: 'Стеллаж B-3', receiptActNumber: 'АП-010', acceptedByName: 'Сидоров В.А.' },
    ],
  },
  {
    id: 'm3', article: 'MAT-003', name: 'Масло индустриальное И-20А', category: 'CONSUMABLE',
    unit: 'л', currentStock: 0, criticalStock: 20, status: 'OUT_OF_STOCK',
    storageLocation: 'Склад ГСМ', warehouses: ['WH002'],
    batches: [],
  },
  {
    id: 'm4', article: 'MAT-004', name: 'Гайка М10 ГОСТ 5915', category: 'CONSUMABLE',
    unit: 'шт', currentStock: 340, criticalStock: 100, status: 'NORMAL',
    storageLocation: 'Стеллаж B-4', warehouses: ['WH001'],
    batches: [],
  },
  {
    id: 'm5', article: 'MAT-005', name: 'Подшипник 6205-2RS', category: 'SPARE_PART',
    unit: 'шт', currentStock: 7, criticalStock: 10, status: 'LOW',
    storageLocation: 'Стеллаж C-1', warehouses: ['WH001'],
    batches: [],
  },
  {
    id: 'm6', article: 'MAT-006', name: 'Электрод МР-3 ф3мм', category: 'CONSUMABLE',
    unit: 'кг', currentStock: 55, criticalStock: 20, status: 'NORMAL',
    storageLocation: 'Стеллаж D-2', warehouses: ['WH001'],
    batches: [],
  },
  {
    id: 'm7', article: 'MAT-007', name: 'Шланг резиновый ф10мм', category: 'RAW_MATERIAL',
    unit: 'м', currentStock: 90, criticalStock: 30, status: 'NORMAL',
    storageLocation: 'Стеллаж A-3', warehouses: ['WH001'],
    archived: true,
    batches: [],
  },
];

export const mockRequests: Request[] = [
  {
    id: 'req-001', requestNumber: 'REQ-2026-001', type: 'ISSUE', status: 'UNDER_CONSIDERATION',
    createdAt: '2026-05-20T10:30:00', createdByName: 'Соколова М.В.',
    sourceName: 'Участок сборки №1', destinationName: 'Иванов И.И. (склад)',
    items: [{ materialId: 'm1', materialName: 'Труба стальная ДУ50', quantity: 10, unit: 'м' }],
    comment: 'Для ремонта трубопровода',
  },
  {
    id: 'req-002', requestNumber: 'REQ-2026-002', type: 'REPLENISHMENT', status: 'APPROVED',
    createdAt: '2026-05-18T14:00:00', createdByName: 'Иванов И.И.',
    sourceName: 'Склад №1', destinationName: 'Петров П.П. (менеджер)',
    items: [
      { materialId: 'm2', materialName: 'Болт М10×40 ГОСТ 7798', quantity: 500, unit: 'шт' },
      { materialId: 'm3', materialName: 'Масло индустриальное И-20А', quantity: 50, unit: 'л' },
    ],
    comment: 'Критический уровень запасов',
  },
  {
    id: 'req-003', requestNumber: 'REQ-2026-003', type: 'ISSUE', status: 'WAITING_CONFIRMATION',
    createdAt: '2026-05-22T09:15:00', createdByName: 'Громов А.С.',
    sourceName: 'Участок сборки №2', destinationName: 'Иванов И.И. (склад)',
    items: [{ materialId: 'm4', materialName: 'Гайка М10 ГОСТ 5915', quantity: 50, unit: 'шт' }],
  },
  {
    id: 'req-004', requestNumber: 'REQ-2026-004', type: 'RECEIPT', status: 'UNDER_CONSIDERATION',
    createdAt: '2026-05-23T11:00:00', createdByName: 'Иванов И.И.',
    sourceName: 'Склад №1', destinationName: 'Петров П.П. (менеджер)',
    items: [{ materialId: 'm3', materialName: 'Масло индустриальное И-20А', quantity: 100, unit: 'л' }],
  },
  {
    id: 'req-005', requestNumber: 'REQ-2026-005', type: 'RETURN', status: 'CONFIRMED',
    createdAt: '2026-05-15T16:40:00', createdByName: 'Соколова М.В.',
    sourceName: 'Участок сборки №1', destinationName: 'Иванов И.И. (склад)',
    items: [{ materialId: 'm4', materialName: 'Гайка М10 ГОСТ 5915', quantity: 10, unit: 'шт' }],
    comment: 'Возврат излишка',
  },
  {
    id: 'req-006', requestNumber: 'REQ-2026-006', type: 'ISSUE', status: 'REJECTED',
    createdAt: '2026-05-10T08:00:00', createdByName: 'Громов А.С.',
    sourceName: 'Участок сварки', destinationName: 'Иванов И.И. (склад)',
    items: [{ materialId: 'm5', materialName: 'Подшипник 6205-2RS', quantity: 5, unit: 'шт' }],
    comment: 'Отклонено: нет в наличии',
  },
];

export const mockUsers: User[] = [
  { id: 'u1', login: 'admin', fullName: 'Казанцев А.В.', role: 'ADMIN', active: true, createdAt: '2025-01-10T09:00:00', lastLogin: '2026-05-24T08:45:00' },
  { id: 'u2', login: 'worker', fullName: 'Иванов Иван Иванович', role: 'WORKER', active: true, createdAt: '2025-01-15T10:00:00', lastLogin: '2026-05-23T17:30:00' },
  { id: 'u3', login: 'manager', fullName: 'Петров Пётр Петрович', role: 'MANAGER', active: true, createdAt: '2025-01-15T10:05:00', lastLogin: '2026-05-22T12:00:00' },
  { id: 'u4', login: 'employee1', fullName: 'Соколова Мария Викторовна', role: 'EMPLOYEE', active: true, createdAt: '2025-02-01T09:00:00', lastLogin: '2026-05-24T07:50:00' },
  { id: 'u5', login: 'employee2', fullName: 'Громов Алексей Сергеевич', role: 'EMPLOYEE', active: true, createdAt: '2025-02-05T09:00:00', lastLogin: '2026-05-21T15:20:00' },
  { id: 'u6', login: 'worker2', fullName: 'Сидоров Василий Анатольевич', role: 'WORKER', active: false, createdAt: '2025-03-10T09:00:00', lastLogin: '2026-04-30T09:00:00' },
];

export const mockEventLogs: EventLog[] = [
  { id: 'e1', createdAt: '2026-05-24T08:45:00', userFullName: 'Казанцев А.В.', userRole: 'ADMIN', eventType: 'LOGIN', description: 'Вход в систему', result: 'SUCCESS' },
  { id: 'e2', createdAt: '2026-05-24T07:50:00', userFullName: 'Соколова М.В.', userRole: 'EMPLOYEE', eventType: 'REQUEST_CREATE', objectType: 'REQUEST', objectId: 'req-001', description: 'Создана заявка REQ-2026-001 на выдачу', result: 'SUCCESS' },
  { id: 'e3', createdAt: '2026-05-23T17:30:00', userFullName: 'Иванов И.И.', userRole: 'WORKER', eventType: 'MATERIAL_UPDATE', objectType: 'MATERIAL', objectId: 'm2', description: 'Обновлена карточка материала: Болт М10×40', result: 'SUCCESS' },
  { id: 'e4', createdAt: '2026-05-23T15:10:00', userFullName: 'Петров П.П.', userRole: 'MANAGER', eventType: 'REQUEST_STATUS', objectType: 'REQUEST', objectId: 'req-002', description: 'Заявка REQ-2026-002 одобрена', result: 'SUCCESS' },
  { id: 'e5', createdAt: '2026-05-22T12:00:00', userFullName: 'Петров П.П.', userRole: 'MANAGER', eventType: 'LOGIN', description: 'Вход в систему', result: 'SUCCESS' },
  { id: 'e6', createdAt: '2026-05-22T09:15:00', userFullName: 'Громов А.С.', userRole: 'EMPLOYEE', eventType: 'REQUEST_CREATE', objectType: 'REQUEST', objectId: 'req-003', description: 'Создана заявка REQ-2026-003 на выдачу', result: 'SUCCESS' },
  { id: 'e7', createdAt: '2026-05-21T16:00:00', userFullName: 'Иванов И.И.', userRole: 'WORKER', eventType: 'BATCH_ADD', objectType: 'MATERIAL', objectId: 'm1', description: 'Добавлена партия П-002 к материалу Труба стальная ДУ50', result: 'SUCCESS' },
  { id: 'e8', createdAt: '2026-05-20T11:30:00', userFullName: 'Казанцев А.В.', userRole: 'ADMIN', eventType: 'USER_CREATE', objectType: 'USER', description: 'Создан пользователь Громов А.С.', result: 'SUCCESS' },
];

export const mockDashboard = {
  totalUsers: 6,
  activeUsers: 5,
  totalMaterials: 6,
  activeRequests: 4,
  deficitCount: 2,
  pendingIssues: 1,
  pendingReceipts: 1,
  warehouseMaterials: 6,
  totalActive: 3,
  underConsideration: 1,
  approved: 1,
  rejected: 1,
  replenishmentRequests: 2,
  replenishmentPending: 1,
  replenishmentApproved: 1,
};

export const mockDashboardRecent = mockEventLogs.slice(0, 8);
export const mockEventLogTypes = ['LOGIN', 'LOGOUT', 'REQUEST_CREATE', 'REQUEST_STATUS', 'MATERIAL_UPDATE', 'BATCH_ADD', 'USER_CREATE', 'USER_UPDATE'];
