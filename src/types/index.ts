export type Role = 'ADMIN' | 'WORKER' | 'EMPLOYEE' | 'MANAGER';

export type RequestType = 'ISSUE' | 'REPLENISHMENT' | 'RECEIPT' | 'RETURN';

export type RequestStatus =
  | 'UNDER_CONSIDERATION'
  | 'APPROVED'
  | 'WAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'SENT_FOR_REVISION'
  | 'CANCELLED'
  | 'ACCEPTED';

export type MaterialStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';

export type MaterialCategory =
  | 'RAW_MATERIAL'
  | 'CONSUMABLE'
  | 'SPARE_PART'
  | 'EQUIPMENT'
  | 'OTHER';

export interface User {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  active: boolean;
  deleted?: boolean;
  warehouseId?: string;
  productionLineIds?: string[];
  managedWarehouseIds?: string[];
  // Бэкенд: regDate
  regDate?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface MaterialBatch {
  id?: string;
  batchNumber?: string;
  receiptDate?: string;
  initialQuantity: number;
  currentQuantity: number;
  storageLocation?: string;
  expiryDate?: string;
  receiptActNumber?: string;
  acceptedByUserId?: string;
  acceptedByName?: string;
  confirmedByUserId?: string;
  confirmedByName?: string;
}

export interface Material {
  id: string;
  article: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  currentStock: number;
  criticalStock: number;
  status: MaterialStatus;
  storageLocation?: string;
  description?: string;
  warehouses?: string[];
  batches?: MaterialBatch[];
  archived?: boolean;
  lastReceiptDate?: string;
  lastIssueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  exactLocation?: string;
}

export interface Request {
  id: string;
  // Бэкенд возвращает поле "number"
  number?: string;
  requestNumber?: string;
  type: RequestType;
  status: RequestStatus;
  // Бэкенд: createdDate
  createdDate?: string;
  createdAt?: string;
  // Бэкенд: requesterId / requesterName / requesterRole
  requesterId?: string;
  requesterName?: string;
  requesterRole?: string;
  createdByUserId?: string;
  createdByName?: string;
  sourceId?: string;
  sourceName?: string;
  destinationId?: string;
  destinationName?: string;
  items: RequestItem[];
  comment?: string;
  archived?: boolean;
}

export interface EventLog {
  id: string;
  // Бэкенд: timestamp
  timestamp?: string;
  createdAt?: string;
  userId?: string;
  userFullName?: string;
  userRole?: Role;
  eventType: string;
  objectType?: string;
  objectId?: string;
  objectNumber?: string;
  description?: string;
  result?: string;
  warehouseId?: string;
  productionLineId?: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface CreateUserRequest {
  login: string;
  fullName: string;
  password: string;
  role: Role;
  warehouseId?: string;
  productionLineIds?: string[];
  managedWarehouseIds?: string[];
}

export interface UpdateUserRequest {
  fullName?: string;
  login?: string;
  role?: Role;
  warehouseId?: string;
  productionLineIds?: string[];
  managedWarehouseIds?: string[];
}

export interface CreateMaterialRequest {
  article: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  currentStock?: number;
  criticalStock: number;
  storageLocation?: string;
  description?: string;
  warehouses?: string[];
}

export interface CreateRequestPayload {
  type: RequestType;
  sourceId?: string;
  sourceName?: string;
  destinationId?: string;
  destinationName?: string;
  items: RequestItem[];
  orderNumber?: string;
  comment?: string;
}
