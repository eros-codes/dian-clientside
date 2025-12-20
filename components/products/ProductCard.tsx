// components/products/ProductCard.tsx
"use client";

import React from 'react';
import { keyframes } from '@mui/system';
import colors, { hexToRgba, brandGradients } from '../../client-colors';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Product } from '@/types';
import { Price } from '@/components/ui/Price';
import { toPersianDigits } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useSharedCart } from '@/hooks/useSharedCart';
import { useSyncedCart } from '@/hooks/useSyncedCart';
import { useCartHydration } from '@/hooks/useCartHydration';
import { useCurrentTable } from '@/hooks/useCurrentTable';
import { toast } from 'sonner';
import { ProductOptionsModal } from '@/components/product/ProductOptionsModal';
import ClientOnly from '@/components/ui/ClientOnly';
import { truncateText } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

/** Resolve image url:
 *  - if string and absolute -> return
 *  - if string and relative -> prefix with NEXT_PUBLIC_CLOUDINARY_BASE (if present)
 *  - if object with url -> same logic
 */
function resolveImageUrl(img: string | { url: string }): string | undefined {
  const val = typeof img === 'string' ? img : img?.url;
  if (!val) return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  const base = process.env.NEXT_PUBLIC_CLOUDINARY_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return base ? base.replace(/\/$/, '') + (val.startsWith("/") ? val : `/${val}`) : val;
}

export function ProductCard({ product }: ProductCardProps) {
  
  
  const t = useTranslations();
  const syncedCart = useSyncedCart();
  const isHydrated = useCartHydration();
  const [cartAnim, setCartAnim] = React.useState(false);
  const [orderCount, setOrderCount] = React.useState(5); // TEMP: Fixed test value

  // Get current item count from cart
  const currentItemCount = syncedCart.items.find(item => item.productId === product.id)?.quantity || 0;

  

  // Update local count when cart changes
  React.useEffect(() => {
    setOrderCount(currentItemCount);
  }, [currentItemCount]);
  const bounceOnce = keyframes`
    0% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-3px) scale(1.06); }
    100% { transform: translateY(0) scale(1); }
  `;

  const isProductAvailable = product.isAvailable !== false && product.isActive;
  const addDisabled = !isProductAvailable || !isHydrated;
  const { isSessionActive } = useCurrentTable();

  const optionsList = React.useMemo(() => product.options ?? [], [product.options]);
  const hasSelectableOptions = React.useMemo(
    () => optionsList.some((opt) => opt.isAvailable),
    [optionsList],
  );

  const [isOptionsOpen, setIsOptionsOpen] = React.useState(false);
  const [pendingQuantity, setPendingQuantity] = React.useState<number>(1);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (addDisabled) return;
    // require table session for adding (same UX as ProductCardNew)
    if (!isSessionActive) {
      toast.error('لطفاً ابتدا شماره میز را با اسکن QR تعیین کنید');
      return;
    }

    if (hasSelectableOptions) {
      setPendingQuantity(1);
      setIsOptionsOpen(true);
      return;
    }

    syncedCart.addItem(product);
    setCartAnim(true);
    setTimeout(() => setCartAnim(false), 320);
  };

  const handleConfirmOptions = (selectedOptions: any[]) => {
    if (!isHydrated || !isProductAvailable || !isSessionActive) return;
    syncedCart.addItem(product, pendingQuantity, selectedOptions);
    setIsOptionsOpen(false);
    toast.success(`${product.name} به سبد خرید افزوده شد`);
  };

  const getProductColor = (id: string) => {
    const palette = brandGradients;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  };

  // take first image (if any)
  const firstImage = 
  Array.isArray(product.images) && product.images.length > 0
    ? resolveImageUrl(product.images[0].url)
    : undefined;

  const hasProductDiscount = Number(product.discountPercent ?? 0) > 0;
  const categoryDiscount = Number((product.category as any)?.discountPercent ?? 0);
  const hasAnyDiscount = hasProductDiscount || categoryDiscount > 0;
  const displayDiscount = hasProductDiscount ? Number(product.discountPercent) : categoryDiscount;
  const computedOriginal = product.originalPrice ?? (
    displayDiscount > 0 && product.price ? Math.round(Number(product.price) / (1 - displayDiscount / 100)) : product.price
  );
  const originalText = toPersianDigits((computedOriginal ?? product.price)?.toLocaleString('fa-IR'));
  const originalTextWithCurrency = `${originalText}\u00A0تومان`;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 240ms ease, box-shadow 240ms ease',
        borderRadius: 2,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': {
          transform: 'translateY(-6px) scale(1.02)',
          boxShadow: `0 18px 40px var(--shadow-2)`,
        },
      }}
    >
      {/* Click-to-open page */}
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box sx={{ display: 'block' }}>
          <Box
            sx={{
              height: 200,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: firstImage ? 'transparent' : getProductColor(product.id),
            }}
          >
            {/* Discount badge on image: show only when product has its own discount */}
            {hasProductDiscount ? (
              <Chip
                label={`-${displayDiscount}%`}
                size="small"
                color="error"
                sx={{ position: 'absolute', top: 8, left: 8, zIndex: 5, fontWeight: 700 }}
              />
            ) : null}
            {firstImage ? (
              <CardMedia
                component="img"
                image={firstImage}
                alt={product.name}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: hexToRgba(colors.white, 0.18),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${hexToRgba(colors.white, 0.28)}`,
                }}
              >
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                  {product.name?.charAt(0)?.toUpperCase() ?? ''}
                </Typography>
              </Box>
            )}
          </Box>

          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 0.5,
                  textAlign: 'right',
                  lineHeight: 1.3,
                  fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
                }}
                title={product.name}
              >
                {truncateText(product.name || '', 72)}
              </Typography>
              <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={product.category?.name ?? ''}
                  size="small"
                  sx={{
                    backgroundColor: hexToRgba(colors.badgeBlue, 0.08),
                    color: colors.badgeBlue,
                    fontWeight: 600,
                    borderRadius: 1.5,
                    fontSize: '0.7rem',
                    height: 22,
                    '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                  }}
                />
              </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', gap: 0.5, width: '100%' }}>
              {!isProductAvailable ? (
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap' }}
                >
                  ناموجود
                </Typography>
              ) : hasProductDiscount ? (
                <>
                  <Typography
                    variant="body2"
                    sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    {originalTextWithCurrency}
                  </Typography>
                  <Price
                    amount={product.price}
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: 'var(--price-primary)',
                      fontSize: { xs: '0.98rem', sm: '1.08rem', md: '1.18rem' },
                      whiteSpace: 'nowrap',
                    }}
                    withCurrency
                  />
                </>
              ) : (
                <Price
                  amount={product.price}
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: hasAnyDiscount ? 'var(--price-primary)' : 'var(--price-regular)',
                    fontSize: { xs: '0.98rem', sm: '1.08rem', md: '1.18rem' },
                    whiteSpace: 'nowrap',
                  }}
                  withCurrency
                />
              )}
            </Box>
          </CardContent>
        </Box>
      </Link>

      {/* Card actions shown only when product is available */}
      {isProductAvailable && (
        <CardActions sx={{ p: 2, mt: 'auto' }}>
          <ClientOnly
            fallback={
              <Button fullWidth variant="contained" disabled sx={{ textTransform: 'none' }}>...</Button>
            }
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <ShoppingCart />
                  {/* Cart item count badge - ALWAYS VISIBLE FOR TEST */}
                  {true && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -12,
                        backgroundColor: '#ef4444', // red-500
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' }
                        },
                      }}
                    >
                      {toPersianDigits(orderCount.toString())}
                    </Box>
                  )}
                </Box>
              }
              onClick={handleAddToCart}
              disabled={addDisabled}
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                '& .MuiButton-startIcon': {
                  animation: cartAnim ? `${bounceOnce} 320ms ease-in-out` : 'none',
                  '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                  },
                },
              }}
            >
              {t('products.addToCart') as string ?? 'افزودن به سبد'}
            </Button>
          </ClientOnly>
        </CardActions>
      )}

      {optionsList.length > 0 && (
        <ProductOptionsModal
          product={product}
          open={isOptionsOpen}
          onClose={() => setIsOptionsOpen(false)}
          onConfirm={handleConfirmOptions}
        />
      )}
    </Card>
  );
}