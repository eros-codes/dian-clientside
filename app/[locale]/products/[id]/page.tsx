// app/[locale]/products/[id]/page.tsx
'use client';

import { AppShell } from '@/components/layout/AppShell';
import { FadeTransition } from '@/components/ui/FadeTransition';
import { ProductDetailContent } from '@/components/product/ProductDetailContent';
import { useParams } from 'next/navigation';

export default function ProductPage() {
  const params = useParams();
  const productId = (params as any)?.id as string;

  if (!productId) {
    return null;
  }

  return (
    <AppShell>
      <FadeTransition>
        <ProductDetailContent productId={productId} variant="page" />
      </FadeTransition>
    </AppShell>
  );
}