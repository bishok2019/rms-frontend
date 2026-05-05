export interface ApiMetaData {
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  detail?: string | null;
  errors?: Record<string, unknown>;
  metaData?: ApiMetaData;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  totalCount: number;
  currentCount: number;
  totalPages: number;
  currentPage: number;
  next: string | null;
  previous: string | null;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  isSuperuser: boolean;
  permissions: string[];
  roles: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  metaData: ApiMetaData;
  access: string;
  refresh: string;
  username: string;
  email: string | null;
  fullName: string;
  isSuperuser: boolean;
  id: number;
  permissions: string[];
  roles: string[];
}

export interface Section {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  totalTables: string;
  tablesOccupied: number;
  tablesAvailable: number;
}

export interface DiningTable {
  id: number;
  tableNumber: string;
  seatingCapacity: number;
  isOccupied: boolean;
  section: number | null;
  specialRequests: string;
  canHaveMultipleOrders: boolean;
}

export interface MenuCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  totalMenuItems: number;
}

export interface NamedRelation {
  id: number;
  name: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: number | string | NamedRelation;
  price: number;
  discountPrice: number | null;
  photo: string;
  kitchen: number | string | NamedRelation | null;
  isAvailable: boolean;
  displayOrder: number;
  parent: number | null;
  isVariant: boolean;
}

export interface KitchenCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export interface Kitchen {
  id: number;
  category: number | string | KitchenCategory; // Can be id, name, or full object
  name: string;
  location: string;
  maxCapacity: number | null;
}

export interface LocationOption {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderType = "dine_in" | "takeaway" | "delivery";
export type DietaryType = "veg" | "non_veg" | "vegan" | "gluten_free";
export type SpiceLevel = "none" | "mild" | "medium" | "hot" | "extra_hot";
export type OrderItemStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled";
export type OrderPaymentMethod = "cash" | "card" | "online" | "wallet" | "" | null;
export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: number;
  orderType: OrderType;
  order: number;
  orderItem: number | string | NamedRelation | null;
  menu_item?: NamedRelation | null;
  quantity: number;
  dietaryType: DietaryType;
  dietary_type?: string;
  spiceLevel: SpiceLevel;
  spice_level?: string;
  servingSize: string;
  status: OrderItemStatus;
  preparedAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
  note: string | null;
  special_instructions: string | null;
  tableNumber?: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  deliveryAddress: string;
  status: OrderStatus;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  deliveryCharge: string;
  confirmedAt: string | null;
  completedAt: string | null;
  customer: Customer | number | null;
  diningTable: number | string | null;
  servedBy: number | string | null;
  createdAt?: string;
  totalItems?: number;
  section?: string | null;
  orderItems?: OrderItem[];
}
