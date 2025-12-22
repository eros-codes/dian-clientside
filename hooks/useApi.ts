import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  categoriesApi,
  ordersApi,
  usersApi,
  inventoryApi,
  returnsApi,
  authApi,
  setAccessToken,
  ApiError,
} from "@/lib/api";
import { footerSettingsApi, bannersApi } from '@/lib/api-real';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { ErrorHelper } from '@/lib/error-helper';
import { useTranslations } from 'next-intl';
import { getDefaultUserId } from "@/lib/utils";
import { toast } from "sonner";
import { useMemo } from "react";

// Products hooks
export function useProducts(
  params?: {
    search?: string;
    category?: string;
    brand?: string;
    skip?: number;
    take?: number;
    categoryType?: 'CAFE' | 'RESTAURANT';
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getProducts(params),
    enabled: options?.enabled ?? true,
    retry: 2,
    retryDelay: 1000,
    // Treat products as stale and poll frequently so admin-driven
    // price/discount/tax changes propagate to clients fast.
    staleTime: 0,
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: false,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
    // Poll briefly so that admin-driven updates (category discount changes)
    // are reflected on product pages without requiring a full manual reload.
    // This is a pragmatic cross-app solution; if you'd prefer push notifications
    // (websocket/SSE) we can implement that instead.
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getCategories(),
    retry: 2,
    retryDelay: 1000,
    // Categories may affect product pricing/discounts; poll frequently.
    staleTime: 0,
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: false,
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoriesApi.getCategory(id),
    enabled: !!id,
  });
}

// Orders hooks
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      ordersApi.updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
      toast.success("وضعیت سفارش با موفقیت بروزرسانی شد");
    },
    onError: (error: ApiError) => {
      const stockError = ErrorHelper.parseStockError(error);

      if (stockError) {
        const product = queryClient.getQueryData<any>(['product', stockError.productId]);
        const productName = product?.name || t('orders.unknown') || 'محصول';

        // Use translation template if available
        const messageTemplate = t('orders.stockShortage') || `متاسفانه موجودی ${productName} کافی نیست.\nموجودی فعلی: ${stockError.current} عدد\nتعداد درخواستی: ${stockError.requested} عدد`;
        // next-intl templates use {name} placeholders; do a simple replace
        const message = messageTemplate
          .replace('{name}', productName)
          .replace('{current}', String(stockError.current))
          .replace('{requested}', String(stockError.requested));

        toast.error(message);
      } else {
        toast.error(ErrorHelper.getErrorMessage(error) || t('common.error') || "خطا در بروزرسانی وضعیت سفارش");
      }
    },
  });
}

export function useOrders(params?: {
  status?: string;
  userId?: string;
  skip?: number;
  take?: number;
}) {
  // Create a stable params object
  const stableParams = {
    status: params?.status,
    userId: params?.userId,
    skip: params?.skip,
    take: params?.take,
  };

  // Create a stable query key that includes all params
  const queryKey = ["orders", stableParams];
  
  return useQuery({
    queryKey,
    queryFn: () => ordersApi.getOrders(stableParams),
    retry: 1,
    // Make orders refresh frequently so client sees admin changes quickly.
    // Poll every 5 seconds and treat data as stale immediately so refetchInterval runs.
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });
}

export function useOrder(id: string, userId?: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
    // Keep a single order up-to-date frequently (useful for order detail pages)
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: true,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations();

  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("سفارش شما با موفقیت ثبت شد");
    },
    onError: (error: ApiError) => {
      const stockError = ErrorHelper.parseStockError(error);

      if (stockError) {
        const product = queryClient.getQueryData<any>(['product', stockError.productId]);
        const productName = product?.name || t('orders.unknown') || 'محصول';

        const messageTemplate = t('orders.stockShortage') || `متاسفانه موجودی ${productName} کافی نیست.\nموجودی فعلی: ${stockError.current} عدد\nتعداد درخواستی: ${stockError.requested} عدد`;
        const message = messageTemplate
          .replace('{name}', productName)
          .replace('{current}', String(stockError.current))
          .replace('{requested}', String(stockError.requested));

        toast.error(message);
      } else {
        toast.error(ErrorHelper.getErrorMessage(error) || t('common.error') || "خطا در ثبت سفارش");
      }
    },
  });
}

// Popular products hook (fetch from /products/popular)
export function usePopularProducts(options?: { limit?: number; categoryType?: 'CAFE' | 'RESTAURANT'; enabled?: boolean }) {
  const limit = options?.limit ?? 8;
  const categoryKey = options?.categoryType ?? 'all';
  return useQuery({
    queryKey: ["products", "popular", limit, categoryKey],
    queryFn: () =>
      productsApi.getPopular({
        limit,
        categoryType: options?.categoryType,
      }),
    enabled: options?.enabled ?? true,
    // Popular list can change when product prices/discounts change.
    staleTime: 0,
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: false,
    retry: 2,
  });
}

// Footer / settings
export function useFooterSettings() {
  return useQuery({
    queryKey: ["footerSettings"],
    queryFn: () => footerSettingsApi.getFooterSettings(),
    retry: 2,
    // Poll frequently so changes to tax/fee/phone/address propagate quickly
    staleTime: 0,
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: false,
  });
}

// Returns hooks
export function useReturns(params?: { orderId?: string; status?: string; userId?: string; skip?: number; take?: number }) {
  return useQuery({
    queryKey: ["returns", params],
    queryFn: () => returnsApi.getReturns(params),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { orderId: string; reason: string; refundAmount: number }) =>
      returnsApi.createReturn({ ...data, userId: (useAuthStore.getState().user as any)?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      toast.success("درخواست مرجوعی شما ثبت شد");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'خطا در ثبت درخواست مرجوعی');
    },
  });
}

// Auth helpers
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('رمز عبور با موفقیت تغییر کرد');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'خطا در تغییر رمز عبور');
    },
  });
}

// Banners hook
export function useBanners() {
  const { data: rawBanners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const data = await bannersApi.getBanners();
      return Array.isArray(data) ? data : [];
    },
    // Poll every 5 seconds so admin banner changes propagate to all clients fast
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    retry: 2,
  });

  return useMemo(() => {
    return rawBanners
      .filter((b: any) => b.isActive && b.imageUrl)
      .sort((a: any, z: any) => (a.order ?? 0) - (z.order ?? 0));
  }, [rawBanners]);
}

export async function applyLoginSuccess(payload: any, setUser: (u: any) => void, setTokens: (a?: string|null, r?: string|null) => void) {
  try {
    const access = payload?.accessToken || payload?.access;
    const refresh = payload?.refreshToken || payload?.refresh;
    const user = payload?.user || payload;
    if (access) {
      setAccessToken(access);
      setTokens(access, refresh ?? null);
      try { localStorage.setItem('accessToken', access); } catch {}
      try { if (refresh) localStorage.setItem('refreshToken', refresh); } catch {}
    }
    if (user) {
      setUser(user);
      try { localStorage.setItem('userData', JSON.stringify(user)); } catch {}
    }
    return true;
  } catch (e) {
    return false;
  }
}