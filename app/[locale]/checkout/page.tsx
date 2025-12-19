//app\[locale]\checkout\page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import colors from '../../../client-colors';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  IconButton,
  Fade,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ShoppingCart, LocationOn, Payment, CheckCircle, ExpandLess, ExpandMore, TableRestaurant } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import dynamic from 'next/dynamic';
import { OrderSummarySkeleton, PaymentSectionSkeleton } from '@/components/checkout/CheckoutSkeletons';

const OrderSummary = dynamic(() => import('@/components/checkout/OrderSummary').then((m: any) => m.OrderSummary), {
  loading: () => <OrderSummarySkeleton />,
}) as any;
const PaymentSection = dynamic(() => import('@/components/checkout/PaymentSection').then((m: any) => m.PaymentSection), {
  loading: () => <PaymentSectionSkeleton />,
}) as any;
import { useCartStore } from '@/stores/cartStore';
import { useCreateOrder } from '@/hooks/useApi';
import { useSharedCart } from '@/hooks/useSharedCart';
import { Price } from '@/components/ui/Price';
import { toPersianDigits } from '@/lib/utils';
import { footerSettingsApi } from '@/lib/api-real';
import type { StepIconProps } from '@mui/material/StepIcon';
import { normalizeTableNumber, useCurrentTable } from '@/hooks/useCurrentTable';

const steps = [
  { label: 'شماره میز', icon: <TableRestaurant /> },
  { label: 'بررسی سفارش', icon: <ShoppingCart /> },
  { label: 'پرداخت', icon: <Payment /> },
];

function parseNumericSetting(value: unknown, fallback: number): number {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned) return fallback;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toMoney(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Number(numeric.toFixed(2));
}

function formatPercentDisplay(value: number): string {
  const absolute = Math.abs(value);
  const normalized = Number.isInteger(absolute)
    ? absolute.toString()
    : absolute.toFixed(2).replace(/\.0+$/, '');
  const sign = value >= 0 ? '' : '-';
  return `${sign}${toPersianDigits(normalized)}٪`;
}

const BULK_DISCOUNT_KEY = 'bulk_discount';
const BULK_DISCOUNT_LABEL = 'تخفیف دیان برای شما';

function getProductColor(id: string) {
  const palette = [
    colors.gradients.purple,
    colors.gradients.pink,
    colors.gradients.cyan,
    colors.gradients.green,
    colors.gradients.warm,
    colors.gradients.soft,
    colors.gradients.blush,
    colors.gradients.peach,
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

function resolveImageUrl(img: unknown): string | undefined {
  if (!img) return undefined;
  const val = typeof img === 'string' ? img : (img as any)?.url;
  if (!val || typeof val !== 'string') return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  const base = process.env.NEXT_PUBLIC_CLOUDINARY_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return base ? base.replace(/\/$/, '') + (val.startsWith('/') ? val : '/' + val) : val;
}

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { tableNumber: currentTableNumber, isSessionActive } = useCurrentTable();
  const [activeStep, setActiveStep] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  const [tableNumberLocked, setTableNumberLocked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('COD');
  const [orderNotes, setOrderNotes] = useState('');

  const { items, totalAmount } = useCartStore();
  const createOrderMutation = useCreateOrder();
  const shared = useSharedCart();
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [taxMultiplier, setTaxMultiplier] = useState<number>(1);
  const [bulkDiscountThreshold, setBulkDiscountThreshold] = useState<number>(0);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [thumbsOpen, setThumbsOpen] = useState<boolean>(() => !isMobile);
  const [mounted, setMounted] = useState(false);

  const subtotal = useMemo(() => {
    const base = items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
    return toMoney(base);
  }, [items]);

  const taxRatePercent = useMemo(() => toMoney((taxMultiplier - 1) * 100), [taxMultiplier]);

  const taxAmount = useMemo(() => toMoney(subtotal * (taxMultiplier - 1)), [subtotal, taxMultiplier]);

  const totalBeforeDiscount = useMemo(
    () => toMoney(subtotal + taxAmount + (serviceFee || 0)),
    [subtotal, taxAmount, serviceFee],
  );

  const bulkDiscountAmount = useMemo(() => {
    if (!(bulkDiscountPercent > 0 && subtotal >= bulkDiscountThreshold)) {
      return 0;
    }
    const rate = Math.min(bulkDiscountPercent / 100, 1);
    if (!Number.isFinite(rate) || rate <= 0) {
      return 0;
    }
    return toMoney(totalBeforeDiscount * rate);
  }, [bulkDiscountPercent, bulkDiscountThreshold, subtotal, totalBeforeDiscount]);

  const grandTotal = useMemo(() => {
    const net = totalBeforeDiscount - bulkDiscountAmount;
    if (net <= 0) return 0;
    return toMoney(net);
  }, [totalBeforeDiscount, bulkDiscountAmount]);

  const hasServiceFee = Number(serviceFee) > 0;
  const hasTax = Math.abs(taxAmount) > 0.009;
  const hasBulkDiscount = bulkDiscountAmount > 0.009;
  const isDiscount = taxMultiplier < 1;
  const formattedTaxRate = useMemo(() => formatPercentDisplay(Math.abs(taxRatePercent)), [taxRatePercent]);
  const taxRowLabel = isDiscount ? `تخفیف ویژه (${formattedTaxRate})` : `مالیات (${formattedTaxRate})`;
  const taxDisplayAmount = isDiscount ? Math.abs(taxAmount) : taxAmount;
  const bulkDiscountLabel = BULK_DISCOUNT_LABEL;

  // Mount check برای جلوگیری از hydration errors و hydrate کردن cart store
  useEffect(() => {
    setMounted(true);
    // Force rehydrate cart from localStorage
    useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Auto-populate table number from current session
    if (currentTableNumber?.trim()) {
      setTableNumber(currentTableNumber);
      setTableNumberLocked(true);
    }
  }, [currentTableNumber]);

  // اگر کاربر بعد از رفتن به زرین‌پال با Back برگشت، سفارش موقت را لغو کن
  useEffect(() => {
    const cancelPendingOrderIfNeeded = async () => {
      try {
        const pendingOrderId = localStorage.getItem('pendingOrderId');
        if (!pendingOrderId) return;

        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('pendingOrder');

        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        await fetch(`${apiUrl}/api/pay/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pendingOrderId }),
        });

        setActiveStep(0);
      } catch (error) {
        console.error('Error cancelling pending order:', error);
      }
    };

    cancelPendingOrderIfNeeded();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await footerSettingsApi.getFooterSettings();
        if (!mounted) return;

        const feeItem = settings.find((s: any) => s.key === 'fee');
        const taxItem = settings.find((s: any) => s.key === 'tax');
        const bulkDiscountItem = settings.find((s: any) => s.key === BULK_DISCOUNT_KEY);

        const parsedFee = toMoney(parseNumericSetting(feeItem?.title, 0));
        const taxRaw = parseNumericSetting(taxItem?.title ?? 100, 100);
        const multiplier = Number((taxRaw / 100).toFixed(4));
        const thresholdRaw = parseNumericSetting(bulkDiscountItem?.title ?? 0, 0);
        const percentRaw = parseNumericSetting(bulkDiscountItem?.url ?? 0, 0);

        setServiceFee(Number.isFinite(parsedFee) ? parsedFee : 0);
        setTaxMultiplier(multiplier > 0 ? multiplier : 1);
        setBulkDiscountThreshold(thresholdRaw > 0 ? toMoney(thresholdRaw) : 0);
        const normalizedPercent = percentRaw > 0 ? Math.min(percentRaw, 100) : 0;
        setBulkDiscountPercent(toMoney(normalizedPercent));
      } catch {
        if (mounted) {
          setServiceFee(0);
          setTaxMultiplier(1);
          setBulkDiscountThreshold(0);
          setBulkDiscountPercent(0);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Icon animations
  const pulseOnce = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.08); }
    100% { transform: scale(1); }
  `;

  // MUI Step icon renderer: extracted to avoid TSX parsing issues and to have proper typing
  const StepIcon = (props: StepIconProps) => {
    const { active, completed, icon } = props as any;
    return (
      <Avatar
        sx={{
          width: 40,
          height: 40,
          backgroundColor: completed
            ? 'success.main'
            : active
              ? 'primary.main'
              : 'grey.300',
          color: completed || active ? 'white' : 'grey.600',
          // run a subtle pulse when the step becomes active (~360ms)
          animation: active ? `${pulseOnce} 360ms ease-in-out` : 'none',
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        {completed ? <CheckCircle /> : (icon as any)}
      </Avatar>
    );
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center', py: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 800, color: colors.primary }}>
              شماره میز:
            </Typography>
            <Box
              component="input"
              type="text"
              value={tableNumber}
              onChange={(e: any) => {
                if (tableNumberLocked) return;
                setTableNumber(e.target.value);
              }}
              maxLength={2}
              sx={{
                width: '120px',
                height: 120,
                fontSize: '3rem',
                fontWeight: 800,
                textAlign: 'center',
                borderRadius: '24px',
                border: `3px solid ${colors.primary}20`,
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'inherit',
                background: `linear-gradient(135deg, ${colors.primary}05 0%, ${colors.primaryLight}08 100%)`,
                color: colors.primary,
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                '&:hover': {
                  borderColor: `${colors.primary}40`,
                  background: `linear-gradient(135deg, ${colors.primary}08 0%, ${colors.primaryLight}12 100%)`,
                  boxShadow: '0 6px 28px rgba(0,0,0,0.08)',
                },
                '&:focus': {
                  borderColor: colors.primary,
                  background: 'white',
                  boxShadow: `0 0 0 4px ${colors.primaryLight}25, 0 8px 32px rgba(0,0,0,0.12)`,
                  transform: 'translateY(-2px)',
                },
                ...(tableNumberLocked
                  ? {
                      background: colors.inputBg,
                      color: colors.gray600,
                      borderColor: `${colors.primary}10`,
                      cursor: 'not-allowed',
                      boxShadow: 'none',
                    }
                  : {}),
              }}
              disabled={tableNumberLocked}
              readOnly={tableNumberLocked}
            />
          </Box>
        );
      case 1:
        return (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: 'text.secondary' }}
              >
                {`شما ${toPersianDigits(
                  items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0),
                )} آیتم در سفارش خود دارید`}
              </Typography>
            </Box>
            <OrderSummary
              items={items as any}
              subtotal={subtotal}
              serviceFee={serviceFee}
              taxAmount={taxAmount}
              taxRate={taxRatePercent}
              grandTotal={grandTotal}
              bulkDiscountAmount={bulkDiscountAmount}
              bulkDiscountLabel={bulkDiscountLabel}
            />
          </>
        );
      case 2:
        return (
          <PaymentSection
            totalAmount={grandTotal}
            value={paymentMethod}
            onChange={(v: any) => setPaymentMethod(v)}
            notes={orderNotes}
            onNotesChange={setOrderNotes}
          />
        );
      default:
        return null;
    }
  };

  // Loading state تا mount بشه - جلوگیری از hydration errors
  if (!mounted) {
    return null;
  }

  // Empty cart experience
  if (items.length === 0) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Card sx={{ textAlign: 'center', borderRadius: 8, boxShadow: '0 1px 2px var(--shadow-2)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 6 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }} suppressHydrationWarning>سبد خرید شما خالی است</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} suppressHydrationWarning>برای شروع خرید به صفحه محصولات بروید.</Typography>
              <Button component={Link} href="/products" variant="contained" size="large" sx={{ width: { xs: '100%', sm: 'auto' } }}>مشاهده محصولات</Button>
            </CardContent>
          </Card>
        </Container>
      </AppShell>
    );
  }

  const handleNext = () => {
    // اگر در مرحله اول هستیم، چک کن شماره میز وارد شده
    if (activeStep === 0 && !tableNumber.trim()) {
      alert('لطفاً شماره میز را وارد کنید');
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePlaceOrder = async () => {
    const orderData = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice ?? 0),
        options: (item.options ?? []).map((opt) => ({
          id: opt.id,
          name: opt.name,
          additionalPrice: Number(opt.additionalPrice) || 0,
        })),
      })),
      totalAmount: grandTotal, // شامل قیمت کالاها + هزینه خدمات و مالیات
      paymentMethod,
      tableNumber: tableNumber, // ذخیره شماره میز در tableNumber
      notes: orderNotes,
    };

    try {
      // برای پرداخت آنلاین: فقط اطلاعات رو ذخیره کن و به زرین‌پال برو
      // سفارش بعد از پرداخت موفق ساخته میشه
      if (paymentMethod === 'ONLINE') {
        try {
          localStorage.setItem('pendingOrder', JSON.stringify(orderData));
        } catch (storageError) {
          console.warn('ثبت سفارش در حافظه محلی ناموفق بود', storageError);
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/api/pay/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
          });

          const paymentData = await response.json();
          const paymentUrl = paymentData.url || paymentData.data?.url;

          if (paymentData.success && paymentUrl && paymentData.pendingOrderId) {
            localStorage.setItem('pendingOrderId', paymentData.pendingOrderId);
            window.location.href = paymentUrl;
          } else {
            const reason = encodeURIComponent(paymentData.message || 'خطا در اتصال به درگاه پرداخت');
            router.push(`/orders/failure?reason=${reason}`);
          }
        } catch (paymentError) {
          console.error('خطا در ایجاد درگاه پرداخت:', paymentError);
          const reason = encodeURIComponent('خطا در اتصال به درگاه پرداخت');
          router.push(`/orders/failure?reason=${reason}`);
        }
        return;
      }

      // برای پرداخت در صندوق: سفارش رو بساز
      const createdOrder = await createOrderMutation.mutateAsync(orderData);

      if (createdOrder?.id) {
        try {
          localStorage.setItem('pendingClearCart', String(createdOrder.id));
        } catch (e) {
          // ignore storage errors
        }
        // Clear shared cart on server and local store
        try {
          if (shared && typeof shared.clearCart === 'function') {
            await shared.clearCart();
          }
        } catch (e) {
          console.warn('Failed to clear shared cart on server after order', e);
        }
        try {
          useCartStore.getState().clearCart();
        } catch (e) {
          // ignore
        }
        // پرداخت در صندوق - مستقیم به صفحه تایید برو
        router.push(`/orders/confirmation?orderId=${createdOrder.id}`);
      } else {
        const reason = encodeURIComponent('ثبت سفارش ناموفق بود. لطفاً دوباره تلاش کنید.');
        router.push(`/orders/failure?reason=${reason}`);
      }
    } catch (error) {
      console.error('خطا در ثبت سفارش:', error);
      // سایر خطاها: هدایت به صفحه ناموفق
      const msg = (() => {
        const m = (error as any)?.message || 'ثبت سفارش ناموفق بود.';
        return encodeURIComponent(m);
      })();
      try {
        router.push(`/orders/failure?reason=${msg}`);
      } catch {
        window.location.href = `/orders/failure?reason=${msg}`;
      }
    }
  };

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }} suppressHydrationWarning>
        <Box sx={{ display: { lg: 'grid' }, gridTemplateColumns: { lg: '1fr 350px' }, gap: 3 }} suppressHydrationWarning>
          <Box sx={{ width: '100%', mb: { xs: 3, lg: 0 } }} suppressHydrationWarning>
            <Card sx={{ boxShadow: '0 1px 2px var(--shadow-2)', borderRadius: 3 }} suppressHydrationWarning>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }} suppressHydrationWarning>
                {/* Collapsible Thumbnail Strip */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" suppressHydrationWarning>محصولات شما</Typography>
                    <IconButton
                      size="small"
                      onClick={() => setThumbsOpen((v) => !v)}
                      aria-label={thumbsOpen ? 'بستن پیش‌نمایش' : 'نمایش پیش‌نمایش'}
                      aria-pressed={thumbsOpen}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                          transform: thumbsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          '@media (prefers-reduced-motion: reduce)': {
                            transition: 'none',
                          },
                        }}
                      >
                        <ExpandMore />
                      </Box>
                    </IconButton>
                  </Box>
                  <Box
                    sx={{
                      overflow: 'hidden',
                      transition: 'max-height 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                      maxHeight: thumbsOpen ? 96 : 0,
                      opacity: thumbsOpen ? 1 : 0,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                      {items.map((item: any) => {
                        const firstImage = item.product.images?.[0];
                        const productImage = resolveImageUrl(firstImage);
                        return (
                          <Box key={`thumb-${item.productId}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
                            {productImage ? (
                              <Avatar src={productImage ?? undefined} variant="rounded" sx={{ width: 44, height: 44 }} />
                            ) : (
                              <Avatar variant="rounded" sx={{ width: 44, height: 44, background: getProductColor(item.product.id) }}>
                                <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 700 }} suppressHydrationWarning>
                                  {item.product.name?.charAt(0)}
                                </Typography>
                              </Avatar>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }} suppressHydrationWarning>{item.quantity}×</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel StepIconComponent={StepIcon as any} icon={step.icon}>
                        <Typography variant="body2" sx={{ fontWeight: activeStep === index ? 600 : 400 }} suppressHydrationWarning>
                          {step.label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Divider sx={{ my: activeStep === 1 ? 'var(--section-gap)' : 'calc(var(--section-gap) - 8px)' }} />
                <Box sx={{ minHeight: activeStep === 1 ? { xs: 0, md: 300 } : { xs: 0, md: 120 } }}>
                  <Fade in key={activeStep} timeout={240}>
                    <Box>
                      {getStepContent(activeStep)}
                    </Box>
                  </Fade>
                </Box>
                <Divider sx={{ my: activeStep === 1 ? 'var(--section-gap)' : 'calc(var(--section-gap) - 8px)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                  <Button
                    onClick={() => {
                      if (activeStep === 0) {
                        router.push('/cart');
                        return;
                      }
                      handleBack();
                    }}
                    variant="outlined"
                    size="large"
                    sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}
                  >
                    {t('common.back')}
                  </Button>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handlePlaceOrder}
                      disabled={createOrderMutation.isPending}
                      size="large"
                      sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {createOrderMutation.isPending ? 'درحال ثبت سفارش' : 'ثبت نهایی سفارش'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={activeStep === 0 && !tableNumber.trim()}
                      size="large"
                      sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {t('common.next')}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        {/* Order Summary Sidebar */}
        <Box sx={{ width: { xs: '100%', lg: 350 }, position: { lg: 'sticky' }, top: 24 }} suppressHydrationWarning>
          <Card sx={{ boxShadow: '0 1px 2px var(--shadow-2)', borderRadius: 3 }} suppressHydrationWarning>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }} suppressHydrationWarning>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }} suppressHydrationWarning>
                خلاصه سفارش
              </Typography>
              <Box sx={{ mb: 2, maxHeight: { md: 240 }, overflowY: { md: 'auto' }, pr: { md: 1 } }}>
                {items.map((item: any) => (
                  <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }} suppressHydrationWarning>
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" suppressHydrationWarning>
                      {toPersianDigits(item.quantity)}×
                    </Typography>
                    <Price amount={item.unitPrice * item.quantity} variant="body2" sx={{ minWidth: 60, textAlign: 'left' }} />
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'grid', rowGap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" suppressHydrationWarning>قیمت کالاها:</Typography>
                  <Price amount={subtotal} variant="body2" />
                </Box>
                {hasServiceFee && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" suppressHydrationWarning>هزینه خدمات:</Typography>
                    <Price amount={serviceFee} variant="body2" sx={{ color: 'text.secondary' }} />
                  </Box>
                )}
                {hasBulkDiscount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="success.main" suppressHydrationWarning>
                      {bulkDiscountLabel}
                    </Typography>
                    <Price amount={-bulkDiscountAmount} variant="body2" sx={{ color: 'success.main', fontWeight: 600 }} />
                  </Box>
                )}
                {hasTax && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" suppressHydrationWarning>
                      {taxRowLabel}
                    </Typography>
                    <Price amount={taxDisplayAmount} variant="body2" sx={{ color: 'text.secondary' }} />
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }} suppressHydrationWarning>
                    مجموع کل:
                  </Typography>
                  <Price amount={grandTotal} variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }} suppressHydrationWarning />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  </AppShell>
);
}