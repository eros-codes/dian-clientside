'use client';

import {
  Drawer,
  Typography,
  Box,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  Chip,
} from '@mui/material';
import { Close, ShoppingCart, Info } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSharedCart } from '@/hooks/useSharedCart';
import { useTranslations } from 'next-intl';
import { Price } from '@/components/ui/Price';
import { CartItem } from './CartItem';
import { useCartStore } from '@/stores/cartStore';
import { useCurrentTable } from '@/hooks/useCurrentTable';

export function CartDrawer() {
  const t = useTranslations();
  const { items, isOpen, closeCart, totalAmount, totalItems } = useCartStore();
  const { tableNumber } = useCurrentTable();
  const router = useRouter();
  const shared = useSharedCart();

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={closeCart}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 420, md: 480 } }
      }}
    >
  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: (theme) => `var(--cart-header-bg, ${theme.palette.background.paper})`, zIndex: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {t('cart.title')} ({totalItems})
          </Typography>
        </Box>
        <IconButton onClick={closeCart}>
          <Close />
        </IconButton>
      </Box>

      {/* Removed shared-cart info block per request */}

      {items.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {t('cart.empty')}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100dvh - 180px)', backgroundColor: (theme) => `var(--cart-body-bg, ${theme.palette.background.default})` }}>
            <List>
              {items.map((item) => (
                <ListItem key={item.id} sx={{ px: 2 }}>
                  <CartItem item={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ p: 2, position: 'sticky', bottom: 0, backgroundColor: (theme) => `var(--cart-footer-bg, ${theme.palette.background.paper})`, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('cart.totalPrice')}:
              </Typography>
              <Price amount={totalAmount} variant="h6" sx={{ fontWeight: 'bold' }} />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={async () => {
                  closeCart();
                  try {
                    if (shared && typeof shared.fetchCart === 'function') {
                      await shared.fetchCart();
                    }
                  } catch (e) {
                    console.warn('Failed to fetch shared cart before opening cart page', e);
                  }
                  router.push('/cart');
                }}
              >
                مشاهده سبد
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={async () => {
                  closeCart();
                  try {
                    if (shared && typeof shared.fetchCart === 'function') {
                      await shared.fetchCart();
                    }
                  } catch (e) {
                    console.warn('Failed to fetch shared cart before checkout', e);
                  }
                  router.push('/checkout');
                }}
              >
                {t('cart.checkout')}
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Drawer>
  );
}