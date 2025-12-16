//OrderSummary
'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import { CartItem } from '@/types';
import { Price } from '@/components/ui/Price';
import { toPersianDigits } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useCurrentTable } from '@/hooks/useCurrentTable';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  serviceFee: number;
  taxAmount: number;
  taxRate: number;
  grandTotal: number;
  bulkDiscountAmount?: number;
  bulkDiscountLabel?: string;
}

export function OrderSummary({
  items,
  subtotal,
  serviceFee,
  taxAmount,
  taxRate,
  grandTotal,
  bulkDiscountAmount = 0,
  bulkDiscountLabel = 'تخفیف دیان برای شما',
}: OrderSummaryProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { tableNumber } = useCurrentTable();

  const formatDigits = (value: number): string => {
    if (locale === 'fa') {
      return toPersianDigits(String(value));
    }
    return Number(value).toLocaleString(locale);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasServiceFee = Number(serviceFee) > 0;
  const hasTax = Math.abs(taxAmount) > 0.009;
  const isDiscount = taxAmount < -0.009;
  const hasBulkDiscount = bulkDiscountAmount > 0.009;
  const quantityLabel = t('common.quantity');
  const normalizedQuantityLabel = quantityLabel === 'common.quantity' ? 'تعداد آیتم‌ها' : quantityLabel;
  const formattedTaxRate = (() => {
    if (!hasTax) return formatDigits(0);
    const absolute = Math.abs(taxRate);
    const normalized = Number.isInteger(absolute)
      ? absolute
      : Number(absolute.toFixed(2));
    const formatted = formatDigits(normalized);
    return `${formatted}%`;
  })();
  const taxRowLabel = isDiscount
    ? t('checkout.discountLabel', { rate: formattedTaxRate })
    : t('checkout.taxLabel', { rate: formattedTaxRate });
  const taxDisplayAmount = isDiscount ? Math.abs(taxAmount) : taxAmount;

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          {t('checkout.reviewHeading')}
        </Typography>

        {/* Removed table-number alert per request */}

        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {t('checkout.summaryHeading')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">{normalizedQuantityLabel}:</Typography>
            <Typography variant="body2">{formatDigits(totalItems)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2">{t('checkout.itemsSubtotal')}:</Typography>
            <Price amount={subtotal} variant="body2" />
          </Box>
          <Divider sx={{ my: 2 }} />
          {hasServiceFee && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('checkout.serviceFee')}:</Typography>
              <Price amount={serviceFee} variant="body2" sx={{ color: 'text.secondary' }} />
            </Box>
          )}
          {hasBulkDiscount && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="success.main">{bulkDiscountLabel}:</Typography>
              <Price amount={-bulkDiscountAmount} variant="body2" sx={{ color: 'success.main', fontWeight: 600 }} />
            </Box>
          )}
          {hasTax && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{taxRowLabel}</Typography>
              <Price amount={taxDisplayAmount} variant="body2" sx={{ color: 'text.secondary' }} />
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{t('checkout.totalLabel')}:</Typography>
            <Price amount={grandTotal} variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }} />
          </Box>
        </Box>

      </CardContent>
    </Card>
  );
}