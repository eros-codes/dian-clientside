'use client';

import { Typography, TypographyProps } from '@mui/material';
import { toPersianDigits } from '@/lib/utils';

interface PriceProps extends Omit<TypographyProps, 'children'> {
  amount: number;
  withCurrency?: boolean;
}

export function Price({ amount, withCurrency = true, ...props }: PriceProps) {
  const formatted = toPersianDigits(amount.toLocaleString('fa-IR'));
  return (
    <Typography component={props.component ?? 'span'} {...props} suppressHydrationWarning>
      {formatted}
      {withCurrency ? `\u00A0تومان` : ''}
    </Typography>
  );
}