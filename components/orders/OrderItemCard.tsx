//OrderItemCard
'use client';

import { 
  Box, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button,
  Chip,
  Stack,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import colors from '../../client-colors';
import { OrderItem, SelectedOption } from '@/types';
import { Price } from '@/components/ui/Price';
import { toPersianDigits } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useSyncedCart } from '@/hooks/useSyncedCart';
import { useCurrentTable } from '@/hooks/useCurrentTable';
import { useRouter } from 'next/navigation';

// 🔹 گرادیانت ثابت
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

// 🔹 ساخت لینک نهایی عکس
function resolveImageUrl(img: unknown): string | undefined {
  if (!img) return undefined;
  const val = typeof img === 'string' ? img : 
  (img as any)?.url ||
  (img as any)?.secure_url ||
  (img as any)?.path;
  if (!val || typeof val !== 'string') return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  const base =
    process.env.NEXT_PUBLIC_CLOUDINARY_BASE ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    '';
  return base ? base.replace(/\/$/, '') + (val.startsWith('/') ? val : '/' + val) : val;
}

interface OrderItemCardProps {
  item: OrderItem;
  showReorderButton?: boolean;
}

export function OrderItemCard({ item, showReorderButton = false }: OrderItemCardProps) {
  // Normalize product name from multiple possible shapes
  const productName =
    item.product?.name ||
    ((item as any).productName as string | undefined) ||
    ((item.product as any)?.productName as string | undefined) ||
    'محصول';

  // Gather possible image arrays from different response shapes
  const possibleImageArrays: Array<any[] | undefined> = [
  (item.product as any)?.images,
  (item.product as any)?.productImages,
  (item as any).productImages,
  ];

  let firstImage: any = undefined;
  for (const arr of possibleImageArrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      firstImage = arr[0];
      break;
    }
  }

  const productImage = resolveImageUrl(firstImage);

  // resolved product name and image ready for display

  const totalAmount =
    typeof item.totalPrice === 'number'
      ? item.totalPrice
      : (item.unitPrice || 0) * (item.quantity || 0);

  const syncedCart = useSyncedCart();
  const { isSessionActive } = useCurrentTable();
  const router = useRouter();

  const handleReorder = () => {
    if (!item.product) return;
    
    // اضافه کردن محصول به سبد خرید با همون تعداد
    const normalizedOptions: SelectedOption[] = (item.options ?? []).map((opt) => ({
      id: opt.id,
      name: opt.name,
      additionalPrice: Number(opt.additionalPrice) || 0,
    }));

    syncedCart.addItem(item.product, item.quantity, normalizedOptions);
    
    // رفتن به صفحه سبد خرید
    router.push('/cart');
  };

// image debug removed
  
  return (
    <>
      <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        {productImage ? (
          <CardMedia
            component="img"
            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
            image={productImage}
            alt={item.product?.name ||'محصول'}
          />
        ) : (
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 1,
              flexShrink: 0,
              background: getProductColor(item.product?.id || ''),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            {item.product?.name?.charAt(0).toUpperCase() || '?'}
          </Box>
        )}

        <CardContent sx={{ flex: 1, py: 0, px: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {productName}
            </Typography>
            {showReorderButton && (
              <Button
                size="small"
                variant="contained"
                startIcon={<ShoppingCart />}
                onClick={handleReorder}
                sx={{ 
                  ml: 1,
                  bgcolor: colors.reorderButton,
                  color: colors.white,
                  '&:hover': {
                    bgcolor: colors.reorderButtonHover
                  }
                }}
              >
                سفارش مجدد
              </Button>
            )}
          </Box>
          <Stack spacing={1.25}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                تعداد: {toPersianDigits(item.quantity)}
              </Typography>
              <Price amount={totalAmount} variant="body1" sx={{ fontWeight: 'bold' }} />
            </Box>

            {(item.options?.length ?? 0) > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {item.options!.map((opt) => (
                  <Chip
                    key={`${opt.id ?? opt.name}`}
                    label={`${opt.name} · ${toPersianDigits(Number(opt.additionalPrice) || 0)} تومان`}
                    size="small"
                    sx={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                افزودنی ندارد
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}