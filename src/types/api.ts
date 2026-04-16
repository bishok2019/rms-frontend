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
  category: number | KitchenCategory; // Can be id or full object
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

export interface OrderItem {
  id: number;
  orderType: "dine_in" | "takeaway" | "delivery";
  order: number;
  orderItem: number | string | NamedRelation;
  quantity: number;
  dietaryType: "veg" | "non_veg" | "vegan" | "gluten_free";
  spiceLevel: "none" | "mild" | "medium" | "hot" | "extra_hot";
  servingSize: string;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  preparedAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  customer: Customer | null;
  orderNumber: string;
  diningTable: number | string | NamedRelation | null;
  section: string | null;
  deliveryAddress: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled";
  paymentMethod: "cash" | "card" | "online" | "wallet" | null;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  servedBy: string | null;
  totalItems: number;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}
