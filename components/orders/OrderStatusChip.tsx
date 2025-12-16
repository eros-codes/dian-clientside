'use client';

import { Chip } from '@mui/material';
import { OrderStatus } from '@/types';

interface OrderStatusChipProps {
  status: OrderStatus;
}

const statusConfig = {
  PENDING: { label: 'درحال انتظار', color: 'warning' as const },
  CONFIRMED: { label: 'درحال آماده سازی', color: 'info' as const },
  DELIVERED: { label: 'تحویل داده شده', color: 'success' as const },
  PAID: { label: 'تسویه شده', color: 'success' as const },
  CANCELLED: { label: 'لغو شد', color: 'error' as const },
};

export function OrderStatusChip({ status }: OrderStatusChipProps) {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
    />
  );
}