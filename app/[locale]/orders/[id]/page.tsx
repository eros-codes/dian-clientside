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
import { TableRestaurant, LocalShipping, Payment, ShoppingCart, Receipt as ReceiptIcon } from '@mui/icons-material';
import { AppShell } from '@/components/layout/AppShell';
import { OrderDetailSkeleton } from '@/components/orders/OrderDetailSkeleton';
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
        <OrderDetailSkeleton />
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
        <Box 
          sx={{ 
            mb: 4,
            bgcolor: colors.orderCardBg,
            borderRight: `4px solid ${colors.primary}`,
            p: 2.5,
            borderRadius: 2
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: colors.gray900 }}>
            جزئیات سفارش
          </Typography>
          <Typography variant="body2" sx={{ color: colors.gray700, fontWeight: 500 }}>
            شناسه: {order.id}
          </Typography>
        </Box>

        {/* Order Info Grid - ریسپانسیو */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2.5,
            mb: 4,
          }}
        >
          {/* وضعیت سفارش */}
          <Card 
            elevation={0}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}05 100%)`,
              border: `1px solid ${colors.primary}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${colors.primary}20`,
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ 
                  bgcolor: colors.primary, 
                  borderRadius: 2, 
                  p: 1, 
                  display: 'flex',
                  boxShadow: `0 4px 12px ${colors.primary}30`
                }}>
                  <ReceiptIcon sx={{ fontSize: 22, color: 'white' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: colors.textSecondary }}>
                  وضعیت سفارش
                </Typography>
              </Box>
              <OrderStatusChip status={order.status} />
            </CardContent>
          </Card>

          {/* روش پرداخت */}
          <Card 
            elevation={0}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.info}15 0%, ${colors.info}05 100%)`,
              border: `1px solid ${colors.info}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${colors.info}20`,
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ 
                  bgcolor: colors.info, 
                  borderRadius: 2, 
                  p: 1, 
                  display: 'flex',
                  boxShadow: `0 4px 12px ${colors.info}30`
                }}>
                  <Payment sx={{ fontSize: 22, color: 'white' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: colors.textSecondary }}>
                  روش پرداخت
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: colors.textPrimary }}>
                {order.paymentMethod === 'ONLINE' ? 'پرداخت آنلاین' : 'پرداخت در صندوق'}
              </Typography>
            </CardContent>
          </Card>

          
          {/* شماره میز */}
          <Card 
            elevation={0}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.warning}15 0%, ${colors.warning}05 100%)`,
              border: `1px solid ${colors.warning}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${colors.warning}20`,
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ 
                  bgcolor: colors.warning, 
                  borderRadius: 2, 
                  p: 1, 
                  display: 'flex',
                  boxShadow: `0 4px 12px ${colors.warning}30`
                }}>
                  <TableRestaurant sx={{ fontSize: 22, color: 'white' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: colors.textSecondary }}>
                  شماره میز
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: colors.textPrimary }}>
                میز {order.tableNumber}
              </Typography>
            </CardContent>
          </Card>

          
          
          {/* مبلغ کل */}
          <Card 
            elevation={0}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.success}20 0%, ${colors.success}08 100%)`,
              border: `2px solid ${colors.success}40`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 28px ${colors.success}25`,
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ 
                  bgcolor: colors.success, 
                  borderRadius: 2, 
                  p: 1, 
                  display: 'flex',
                  boxShadow: `0 4px 12px ${colors.success}30`
                }}>
                  <Payment sx={{ fontSize: 22, color: 'white' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: colors.textSecondary }}>
                  مبلغ کل
                </Typography>
              </Box>
              <Price amount={order.totalAmount} variant="h5" sx={{ fontWeight: 800, color: colors.success }} />
            </CardContent>
          </Card>
        </Box>

        
        {/* آیتم‌های سفارش */}
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: `1px solid ${colors.borderLight}`,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <ShoppingCart sx={{ fontSize: 20, color: 'white' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'white' }}>
              آیتم‌های سفارش
            </Typography>
          </Box>
          <CardContent sx={{ p: 2.5 }}>
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

        {/* توضیحات سفارش */}
        <Card 
          elevation={0}
          sx={{ 
            mt: 3,
            borderRadius: 3,
            border: `1px solid ${colors.borderLight}`,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <ReceiptIcon sx={{ fontSize: 20, color: 'white' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'white' }}>
              توضیحات سفارش
            </Typography>
          </Box>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ color: colors.textPrimary }}>
              {order.notes && order.notes.length > 0 ? order.notes : 'هیچ توضیحی ثبت نشده است'}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </AppShell>
  );
}
