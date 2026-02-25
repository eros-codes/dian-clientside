//types
export type Role = "ADMIN" | "USER";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERED"
  | "PAID"
  | "CANCELLED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  iban?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  discountPercent?: number;
  type?: 'CAFE' | 'RESTAURANT' | 'BREAKFAST';
  iconId?: string | null;
  iconPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  publicId?: string | null;
}

export interface ProductOption {
  id: number;
  name: string;
  additionalPrice: number;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isAvailable: boolean;
  soldCount?: number;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  options?: ProductOption[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  minThreshold: number;
  lastUpdated: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  product?: Product;
  productName?: string;
  productImages?: ProductImage[];
  options?: SelectedOption[];
}

export interface Order {
  id: string;
  userId?: string;
  tableNumber: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: 'ONLINE' | 'COD';
  trackingCode?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  notes?: string | null;
  shippingAddress?: {
    province?: string;
    city?: string;
    street?: string;
    postalCode?: string;
    phone?: string;
  } | null;
}

export interface Return {
  id: string;
  orderId: string;
  userId?: string | null;
  status: string;
  reason: string;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiningTable {
  id: string;
  staticId: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  baseUnitPrice: number;
  options?: SelectedOption[];
  optionsSubtotal?: number;
}

export interface SelectedOption {
  id?: number;
  name: string;
  additionalPrice: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}
