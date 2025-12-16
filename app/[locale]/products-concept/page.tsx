'use client';

import { useState, Suspense } from 'react';
import { Container, Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/layout/AppShell';
import ClientOnly from '@/components/ui/ClientOnly';
import { ProductFilters } from '@/components/products/ProductFilters';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProductGridSkeleton } from '@/components/ui/ProductGridSkeleton';
import { FadeTransition } from '@/components/ui/FadeTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useProducts } from '@/hooks/useApi';
import ConceptProductCard from '@/components/product/ConceptProductCard';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardNew } from '@/components/products/ProductCardNew';
import { useCartStore } from '@/stores/cartStore';

const ITEMS_PER_PAGE = 12;

function resolveImageUrl(val?: string): string | undefined {
  if (!val) return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  const base = process.env.NEXT_PUBLIC_CLOUDINARY_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return base ? base.replace(/\/$/, '') + (val.startsWith('/') ? val : `/${val}`) : val;
}

function ProductsConceptInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const { addItem } = useCartStore();
  const [view, setView] = useState<'concept' | 'classic'>('concept');

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  };

  const { data: productsData, isLoading } = useProducts(filters);
  const totalPages = Math.ceil((productsData?.total || 0) / ITEMS_PER_PAGE);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('products.title')} — Concept
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
          gap: 4,
        }}
      >
        {/* Filters Sidebar (reuse) */}
        <Box>
          <ProductFilters />
        </Box>

        {/* Products Grid with toggle between Concept and Classic cards */}
        <Box>
          {isLoading ? (
            <ProductGridSkeleton />
          ) : productsData?.data.length === 0 ? (
            <EmptyState title="موردی یافت نشد" description="محصولی با این مشخصات پیدا نشد. فیلترها را تغییر دهید." />
          ) : (
            <FadeTransition>
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {productsData?.total} محصول یافت شد
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    color="primary"
                    exclusive
                    value={view}
                    onChange={(_, v) => v && setView(v)}
                  >
                    <ToggleButton value="concept">طرح جدید</ToggleButton>
                    <ToggleButton value="classic">طرح قبلی</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(3, 1fr)',
                    },
                    gap: 3,
                  }}
                >
                  {productsData?.data.map((p: any) => (
                    view === 'concept' ? (
                      <ProductCardNew key={p.id} product={p} />
                    ) : (
                      <ProductCard key={p.id} product={p} />
                    )
                  ))}
                </Box>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Pagination count={totalPages} page={page} onChange={(_, newPage) => setPage(newPage)} />
                  </Box>
                )}
              </>
            </FadeTransition>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default function ProductsConceptPage() {
  return (
    <ClientOnly>
      <AppShell>
        <Suspense fallback={<LoadingState />}>
          <ProductsConceptInner />
        </Suspense>
      </AppShell>
    </ClientOnly>
  );
}
