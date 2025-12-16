'use client';

import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import { Receipt, LocalShipping, Payment, CalendarToday } from '@mui/icons-material';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import { Price } from '@/components/ui/Price';
import { OrderStatusChip } from '@/components/orders/OrderStatusChip';
import { OrderItemCard } from '@/components/orders/OrderItemCard';
import { useOrder } from '@/hooks/useApi';
import { formatPersianDate } from '@/lib/utils';
import colors from '../../../../client-colors';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (error || !order) {
    return (
      <AppShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h6" color="error">
            خطا در بارگذاری جزئیات سفارش
          </Typography>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            جزئیات سفارش
          </Typography>
          <Typography variant="body2" color="text.secondary">
            شناسه سفارش: {order.id}
          </Typography>
        </Box>

        {/* Order Info Grid - ریسپانسیو */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr', // موبایل: یک ستون
              sm: 'repeat(2, 1fr)', // تبلت: دو ستون
              md: 'repeat(4, 1fr)', // دسکتاپ: چهار ستون
            },
            gap: 2,
            mb: 4,
          }}
        >
          {/* وضعیت سفارش */}
          <Card variant="outlined" sx={{ bgcolor: colors.gray50 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Receipt sx={{ fontSize: 20, color: colors.primary }} />
                <Typography variant="caption" color="text.secondary">
                  وضعیت سفارش
                </Typography>
              </Box>
              <OrderStatusChip status={order.status} />
            </CardContent>
          </Card>

          {/* روش پرداخت */}
          <Card variant="outlined" sx={{ bgcolor: colors.gray50 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Payment sx={{ fontSize: 20, color: colors.primary }} />
                <Typography variant="caption" color="text.secondary">
                  روش پرداخت
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {order.paymentMethod === 'ONLINE' ? 'پرداخت آنلاین' : 'پرداخت در صندوق'}
              </Typography>
            </CardContent>
          </Card>

          {/* تاریخ ثبت */}
          <Card variant="outlined" sx={{ bgcolor: colors.gray50 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarToday sx={{ fontSize: 20, color: colors.primary }} />
                <Typography variant="caption" color="text.secondary">
                  تاریخ ثبت
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatPersianDate(order.createdAt)}
              </Typography>
            </CardContent>
          </Card>

          {/* مبلغ کل */}
          <Card variant="outlined" sx={{ bgcolor: colors.badgeSoftGreen }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocalShipping sx={{ fontSize: 20, color: colors.success }} />
                <Typography variant="caption" color="text.secondary">
                  مبلغ کل
                </Typography>
              </Box>
              <Price amount={order.totalAmount} variant="h6" sx={{ fontWeight: 'bold', color: colors.success }} />
            </CardContent>
          </Card>
        </Box>

        {/* آدرس ارسال */}
        <Card variant="outlined" sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              آدرس ارسال
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              {order.shippingAddress && (
                <>
                  {(order.shippingAddress as any).province && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        استان:
                      </Typography>
                      <Typography variant="body2">{(order.shippingAddress as any).province}</Typography>
                    </Box>
                  )}
                  {(order.shippingAddress as any).city && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        شهر:
                      </Typography>
                      <Typography variant="body2">{(order.shippingAddress as any).city}</Typography>
                    </Box>
                  )}
                  {(order.shippingAddress as any).street && (
                    <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                      <Typography variant="caption" color="text.secondary">
                        آدرس:
                      </Typography>
                      <Typography variant="body2">{(order.shippingAddress as any).street}</Typography>
                    </Box>
                  )}
                  {(order.shippingAddress as any).postalCode && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        کد پستی:
                      </Typography>
                      <Typography variant="body2">{(order.shippingAddress as any).postalCode}</Typography>
                    </Box>
                  )}
                  {(order.shippingAddress as any).phone && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        تلفن:
                      </Typography>
                      <Typography variant="body2">{(order.shippingAddress as any).phone}</Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* آیتم‌های سفارش */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              آیتم‌های سفارش
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <OrderItemCard 
                    key={item.id} 
                    item={item}
                    showReorderButton={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  هیچ آیتمی یافت نشد
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </AppShell>
  );
}
