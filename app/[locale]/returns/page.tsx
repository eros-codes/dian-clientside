'use client';

import colors from '../../../client-colors';

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Assignment, Add } from '@mui/icons-material';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import { ReturnsSkeleton } from '@/components/ui/ReturnsSkeleton';
import { FadeTransition } from '@/components/ui/FadeTransition';
import { LoginRequired } from '@/components/ui/LoginRequired';
import { EmptyState } from '@/components/ui/EmptyState';
import { Price } from '@/components/ui/Price';
import { ReturnStatusChip } from '@/components/returns/ReturnStatusChip';
import { useReturns, useCreateReturn, useOrders } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { formatPersianDate } from '@/lib/utils';
import { ApiError } from '@/lib/api';

function ReturnsInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  // Keep hooks at top-level to preserve hooks order across renders.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const prefilledOrderId = searchParams.get('orderId');

  const { data: ordersData, isLoading: isOrdersLoading } = useOrders({ 
    take: 100,
    status: "DELIVERED",
    userId: user?.id, // ensure enabled flag behaves predictably
  });

  // Auto open dialog if orderId is provided
  useEffect(() => {
    if (prefilledOrderId) {
      setSelectedOrderId(prefilledOrderId);
      setDialogOpen(true);
    }
  }, [prefilledOrderId]);

  const { data: returnsData, isLoading } = useReturns({
    take: 50,
  });

  // Track client mount to avoid SSR/CSR mismatch (hydrate with same initial UI)
  useEffect(() => {
    setIsClient(true);
  }, []);

  const createReturnMutation = useCreateReturn();

  // clear create error when user adds an IBAN
  useEffect(() => {
    if (user?.iban) setCreateError(null);
  }, [user?.iban]);

  const handleCreateReturn = async () => {
    // client-side guard: ensure user has IBAN before attempting
    if (!user?.iban) {
      // Keep dialog open and show client-side feedback (server also enforces this)
      return;
    }
    setCreateError(null);
    const orderId = selectedOrderId.trim();
    if (!orderId || !returnReason || !returnAmount) {
      return;
    }

    const refundAmountNumber = parseFloat(returnAmount);
    if (refundAmountNumber <= 0) {
      return;
    }

    try {
      await createReturnMutation.mutateAsync({
        orderId,
        reason: returnReason.trim(),
        refundAmount: refundAmountNumber,
      });
      setDialogOpen(false);
      setReturnReason('');
      setReturnAmount('');
      setSelectedOrderId('');
      setCreateError(null);
    } catch (error) {
      // Keep dialog open on error and display server message below the refund field
      try {
        let msg = 'خطا در ثبت درخواست مرجوعی';
        if (error instanceof ApiError) {
          const d: any = (error as any).data;
          // Possible shapes:
          // { message: '...' }
          // { message: { message: '...', error: 'Bad Request' }}
          if (d) {
            if (typeof d.message === 'string') msg = d.message;
            else if (typeof d?.message?.message === 'string') msg = d.message.message;
            else if (typeof d?.error === 'string') msg = d.error;
          } else if (error.message) {
            msg = error.message;
          }
        } else if ((error as any)?.message) {
          msg = (error as any).message;
        }
        setCreateError(msg);
      } catch (e) {
        setCreateError('خطا در ثبت درخواست مرجوعی');
      }
    }
  };

  const renderCreateButton = (
    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={() => setDialogOpen(true)}
    >
      درخواست مرجوعی
    </Button>
  );

  const OrdersSelect = (
    !prefilledOrderId && (
      <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
        <InputLabel id="order-select-label">سفارش</InputLabel>
        <Select
          labelId="order-select-label"
          label="سفارش"
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value as string)}
          disabled={isOrdersLoading}
        >
          {isOrdersLoading ? (
            <MenuItem disabled>در حال بارگذاری سفارشات...</MenuItem>
          ) : ordersData?.data?.length ? (
            ordersData.data.map((o) => (
              <MenuItem key={o.id} value={o.id}>
                سفارش #{o.id.slice(-8)} - تاریخ: {formatPersianDate(o.createdAt)} - مبلغ: <span style={{ fontWeight: 600, marginInlineStart: 6 }}>{o.totalAmount?.toLocaleString('fa-IR')} تومان</span>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>سفارش تحویل شده‌ای یافت نشد</MenuItem>
          )}
        </Select>
      </FormControl>
    )
  );

  // During SSR (before client mount) and while loading, show LoadingState so server
  // and client render the same structure and avoid hydration mismatch.
  if (!isClient || isLoading) {
    return (
      <AppShell>
        <ReturnsSkeleton />
      </AppShell>
    );
  }

  // If user is not authenticated, show the same nice screen as orders but with returns wording
  if (!isAuthenticated) {
    return (
      <AppShell>
        <LoginRequired title="نیاز به ورود" message="برای مشاهده مرجوعات وارد شوید" />
      </AppShell>
    );
  }

  if (!returnsData?.data.length) {
    return (
      <AppShell>
        <FadeTransition>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {t('returns.title')}
              </Typography>
              {renderCreateButton}
            </Box>
            
            <EmptyState
              icon={<Assignment sx={{ fontSize: 64 }} />}
              title="درخواست مرجوعی‌ای یافت نشد"
              description="شما هنوز درخواست مرجوعی‌ای ثبت نکرده‌اید."
            />

          {/* Create Return Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>درخواست مرجوعی</DialogTitle>
            <DialogContent>
              {OrdersSelect}
              <TextField
                label="دلیل مرجوعی"
                multiline
                rows={4}
                fullWidth
                required
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="مبلغ درخواستی (تومان)"
                type="number"
                fullWidth
                required
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                inputProps={{ min: 0, step: 1000 }}
                error={!!createError || !user?.iban}
                helperText={
                  createError ?? (!user?.iban ? 'ابتدا شماره شبا را ثبت کنید' : '')
                }
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreateReturn}
                variant="contained"
                disabled={
                  (!prefilledOrderId && !selectedOrderId.trim()) ||
                  !returnReason.trim() ||
                  !returnAmount ||
                  parseFloat(returnAmount) <= 0 ||
                  createReturnMutation.isPending ||
                  !user?.iban
                }
              >
                {createReturnMutation.isPending ? 'در حال ثبت...' : 'ثبت درخواست'}
              </Button>
            </DialogActions>
          </Dialog>
          </Container>
        </FadeTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FadeTransition>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {t('returns.title')}
          </Typography>
          {renderCreateButton}
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
          gap: 3 
        }}>
          {returnsData.data.map((returnItem) => (
            <Card 
              key={returnItem.id} 
              elevation={2}
              sx={{ 
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <Box sx={{ 
                p: 1, 
                backgroundColor: colors.returnCardBg,
                color: colors.white,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', px: 1 }}>
                  شناسه مرجوعی: {returnItem.id}
                </Typography>
                <ReturnStatusChip status={returnItem.status} />
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
                      شناسه سفارش:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-all' }}>
                      {returnItem.orderId}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      تاریخ ثبت:
                    </Typography>
                    <Typography variant="body2">
                      {formatPersianDate(returnItem.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    دلیل مرجوعی:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      p: 1.5, 
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      minHeight: '60px',
                      maxHeight: '80px',
                      overflow: 'auto'
                    }}
                  >
                    {returnItem.reason}
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mt: 2,
                  p: 1,
                  backgroundColor: colors.gray100, // Very light pastel pink
                  borderRadius: 1,
                  color: colors.gray700 
                }}>
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    مبلغ بازپرداخت:
                  </Typography>
                  <Price amount={returnItem.refundAmount} variant="subtitle1" sx={{ fontWeight: 'bold' }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Create Return Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>درخواست مرجوعی</DialogTitle>
          <DialogContent>
            {OrdersSelect}
            <TextField
              label="دلیل مرجوعی"
              multiline
              rows={4}
              fullWidth
              required
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="مبلغ درخواستی (تومان)"
              type="number"
              fullWidth
              required
              value={returnAmount}
              onChange={(e) => setReturnAmount(e.target.value)}
              inputProps={{ min: 0, step: 1000 }}
              error={!!createError || !user?.iban}
              helperText={
                createError ?? (!user?.iban ? 'ابتدا شماره شبا را ثبت کنید' : '')
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateReturn}
              variant="contained"
              disabled={
                (!prefilledOrderId && !selectedOrderId.trim()) ||
                !returnReason.trim() ||
                !returnAmount ||
                parseFloat(returnAmount) <= 0 ||
                createReturnMutation.isPending ||
                !user?.iban
              }
            >
              {createReturnMutation.isPending ? 'در حال ثبت...' : 'ثبت درخواست'}
            </Button>
          </DialogActions>
        </Dialog>
        {!user?.iban && (
          <Box sx={{ p: 2, mt: 2 }}>
            <Typography variant="body2" color="error">
              برای ثبت مرجوعی باید شماره شبای خود را در صفحه پروفایل وارد کنید. <a href={`/profile`}>رفتن به پروفایل</a>
            </Typography>
          </Box>
        )}
      </Container>
      </FadeTransition>
    </AppShell>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<AppShell><ReturnsSkeleton /></AppShell>}>
      <ReturnsInner />
    </Suspense>
  );
}