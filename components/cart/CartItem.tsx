'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
  Divider,
  Stack,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import colors from '../../client-colors';
import { CartItem as CartItemType } from '@/types';
import { Price } from '@/components/ui/Price';
import { useTranslations } from 'next-intl';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useCartStore } from '@/stores/cartStore';
import { useSharedCart } from '@/hooks/useSharedCart';

interface CartItemProps {
  item: CartItemType;
}

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
  if (!base) return val.startsWith('/') ? val : val;
  return base.replace(/\/$/, '') + (val.startsWith('/') ? val : '/' + val);
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const { updateQuantity: updateSharedQuantity, removeItem: removeSharedItem } = useSharedCart();
  const [shaking, setShaking] = React.useState(false);
  const t = useTranslations();

  const shakeOnce = keyframes`
    0% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
    75% { transform: rotate(-6deg); }
    100% { transform: rotate(0deg); }
  `;

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.id, newQuantity);
    updateSharedQuantity(item.id, newQuantity);
  };

  const firstImage = item.product.images[0];
  const productImage = resolveImageUrl(firstImage);

  const handleRemove = () => {
    setShaking(true);
    setTimeout(() => {
      removeItem(item.id);
      removeSharedItem(item.id);
    }, 220);
  };

  return (
    <Card sx={{ mb: 1, width: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Product Image and Basic Info Row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {productImage ? (
              <CardMedia
                component="img"
                sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                image={productImage}
                alt={item.product.name}
              />
            ) : (
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  flexShrink: 0,
                  background: getProductColor(item.product.id), // 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
              >
                {item.product.name?.charAt(0).toUpperCase()}
              </Box>
            )}

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.product.name}
                  </Typography>
                  {Array.isArray(item.options) && item.options.length > 0 ? (
                    <Stack component="ul" spacing={0.5} sx={{ pl: 2, mt: 0.5 }}>
                      <Typography component="li" variant="caption" color="text.secondary">
                        {t('cart.selectedOptions', { defaultMessage: 'افزودنی‌ها:' })}
                      </Typography>
                      {item.options.map((opt) => (
                        <Typography key={`${item.id}-${opt.id ?? opt.name}`} component="li" variant="caption">
                          {opt.name} ·
                          <Price amount={opt.additionalPrice} variant="caption" sx={{ ml: 0.5 }} />
                        </Typography>
                      ))}
                    </Stack>
                  ) : null}
                </Box>
                <IconButton
                  onClick={handleRemove}
                  color="error"
                  size="small"
                  sx={{
                    flexShrink: 0,
                    '& svg': {
                      animation: shaking ? `${shakeOnce} 220ms ease-in-out` : 'none',
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none',
                      },
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>

              {/* Description intentionally hidden per UI requirement */}
            </Box>
          </Box>
          {/* Quantity and Price Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                تعداد:
              </Typography>
              <QuantityStepper value={item.quantity} onChange={handleQuantityChange} min={1} max={10} />
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography component="div" variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                واحد: <Price amount={item.unitPrice} variant="body2" />
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                <Price amount={item.unitPrice * item.quantity} variant="body1" />
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}