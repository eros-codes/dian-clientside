import { z } from "zod";
import {
  User,
  Product,
  Category,
  Order,
  Return,
  Inventory,
  AuthTokens,
  PaginatedResponse
} from "@/types";
import {
  userSchema,
  productSchema,
  bannerSchema,
  categorySchema,
  orderSchema,
  returnSchema,
  inventorySchema,
  authTokensSchema,
  paginatedResponseSchema,
} from "@/lib/validations";

// In local development, prefer direct backend on localhost:4000 when NEXT_PUBLIC_API_BASE_URL
// is not provided. In production you should set NEXT_PUBLIC_API_BASE_URL to your API host.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// Footer Settings API (public)
export const footerSettingsApi = {
  getFooterSettings: async (): Promise<Array<{ id: number; key: string; title: string; url?: string | null }>> => {
    const res = await apiRequest('/footer-settings', { method: 'GET' });
    // Support shapes:
    // 1) { success:true, data:[...] }
    // 2) { success:true, data:{ success:true, data:[...] } }
    // 3) [...]
    const d: any = res;
    const nested = d?.data?.data;
    if (Array.isArray(nested)) return nested;
    const top = d?.data;
    if (Array.isArray(top)) return top;
    if (Array.isArray(d)) return d;
    return [];
  },
};

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>
): Promise<T> {
  // Construct target URL. Default BASE_URL points to backend (localhost:4000) for dev.
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

  // Proactive auth guard: if a token is intended to be sent (Authorization header present),
  // and expiry is missing/elapsed, logout and abort to ensure redirect anywhere protected is accessed
  try {
    const needsAuth = !!accessToken;
    if (needsAuth) {
      const expRaw = typeof window !== 'undefined' ? localStorage.getItem('accessTokenExpiry') : null;
      const exp = expRaw ? Number(expRaw) : 0;
      const now = Date.now();
      if (!accessToken || !exp || Number.isNaN(exp) || exp <= now) {
        try { (window as any).__app_logout?.(); } catch {}
        throw new ApiError(401, 'Unauthorized');
      }
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse error
      }
      // Auto-logout on unauthorized/forbidden
      if (response.status === 401 || response.status === 403) {
        try {
          (window as any).__app_logout?.();
        } catch {}
      }
      throw new ApiError(response.status, errorMessage);
    }

    const raw = await response.text();
    const data = raw && raw.length > 0 ? JSON.parse(raw) : {};

    // Handle backend response wrapper { success: true, data: ... }
    const parsedResponse: any = data as any;
    const payload = parsedResponse && parsedResponse.success !== undefined ? parsedResponse.data ?? parsedResponse : parsedResponse;

    if (schema) {
      return schema.parse(payload);
    }

    return payload;
  } catch (error) {
    // underlying error occurred (network/CORS/etc.) — no logging in production build
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        try {
          (window as any).__app_logout?.();
        } catch {}
      }
      throw error;
    }
    throw new ApiError(0, "خطا در ارتباط با سرور");
  }
}

// Auth API
export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthTokens> => {
    return apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      authTokensSchema
    );
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AuthTokens> => {
    return apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
      authTokensSchema
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
      queryParams.append("categoryType", params.categoryType);
    if (params?.skip !== undefined)
      queryParams.append("skip", params.skip.toString());
    if (params?.take !== undefined)
      queryParams.append("take", params.take.toString());

    const queryString = queryParams.toString();
    const url = `/products${queryString ? `?${queryString}` : ""}`;

    return apiRequest(
      url,
      { method: "GET" },
      paginatedResponseSchema(productSchema)
    );
  },

  getProduct: async (id: string): Promise<Product> => {
    return apiRequest(`/products/${id}`, { method: "GET" }, productSchema);
  },

  getPopular: async (options?: {
    limit?: number;
    categoryType?: MenuTypeOption;
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (options?.limit !== undefined)
      queryParams.append('limit', options.limit.toString());
    if (options?.categoryType)
      queryParams.append('categoryType', options.categoryType);

    const queryString = queryParams.toString();
    const url = `/products/popular${queryString ? `?${queryString}` : ''}`;
    return apiRequest(url, { method: 'GET' }, z.array(productSchema));
  },

  createProduct: async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> => {
    return apiRequest(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(productData),
      },
      productSchema
    );
  },

  updateProduct: async (
    id: string,
    productData: Partial<Product>
  ): Promise<Product> => {
    return apiRequest(
      `/products/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(productData),
      },
      productSchema
    );
  },

  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest(`/products/${id}`, { method: "DELETE" });
  },
};

// Banners API
export const bannersApi = {
  getBanners: async (): Promise<import('@/types').PaginatedResponse<any> | any[]> => {
    // Backend returns { success: true, data: [...] }. Request raw and extract `data`.
    const res = await apiRequest('/banners', { method: 'GET' });
    // If backend returned wrapper, return its data. Otherwise if it's already an array, return it.
    if (res && typeof res === 'object' && Array.isArray((res as any).data)) {
      return (res as any).data;
    }
    return Array.isArray(res) ? res : [];
  },

  getAllBanners: async () => {
    const res = await apiRequest('/banners/all', { method: 'GET' });
    if (res && typeof res === 'object' && Array.isArray((res as any).data)) {
      return (res as any).data;
    }
    return Array.isArray(res) ? res : [];
  },

  createBanner: async (form: FormData) => {
  const url = `${BASE_URL}/banners`;
    const headers: Record<string,string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(url, { method: 'POST', body: form, headers });
    if (!res.ok) throw new ApiError(res.status, 'Error creating banner');
    return res.json();
  },

  updateBanner: async (id: string, form: FormData) => {
  const url = `${BASE_URL}/banners/${id}`;
    const headers: Record<string,string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(url, { method: 'PATCH', body: form, headers });
    if (!res.ok) throw new ApiError(res.status, 'Error updating banner');
    return res.json();
  },

  deleteBanner: async (id: string) => {
    return apiRequest(`/banners/${id}`, { method: 'DELETE' });
  },
};

// Orders API
export const ordersApi = {
  getOrders: async (params?: {
    userId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.take) queryParams.append("take", params.take.toString());

    const queryString = queryParams.toString();
    const url = `/orders${queryString ? `?${queryString}` : ""}`;

    return apiRequest(
      url,
      { method: "GET" },
      paginatedResponseSchema(orderSchema)
    );
  },

  getOrder: async (id: string): Promise<Order> => {
    return apiRequest(`/orders/${id}`, { method: "GET" }, orderSchema);
  },

  createOrder: async (orderData: {
    userId: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    shippingAddress: Record<string, unknown>;
    paymentMethod?: 'ONLINE' | 'COD';
    trackingCode?: string | null;
  }): Promise<Order> => {
    return apiRequest(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify(orderData),
      },
      orderSchema
    );
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    return apiRequest(
      `/orders/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      orderSchema
    );
  },
};

// Returns API
export const returnsApi = {
  getReturns: async (params?: {
    userId?: string;
    orderId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<PaginatedResponse<Return>> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.orderId) queryParams.append("orderId", params.orderId);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.take) queryParams.append("take", params.take.toString());

    const queryString = queryParams.toString();
    const url = `/returns${queryString ? `?${queryString}` : ""}`;

    return apiRequest(
      url,
      { method: "GET" },
      paginatedResponseSchema(returnSchema)
    );
  },

  getReturn: async (id: string): Promise<Return> => {
    return apiRequest(`/returns/${id}`, { method: "GET" }, returnSchema);
  },

  createReturn: async (returnData: {
    orderId: string;
    userId: string;
    reason: string;
    refundAmount: number;
  }): Promise<Return> => {
    return apiRequest(
      "/returns",
      {
        method: "POST",
        body: JSON.stringify(returnData),
      },
      returnSchema
    );
  },

  updateReturnStatus: async (id: string, status: string): Promise<Return> => {
    return apiRequest(
      `/returns/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      returnSchema
    );
  },
};

// Users API
export const usersApi = {
  getUser: async (id: string): Promise<User> => {
    return apiRequest(`/users/${id}`, { method: "GET" }, userSchema);
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    return apiRequest(
      `/users/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(userData),
      },
      userSchema
    );
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest(`/users/${id}`, { method: "DELETE" });
  },
  
  // Self-update current user (limited fields like IBAN)
  updateMe: async (data: Partial<User>): Promise<User> => {
    return apiRequest(
      `/users/me`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      userSchema
    );
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
