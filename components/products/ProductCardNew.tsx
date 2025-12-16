// ProductCardNew.tsx - Wrapper for ConceptProductCard with Product type
"use client";

import React, { useMemo, useState } from 'react';
import { Box, Dialog, DialogContent, useTheme, useMediaQuery } from '@mui/material';
import { Product, SelectedOption } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useCartHydration } from '@/hooks/useCartHydration';
import { useCurrentTable } from '@/hooks/useCurrentTable';
import ConceptProductCard from '../product/ConceptProductCard';
import { ProductOptionsModal } from '../product/ProductOptionsModal';
import { ProductDetailContent } from '../product/ProductDetailContent';
import colors, { hexToRgba } from '@/client-colors';
import { toast } from 'sonner';

interface ProductCardNewProps {
  product: Product;
  hasTableSession?: boolean;
}

/** Resolve image url */
function resolveImageUrl(img: string | { url: string }): string | undefined {
  const val = typeof img === 'string' ? img : img?.url;
  if (!val) return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  const base = process.env.NEXT_PUBLIC_CLOUDINARY_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return base ? base.replace(/\/$/, '') + (val.startsWith("/") ? val : `/${val}`) : val;
}

export function ProductCardNew({ product, hasTableSession = true }: ProductCardNewProps) {
  const { addItem } = useCartStore();
  const isHydrated = useCartHydration();
  const { isSessionActive, tableNumber } = useCurrentTable();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState<number>(1);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery('(max-width:750px)');
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isProductAvailable = Boolean(
    product.isActive !== false && product.isAvailable === true,
  );

  const optionsList = useMemo(() => product.options ?? [], [product.options]);
  const hasSelectableOptions = useMemo(
    () => optionsList.some((opt) => opt.isAvailable),
    [optionsList]
  );

  const handleAddToCart = () => {
    if (!isHydrated) return;
    
    // Check table session
    if (!isSessionActive) {
      toast.error('لطفاً ابتدا شماره میز را با اسکن QR تعیین کنید');
      return;
    }

    if (!isProductAvailable) return;

    if (hasSelectableOptions) {
      setPendingQuantity(1);
      setIsOptionsOpen(true);
      return;
    }

    addItem(product, 1);
    toast.success(`${product.name} به سبد خرید افزوده شد`);
  };

  const handleOpenDetail = () => {
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handleConfirmOptions = (selected: SelectedOption[]) => {
    if (!isHydrated || !isSessionActive || !isProductAvailable) return;
    addItem(product, pendingQuantity, selected);
    setIsOptionsOpen(false);
    toast.success(`${product.name} به سبد خرید افزوده شد`);
  };

  // Get first image
  const firstImage = 
    Array.isArray(product.images) && product.images.length > 0
      ? resolveImageUrl(product.images[0].url)
      : undefined;

  // Calculate discount
  const hasProductDiscount = Number(product.discountPercent ?? 0) > 0;
  const categoryDiscount = Number((product.category as any)?.discountPercent ?? 0);
  const displayDiscount = hasProductDiscount ? Number(product.discountPercent) : categoryDiscount;
  
  const computedOriginal = product.originalPrice ?? (
    displayDiscount > 0 && product.price 
      ? Math.round(Number(product.price) / (1 - displayDiscount / 100)) 
      : product.price
  );

  return (
    <>
      <ConceptProductCard
        productId={product.id}
        title={product.name}
        price={product.price}
        category={product.category?.name ?? ''}
        imageUrl={firstImage}
        onAddToCart={handleAddToCart}
        onViewDetail={handleOpenDetail}
        originalPrice={computedOriginal}
        productDiscountPercent={hasProductDiscount ? Number(product.discountPercent) : undefined}
        categoryDiscountPercent={categoryDiscount > 0 ? categoryDiscount : undefined}
        showAddButton={hasTableSession && isProductAvailable}
        addButtonDisabled={!isProductAvailable || !isHydrated}
        ctaLabel={isProductAvailable ? undefined : 'ناموجود'}
        isAvailable={isProductAvailable}
      />

      {optionsList.length > 0 && (
        <ProductOptionsModal
          product={product}
          open={isOptionsOpen}
          onClose={() => setIsOptionsOpen(false)}
          onConfirm={handleConfirmOptions}
        />
      )}

      <Dialog
        open={isDetailOpen}
        onClose={handleCloseDetail}
        maxWidth="lg"
        scroll="body"
        sx={{
          '& .MuiDialog-container': {
            display: 'grid',
            placeItems: 'center',
            padding: { xs: '12px', sm: '20px', md: '32px' },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: isSmallScreen ? 2 : 3,
            backgroundColor: colors.quickViewPaperBg,
            boxShadow: `0 24px 48px ${hexToRgba(colors.quickViewShadowBase, 0.18)}`,
            overflow: 'hidden',
            overflowX: 'hidden',
            mx: 'auto',
            my: { xs: 2, sm: 4, md: 6 },
            width: '100%',
            maxWidth: isSmallScreen
              ? '100%'
              : isTablet
                ? 760
                : 880,
            maxHeight: isSmallScreen ? 'calc(100vh - 96px)' : 'calc(100vh - 72px)',
            boxSizing: 'border-box',
            alignSelf: 'center',
            marginLeft: 'auto !important',
            marginRight: 'auto !important',
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            backgroundColor: colors.quickViewContentBg,
            maxHeight: isSmallScreen ? 'calc(100vh - 96px)' : 'calc(100vh - 72px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <ProductDetailContent
              productId={product.id}
              variant="modal"
              forceMobileLayout={isSmallScreen}
              onRequestClose={handleCloseDetail}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
