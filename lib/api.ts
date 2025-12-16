import { z } from "zod";
import {
  User,
  Product,
  ProductOption,
  Category,
  Order,
  OrderItem,
  Inventory,
  AuthTokens,
  PaginatedResponse,
} from "@/types";
import {
  userSchema,
  productSchema,
  categorySchema,
  orderSchema,
  returnSchema,
  inventorySchema,
  authTokensSchema,
  paginatedResponseSchema,
} from "@/lib/validations";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const NORMALIZED_BASE_URL = BASE_URL.replace(/\/+$/, "");
export const apiBaseUrl = NORMALIZED_BASE_URL;
const DEBUG = (typeof process !== 'undefined' && String(process.env.NEXT_PUBLIC_API_DEBUG) === 'true') || false;
const TABLE_SESSION_STORAGE_KEY = 'currentTable';
const TABLE_SESSION_EVENT = 'currentTableUpdated';
const TABLE_SESSION_HEADER = 'x-table-session';

const fallbackTimestamp = () => new Date().toISOString();

function normalizeCategory(raw?: Partial<Category>): Category {
  return {
    id: raw?.id ?? '',
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    isActive: raw?.isActive ?? true,
    discountPercent: raw?.discountPercent,
    type: raw?.type,
    iconId: raw?.iconId ?? null,
    iconPath: raw?.iconPath ?? null,
    createdAt: raw?.createdAt ?? fallbackTimestamp(),
    updatedAt: raw?.updatedAt ?? fallbackTimestamp(),
  };
}

function normalizeProduct(raw: any): Product {
  const normalizedOptions = Array.isArray(raw?.options)
    ? raw.options.map((opt: any) => ({
        id: Number(opt?.id ?? 0),
        name: String(opt?.name ?? '').trim(),
        additionalPrice: Number(opt?.additionalPrice ?? 0),
        isAvailable: opt?.isAvailable !== false,
      }))
    : [];

  return {
    id: raw?.id ?? '',
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    price: Number(raw?.price ?? 0),
    originalPrice: raw?.originalPrice != null ? Number(raw.originalPrice) : undefined,
    discountPercent: raw?.discountPercent != null ? Number(raw.discountPercent) : undefined,
    categoryId: raw?.categoryId ?? '',
    category: normalizeCategory(raw?.category),
    images: Array.isArray(raw?.images) ? raw.images : [],
    options: normalizedOptions,
    isAvailable: raw?.isAvailable !== false,
    soldCount: raw?.soldCount ?? 0,
    isActive: raw?.isActive !== false,
    createdAt: raw?.createdAt ?? fallbackTimestamp(),
    updatedAt: raw?.updatedAt ?? fallbackTimestamp(),
  };
}

function normalizeOrderItem(raw: any): OrderItem {
  return {
    id: raw?.id || '',
    orderId: raw?.orderId || '',
    productId: raw?.productId || '',
    quantity: Number(raw?.quantity) || 0,
    unitPrice: Number(raw?.unitPrice) || 0,
    totalPrice: raw?.totalPrice != null ? Number(raw.totalPrice) : undefined,
    product: raw?.product ? normalizeProduct(raw.product) : undefined,
    productName: raw?.productName,
    productImages: Array.isArray(raw?.productImages) ? raw.productImages : undefined,
    options: Array.isArray(raw?.options) ? raw.options : undefined,
  };
}

function normalizeOrder(raw: any): Order {
  return {
    id: raw?.id || '',
    tableNumber: raw?.tableNumber || '',
    paymentMethod: raw?.paymentMethod ?? undefined,
    notes: raw?.notes ?? null,
    trackingCode: raw?.trackingCode ?? null,
    status: raw?.status || 'PENDING',
    totalAmount: Number(raw?.totalAmount) || 0,
    createdAt: raw?.createdAt || fallbackTimestamp(),
    updatedAt: raw?.updatedAt || fallbackTimestamp(),
    items: Array.isArray(raw?.items) ? raw.items.map(normalizeOrderItem) : [],
  };
}

function parseSessionExpiry(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value > 10_000_000_000 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) {
      return parseSessionExpiry(asNumber);
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function getActiveTableSession(): { sessionId: string; expiresAt: number | null } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TABLE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const sessionId = typeof parsed?.sessionId === 'string' ? parsed.sessionId.trim() : '';
    if (!sessionId) return null;
    const expiresAt = parseSessionExpiry(parsed?.sessionExpiresAt);
    if (expiresAt !== null && expiresAt <= Date.now()) {
      clearTableSession();
      return null;
    }
    return { sessionId, expiresAt };
  } catch {
    return null;
  }
}

function clearTableSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(TABLE_SESSION_EVENT));
  } catch {
    // ignore
  }
}

export function resolveAssetUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (!trimmed) return '';

  if (/^data:/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^<svg[\s\S]*?<\/svg>$/i.test(trimmed)) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  const base = NORMALIZED_BASE_URL;
  if (!base) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  const normalizedPath = trimmed.replace(/^\/+/, '');
  return `${base}/${normalizedPath}`;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;

    // برای درست کار کردن instanceof
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toString() {
    return `${this.name} [${this.status}]: ${this.message}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      data: this.data
    };
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  try {
    // Helpful debug: surface when access token is set or cleared
    if (typeof window !== 'undefined') {
      // Mask token for safe logging (don't print full secrets)
      const masked = token ? `${token.slice(0, 6)}...${token.slice(-6)}` : null;
      // logging removed
    }
  } catch (e) {
    // ignore
  }
  try {
    // schedule auto logout when token set/cleared
    scheduleAutoLogoutFromToken(token);
  } catch (e) {
    // ignore
  }
}

// Helper to schedule auto-logout based on token expiry encoded in JWT
function scheduleAutoLogoutFromToken(token: string | null) {
  if (typeof window === 'undefined') return;
  // Timer-based auto-logout disabled intentionally to avoid unexpected resets during development.
  // If you need to re-enable auto-logout later, restore the previous implementation.
  return;
}

// (scheduling performed inside setAccessToken)

export function getAccessToken() {
  return accessToken;
}

function clearStoredAuthTokens() {
  try {
    setAccessToken(null);
  } catch (e) {
    // ignore
  }

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('refreshToken');
  } catch (e) {
    // ignore storage errors
  }

  try {
    const fn = (window as any).__app_logout;
    if (typeof fn === 'function') {
      fn();
    }
  } catch (e) {
    // ignore custom logout handler errors
  }
}

function redirectToHome() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (window.location.pathname !== '/') {
      window.location.replace('/');
    }
  } catch (e) {
    // ignore navigation errors
  }
}

function handleUnauthorizedLogout() {
  clearStoredAuthTokens();
  redirectToHome();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>,
  triedRefresh?: boolean
): Promise<T> {
  // Add /api prefix if endpoint doesn't start with it
  const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;
  const url = `${BASE_URL}${apiEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const activeSession = getActiveTableSession();
  if (activeSession?.sessionId) {
    headers[TABLE_SESSION_HEADER] = activeSession.sessionId;
  }

  // Prepare safe headers for logging (mask Authorization)
  const safeHeaders: Record<string, string> = { ...headers };
  if (safeHeaders.Authorization) {
    const t = safeHeaders.Authorization;
    // keep small parts visible for tracing but avoid full token leak
    safeHeaders.Authorization = `${t.startsWith('Bearer ') ? 'Bearer ' : ''}${t.slice(0,6)}...${t.slice(-6)}`;
  }
  if (safeHeaders[TABLE_SESSION_HEADER]) {
    safeHeaders[TABLE_SESSION_HEADER] = '***';
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Stringify body if it's an object
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    if (!fetchOptions.credentials) {
      fetchOptions.credentials = 'include';
    }
    
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);

    // API response status logging removed

    // Read body as text first (handles empty bodies / 204 responses)
    const rawText = await response.text();
    const hasBody = rawText && rawText.trim().length > 0;

    // If response is not OK, try to extract meaningful error info
    if (!response.ok) {
      if (response.status === 401) {
        clearTableSession();
      }
      let errorMessage = `HTTP ${response.status}`;
      let errorData: unknown = {};

      if (hasBody) {
        try {
          const parsed = JSON.parse(rawText);
          // اگر پاسخ در فرمت { message, error } باشد
          if (typeof parsed?.message === 'string') {
            errorMessage = parsed.message;
            errorData = parsed.error || {};

            // Backwards-compatibility: some running backend instances return a
            // single message string like "Insufficient stock for products: aeq (available: 3, requested: 6)"
            // Convert that textual message into a structured shortages array so the client can rely on
            // error.data.shortages and avoid brittle text-parsing elsewhere.
            try {
              if (!errorData || !Array.isArray((errorData as any).shortages)) {
                const msg = String(parsed.message || '');
                const engPrefix = /Insufficient stock for products?:/i;
                if (engPrefix.test(msg)) {
                  const shortages: Array<any> = [];
                  const itemRegex = /([^()\n,]+)\s*\(\s*available[:：]?\s*(\d+)\s*,\s*requested[:：]?\s*(\d+)\s*\)/gi;
                  let m: RegExpExecArray | null;
                  while ((m = itemRegex.exec(msg)) !== null) {
                    shortages.push({
                      productId: (m[1] || '').trim(),
                      name: (m[1] || '').trim(),
                      available: Number(m[2] || 0),
                      requested: Number(m[3] || 0),
                    });
                  }
                  if (shortages.length > 0) {
                    errorData = { ...(errorData || {}), shortages };
                  }
                }
              }
            } catch (e) {
              // don't block error propagation on best-effort parsing
            }
          }
          // اگر پاسخ در فرمت { error: { message } } باشد
          else if (parsed?.error?.message) {
            errorMessage = parsed.error.message;
            const copy = { ...parsed.error };
            delete copy.message;
            errorData = copy;
          }
          // اگر خود پاسخ یک پیام خطا باشد
          else if (typeof parsed === 'string') {
            errorMessage = parsed;
          } else {
            errorData = parsed;
          }

          // Print raw body first (helps when parsed is empty) and then structured details
          try {
          } catch (e) {
            // ignore
          }
          try {
          } catch (e) {
            // ignore
          }
        } catch (parseError) {
          // Could not parse body as JSON, log raw text for debugging
          throw new ApiError(response.status, `HTTP ${response.status}`);
        }
      } else {
      }

      // If unauthorized, try refresh token flow once
  if (response.status === 401 && !triedRefresh) {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              try {
                const txt = await refreshRes.text();
                const refreshData = txt ? JSON.parse(txt) : {};
                const newAccess = refreshData?.accessToken;
                const newRefresh = refreshData?.refreshToken;
                if (newAccess) {
                  setAccessToken(newAccess);
                  if (typeof window !== 'undefined' && newRefresh) {
                    localStorage.setItem('accessToken', newAccess);
                    localStorage.setItem('refreshToken', newRefresh);
                  }
                  // retry original request once with triedRefresh=true
                  return apiRequest<T>(endpoint, options, schema, true);
                }
              } catch (parseErr) {
              }
            } else {
            }
          } catch (err) {
            try {
              setAccessToken(null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                const fn = (window as any).__app_logout;
                if (typeof fn === 'function') fn();
              }
            } catch (e) {}
            throw new ApiError(0, 'خطا در تلاش برای بروزرسانی توکن');
          }
        }

        // if we reach here, refresh was not possible or failed:
        // Do NOT auto-logout for auth endpoints (login/register) because a 401 there
        // means invalid credentials rather than an expired session. For those endpoints
        // throw an ApiError that contains the extracted server message so UI can display it.
        if (endpoint.startsWith('/auth')) {
          const friendly = response.status === 401
            ? 'ایمیل یا رمز عبور نادرست است'
            : String(errorMessage || 'خطای احراز هویت');
          throw new ApiError(response.status, friendly, errorData);
        }

        handleUnauthorizedLogout();
        throw new ApiError(401, String(errorMessage || 'Unauthorized - please login again'), errorData);
      }
      // If no refresh token was available or refresh did not succeed, ensure we logout the user
      if (response.status === 401) {
        handleUnauthorizedLogout();
        throw new ApiError(401, 'Unauthorized - please login again');
      }
      // If we've already tried refresh and still got 401, clear tokens and force logout
      if (response.status === 401 && triedRefresh) {
        handleUnauthorizedLogout();
        throw new ApiError(401, 'Unauthorized - please login again');
      }

      throw new ApiError(response.status, String(errorMessage), errorData);
    }

    // Success path: parse body if present, otherwise return an empty object
    let responseData: unknown = {};
    if (hasBody) {
      try {
        responseData = JSON.parse(rawText);
      } catch (parseError) {
        // اگر بدنه پاسخ JSON معتبر نبود، به جای خطا، شیء خالی برگردان
        responseData = {};
      }
    } else {
      responseData = {};
    }

    // Handle backend response format { success: true, data: ... }
    const parsedResponse: any = responseData as any;
    const data =
      parsedResponse && parsedResponse.success !== undefined
        ? parsedResponse.data ?? parsedResponse
        : parsedResponse;

    if (schema) {
      try {
        return schema.parse(data) as T;
      } catch (validationError) {
        throw new ApiError(0, "خطا در فرمت داده‌های دریافتی");
      }
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if ((error as any)?.name === 'AbortError') {
      throw new ApiError(0, 'زمان درخواست به پایان رسید');
    }

    // Log native error details to help debugging network issues. Try to safely serialize
    try {
      const errInfo = {
        endpoint,
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        toString: typeof (error as any)?.toString === 'function' ? (error as any).toString() : String(error),
        raw: error,
      };
    } catch {
      // ignore logging issues silently
    }

    // Include original error in ApiError.data to help trace network/library issues
    throw new ApiError(0, (error as any)?.message || 'خطا در ارتباط با سرور', error);
  }
}

// Auth API
export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<any> => {
    return apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
      // Remove schema validation to handle the actual response structure
    );
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<any> => {
    return apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      }
      // Remove schema validation to handle the actual response structure
    );
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  },
};

// Categories API
export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    return apiRequest(
      "/categories",
      { method: "GET" },
      z.array(categorySchema)
    );
  },

  getCategory: async (id: string): Promise<Category> => {
    return apiRequest(`/categories/${id}`, { method: "GET" }, categorySchema);
  },

  createCategory: async (
    categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
  ): Promise<Category> => {
    return apiRequest(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(categoryData),
      },
      categorySchema
    );
  },

  updateCategory: async (
    id: string,
    categoryData: Partial<Category>
  ): Promise<Category> => {
    return apiRequest(
      `/categories/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(categoryData),
      },
      categorySchema
    );
  },

  deleteCategory: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest(`/categories/${id}`, { method: "DELETE" });
  },
};

// Products API
type MenuTypeOption = 'CAFE' | 'RESTAURANT';

export const productsApi = {
  getProducts: async (params?: {
    search?: string;
    category?: string;
    brand?: string;
    skip?: number;
    take?: number;
    categoryType?: MenuTypeOption;
  }): Promise<PaginatedResponse<Product>> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.brand) queryParams.append("brand", params.brand);
    if (params?.categoryType)
      queryParams.append('categoryType', params.categoryType);
    if (params?.skip !== undefined)
      queryParams.append("skip", params.skip.toString());
    if (params?.take !== undefined)
      queryParams.append("take", params.take.toString());

    const queryString = queryParams.toString();
    const url = `/products${queryString ? `?${queryString}` : ""}`;

    try {
      const products = await apiRequest<any[]>(url, { method: "GET" });
      const normalized = Array.isArray(products) ? products.map(normalizeProduct) : [];
      return {
        data: normalized,
        total: normalized.length,
        skip: params?.skip || 0,
        take: params?.take || 10,
      } satisfies PaginatedResponse<Product>;
    } catch (error) {
      return {
        data: [],
        total: 0,
        skip: params?.skip || 0,
        take: params?.take || 10,
      };
    }
  },

  // Get popular products ordered by soldCount (server-side endpoint /products/popular)
  getPopular: async (options?: {
    limit?: number;
    categoryType?: MenuTypeOption;
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (options?.limit !== undefined)
      queryParams.append('limit', String(options.limit));
    if (options?.categoryType)
      queryParams.append('categoryType', options.categoryType);

    const queryString = queryParams.toString();
    const url = `/products/popular${queryString ? `?${queryString}` : ""}`;
    try {
      const products = await apiRequest<any[]>(url, { method: "GET" });
      return Array.isArray(products) ? products.map(normalizeProduct) : [];
    } catch (error) {
      return [];
    }
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await apiRequest(`/products/${id}`, { method: "GET" });
    return normalizeProduct(response);
  },

  createProduct: async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> => {
    const result = await apiRequest(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(productData),
      },
      productSchema
    );
    return normalizeProduct(result);
  },

  updateProduct: async (
    id: string,
    productData: Partial<Product>
  ): Promise<Product> => {
    const result = await apiRequest(
      `/products/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(productData),
      },
      productSchema
    );
    return normalizeProduct(result);
  },

  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest(`/products/${id}`, { method: "DELETE" });
  },
};

// Orders API
export const ordersApi = {
  getOrders: async (params?: {
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.take) queryParams.append("take", params.take.toString());

    const queryString = queryParams.toString();
    const url = `/orders${queryString ? `?${queryString}` : ""}`;

    const response = await apiRequest(url, { method: "GET" });
    const orders = Array.isArray(response) ? response : [];
    const filteredOrders = orders.filter(order => order.status !== 'PAID');

    const normalized: Order[] = filteredOrders.map(normalizeOrder);

    return {
      data: normalized,
      total: normalized.length,
      skip: params?.skip || 0,
      take: params?.take || 10,
    };
  },

  getOrder: async (id: string): Promise<Order> => {
    // Some backend endpoints may return slightly different shapes; fetch raw and normalize
    const raw = await apiRequest(`/orders/${id}`, { method: "GET" });
    return normalizeOrder(raw);
  },

  createOrder: async (orderData: {
    items: { productId: string; quantity: number; unitPrice: number }[];
    totalAmount?: number;
    paymentMethod?: string;
    tableNumber?: string;
    notes?: string;
  }): Promise<Order> => {
    const result = await apiRequest(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify(orderData),
      },
      orderSchema
    );
    return normalizeOrder(result);
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const result = await apiRequest(
      `/orders/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      orderSchema
    );
    return normalizeOrder(result);
  },
};

// Users API
export const usersApi = {
  getUser: async (id: string): Promise<User> => {
    return apiRequest(`/users/${id}`, { method: "GET" }, userSchema);
  },
  getMe: async (): Promise<any> => {
    const res = await apiRequest<any>(`/users/me`, { method: 'GET' });
    const d: any = res as any;
    if (d && typeof d === 'object' && d.success && d.data) return d.data;
    return d;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<any> => {
    const res = await apiRequest<any>(
      `/users/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(userData),
      }
    );
    const d: any = res as any;
    if (d && typeof d === 'object' && d.success && d.data) return d.data;
    return d;
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest(`/users/${id}`, { method: "DELETE" });
  },
  
  // Self-update current user (limited fields e.g. IBAN)
  updateMe: async (data: Partial<User>): Promise<any> => {
    const res = await apiRequest<any>(
      `/users/me`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    // Normalize { success: true, data: {...} } or direct object
    const d: any = res as any;
    if (d && typeof d === 'object' && d.success && d.data) return d.data;
    return d;
  },
};

// Inventory API
export const inventoryApi = {
  getInventory: async (params?: {
    lowStock?: boolean;
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<Inventory>> => {
    const queryParams = new URLSearchParams();
    if (params?.lowStock)
      queryParams.append("lowStock", params.lowStock.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.take) queryParams.append("take", params.take.toString());

    const queryString = queryParams.toString();
    const url = `/inventory${queryString ? `?${queryString}` : ""}`;

    return apiRequest(
      url,
      { method: "GET" },
      paginatedResponseSchema(inventorySchema)
    );
  },

  getProductInventory: async (productId: string): Promise<Inventory> => {
    return apiRequest(
      `/inventory/${productId}`,
      { method: "GET" },
      inventorySchema
    );
  },

  updateInventory: async (
    productId: string,
    inventoryData: {
      quantity?: number;
      minThreshold?: number;
    }
  ): Promise<Inventory> => {
    return apiRequest(
      `/inventory/${productId}`,
      {
        method: "PATCH",
        body: JSON.stringify(inventoryData),
      },
      inventorySchema
    );
  },
};

// Re-export returns API from the real implementation (used by hooks)
// If you intend to use the mocked API in some environments, consider
// switching this to conditional export logic based on NODE_ENV or a
// feature flag. For now we forward to the real implementation.
export { returnsApi } from './api-real';
