//orders/page
"use client";

import colors from '../../../client-colors';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
} from '@mui/material';
import { Receipt, Visibility, ShoppingCart } from '@mui/icons-material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import { OrdersSkeleton } from '@/components/ui/OrdersSkeleton';
import { FadeTransition } from '@/components/ui/FadeTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { Price } from '@/components/ui/Price';
import { OrderStatusChip } from '@/components/orders/OrderStatusChip';
import { useOrders } from '@/hooks/useApi';
import { formatPersianDate } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { productsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCurrentTable } from '@/hooks/useCurrentTable';
import { toast } from '@/hooks/use-toast';
import { normalizeTableNumber } from '@/hooks/useCurrentTable';

const persianDigitsMap: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function normalizeTableIdentifier(value: unknown): string {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const withEnglishDigits = raw.replace(/[۰-۹]/g, digit => persianDigitsMap[digit] ?? digit);
  const digitsOnly = withEnglishDigits.match(/\d+/);
  if (digitsOnly && digitsOnly[0]) {
    return digitsOnly[0];
  }
  const cleaned = withEnglishDigits
    .replace(/^table\s*/i, '')
    .replace(/^میز\s*/i, '')
    .trim();
  return cleaned.toLowerCase();
}

export default function OrdersPage() {
  const t = useTranslations();
  // Call hooks unconditionally to keep hook order stable across renders.
  // The hooks themselves use `enabled` flags so they won't run until ready.
  const { data: ordersData, isLoading, error } = useOrders({
    take: 50,
  });

  const { addItem } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const tableState = useCurrentTable();
  const currentTableNumber = tableState.tableNumber;
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (tableState.isSessionActive) {
      hasRedirectedRef.current = false;
      return;
    }

    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      toast({
        variant: 'destructive',
        title: 'زمان شما به پایان رسید',
        description: 'نشست میز شما منقضی شد. لطفاً دوباره QR را اسکن کنید.',
      });
      router.replace('/');
    }
  }, [mounted, tableState.isSessionActive, router]);

  const orders = (ordersData?.data ?? []).filter(order => order?.status !== 'CANCELLED');
  const normalizedTable = normalizeTableIdentifier(currentTableNumber);
  const visibleOrders = useMemo(() => {
    if (!normalizedTable) return orders;
    return orders.filter((order) => {
      const orderTable = normalizeTableIdentifier(order?.tableNumber);
      return orderTable === normalizedTable;
    });
  }, [orders, normalizedTable]);

  // Avoid rendering UI until we've mounted on the client to prevent
  // SSR/CSR mismatches (hydration errors) when orders data differ.
  if (!mounted) {
    return (
      <AppShell>
        <OrdersSkeleton />
      </AppShell>
    );
  }

  const handleReorder = async (order: any) => {
    // اضافه کردن همه آیتم‌های سفارش به سبد خرید
    if (order.items && Array.isArray(order.items)) {
      // For items that include a full `product` object, add directly.
      // For items that only have productId/productName, fetch full product info
      // from the API so cartStore.addItem receives a proper Product.
      const tasks = order.items.map(async (item: any) => {
        if (item.product && item.product.id) {
          addItem(item.product, item.quantity);
          return;
        }

        // Try to fetch product by id, but don't block the whole flow on a single failure.
        if (item.productId) {
          try {
            const prod = await productsApi.getProduct(String(item.productId));
            if (prod && prod.id) {
              addItem(prod, item.quantity);
              return;
            }
          } catch (e) {
            // ignore fetch errors for now — item will be skipped
          }
        }

        // Fallback: if we don't have a full product and fetch failed, try to create
        // a minimum-compatible product object so cart can show at least name/qty.
        if (item.productId || item.productName) {
          const fallback: any = {
            id: String(item.productId || `unknown-${Math.random().toString(36).slice(2,8)}`),
            name: item.productName || 'محصول',
            description: item.productName || 'محصول',
            price: Number(item.unitPrice || 0) || 0,
            originalPrice: Number(item.unitPrice || 0) || 0,
            discountPercent: 0,
            categoryId: '',
            category: { id: '', name: '' },
            brand: '',
            images: (item.productImages || []).map((img: any) => ({ url: img?.url || img })) ,
            quantity: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addItem(fallback as any, item.quantity);
        }
      });

      await Promise.all(tasks);
    }

    // رفتن به صفحه سبد خرید
    router.push('/cart');
  };

  

  // Debug logs removed

  // Show loading if orders are loading
  if (isLoading) {
    return <AppShell><OrdersSkeleton /></AppShell>;
  }

  // Show error state if there's an API error
  if (error) {
    return (
      <AppShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <EmptyState
            icon={<Receipt sx={{ fontSize: 64 }} />}
            title="خطا در بارگذاری سفارشات"
            description={`خطا: ${error?.message || 'نامشخص'} - لطفاً مجدداً تلاش کنید.`}
            action={
              <Link href="/products" style={{ textDecoration: 'none' }}>
                <Typography variant="button" color="primary">
                  مشاهده محصولات
                </Typography>
              </Link>
            }
          />
        </Container>
      </AppShell>
    );
  }

  if (!orders.length) {
    return (
      <AppShell>
        <FadeTransition>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <EmptyState
              icon={<Receipt sx={{ fontSize: 64 }} />}
              title="سفارشی یافت نشد"
              description="شما هنوز سفارشی ثبت نکرده‌اید."
              action={
                <Link href="/products" style={{ textDecoration: 'none' }}>
                  <Typography variant="button" color="primary">
                    مشاهده محصولات
                  </Typography>
                </Link>
              }
            />
          </Container>
        </FadeTransition>
      </AppShell>
    );
  }

  if (normalizedTable && !visibleOrders.length) {
    return (
      <AppShell>
        <FadeTransition>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <EmptyState
              icon={<Receipt sx={{ fontSize: 64 }} />}
              title="سفارشی برای این میز یافت نشد"
              description={`هنوز سفارشی برای میز ${currentTableNumber} ثبت نشده است.`}
              action={
                <Link href="/products" style={{ textDecoration: 'none' }}>
                  <Typography variant="button" color="primary">
                    مشاهده منو
                  </Typography>
                </Link>
              }
            />
          </Container>
        </FadeTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FadeTransition>
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {t('orders.title')}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
          gap: { xs: 2, sm: 2.5, md: 3 }
        }}>
          {visibleOrders.map((order) => (
            <Card 
              key={order.id} 
              elevation={2}
              sx={{ 
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                },
                overflow: 'visible'
              }}
            >
              <Box sx={{ 
                p: 1, 
                backgroundColor: colors.orderCardBg, // Order card header background
                color: colors.gray700,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', px: 1 }}>
                  شناسه سفارش: {order.id}
                </Typography>
                <OrderStatusChip status={order.status} />
              </Box>
              
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1,
                  mb: 2,
                  p: 1,
                  backgroundColor: colors.gray50, // Very light pastel background
                  borderRadius: 1
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      شماره میز:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      میز {normalizeTableNumber(order.tableNumber) ?? order.tableNumber}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      وضعیت:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {order.status === 'PENDING' && 'درحال انتظار'}
                      {order.status === 'CONFIRMED' && 'درحال آماده سازی'}
                      {order.status === 'DELIVERED' && 'تحویل داده شده'}
                      {order.status === 'PAID' && 'تسویه شده'}
                      {order.status === 'CANCELLED' && 'لغو شده'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  p: 1.5,
                  backgroundColor: colors.gray100, // Very light pastel
                  borderRadius: 1,
                  color: colors.gray700, 
                  mb: 2
                }}>
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    مبلغ کل:
                  </Typography>
                  <Price amount={order.totalAmount} variant="subtitle1" sx={{ fontWeight: 'bold' }} />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  gap: 1,
                  mt: 2
                }}>
                  {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShoppingCart />}
                      onClick={() => handleReorder(order)}
                      sx={{ 
                        borderRadius: 2,
                        flex: 1,
                        bgcolor: colors.reorderButton,
                        color: colors.white,
                        '&:hover': {
                          bgcolor: colors.reorderButtonHover
                        }
                      }}
                    >
                      سفارش مجدد
                    </Button>
                  )}
                  
                  <Button
                    component={Link}
                    href={`/orders/${order.id}`}
                    variant="contained"
                    size="small"
                    startIcon={<Visibility />}
                    sx={{ 
                      borderRadius: 2,
                      flex: (order.status === 'DELIVERED' || order.status === 'CANCELLED') ? 1 : 2,
                      bgcolor: colors.badgeSoftBlue,
                      '&:hover': {
                        bgcolor: colors.badgeSoftBlueDark
                      }
                    }}
                  >
                    مشاهده جزئیات
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
      </FadeTransition>
    </AppShell>
  );
}