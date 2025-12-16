//aoo/local/products/page
'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { Container, Typography, Box, Button, ButtonGroup, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/layout/AppShell';
import ClientOnly from '@/components/ui/ClientOnly';
import { ProductCardNew as ProductCard } from '@/components/products/ProductCardNew';
import { ProductFilters } from '@/components/products/ProductFilters';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProductGridSkeleton } from '@/components/ui/ProductGridSkeleton';
import { FadeTransition } from '@/components/ui/FadeTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { MenuLanding } from '@/components/menu/MenuLanding';
import { useProducts, useCategories } from '@/hooks/useApi';
import { useCurrentTable } from '@/hooks/useCurrentTable';
import { useMenuStore, MenuType } from '@/stores/menuStore';
import colors, { hexToRgba, brandGradients } from '../../../client-colors';

const ITEMS_PER_PAGE = 12;

function ProductsInner() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [designMode, setDesignMode] = useState('magazine');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const { tableNumber } = useCurrentTable();
  const hasTableSession = !!(tableNumber && tableNumber.trim().length);
  const { menuType, hasHydrated, setMenuType } = useMenuStore();
  const prevMenuTypeRef = useRef<MenuType | null>(menuType);

  useEffect(() => {
    setPage(1);
  }, [menuType]);

  useEffect(() => {
    if (!hasHydrated) return;

    const prevMenuType = prevMenuTypeRef.current;
    if (!menuType || !prevMenuType || prevMenuType === menuType) {
      prevMenuTypeRef.current = menuType ?? null;
      return;
    }

    prevMenuTypeRef.current = menuType;
    const params = new URLSearchParams(searchParams.toString());
    if (params.has('category')) {
      params.delete('category');
      const nextQuery = params.toString();
      router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ''}`, { scroll: false });
    }
  }, [menuType, hasHydrated, router, pathname, searchParams]);

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    categoryType: menuType ?? undefined,
  };

  const { data: productsData, isLoading } = useProducts(filters, {
    enabled: hasHydrated && !!menuType,
  });
  const { data: categoriesData } = useCategories();
  const categories = useMemo(() => {
    if (!menuType || !categoriesData) return [];
    return categoriesData.filter((cat) => cat.isActive && cat.type === menuType);
  }, [categoriesData, menuType]);

  const filteredProducts = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data;
  }, [productsData]);

  const totalPages = Math.ceil((productsData?.total || 0) / ITEMS_PER_PAGE);

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  };

  // Handle category filter
  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCategory = params.get('category');
    
    if (currentCategory === categoryId) {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    router.push(`?${params.toString()}`);
  };

  const handleMenuSelect = (type: MenuType) => {
    setMenuType(type);
  };

  if (!hasHydrated) {
    return <LoadingState />;
  }

  if (!menuType) {
    return <MenuLanding onSelect={handleMenuSelect} />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: colors.primary }}>
          {t('products.title')}
        </Typography>
      </Box>

      {/* Different Layouts Based on Design Mode */}
      {designMode === 'magazine' && (
        // Magazine Style Layout - Premium Cafe Theme
        <Box>
          {/* Premium Search & Filter Section */}
          <Box sx={{ mb: 3 }}>
            {/* Search Bar */}
            <Box
              sx={{
                mb: 2,
                width: {
                  xs: '100%',
                  sm: '75%',
                  md: '60%',
                  lg: '50%',
                },
              }}
            >
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="جستجو در محصولات کافه..."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box
                        onClick={handleSearch}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: colors.primary,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: colors.primaryDark,
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        <SearchIcon sx={{ color: colors.white, fontSize: 24 }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: colors.white,
                    borderRadius: 8,
                    fontSize: '1.1rem',
                    border: `2px solid ${colors.headerFooterBg}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: colors.primary,
                      boxShadow: '0 4px 16px rgba(122, 30, 36, 0.15)',
                      transform: 'translateY(-2px)'
                    },
                    '&.Mui-focused': {
                      borderColor: colors.primary,
                      boxShadow: `0 4px 16px rgba(122, 30, 36, 0.15)`,
                      transform: 'translateY(-2px)'
                    },
                    '& fieldset': {
                      border: 'none'
                    }
                  }
                }}
              />
            </Box>

            {/* Categories with Brand Gradients */}
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1.5, 
                  color: colors.primary,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.3px'
                }}
              >
                دسته‌بندی محصولات
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {categories.map((cat: any, index: number) => {
                  const isActive = filters.category === cat.id;
                  const isDiscounted = Number(cat.discountPercent) > 0;
                  const gradient = brandGradients?.[index % (brandGradients.length || 1)] ?? colors.primary;
                  const activeBackground = gradient;
                  const inactiveBackground = colors.headerFooterBg;

                  return (
                    <Button 
                      key={cat.id}
                      variant="contained"
                      size="large"
                      onClick={() => handleCategoryClick(cat.id)}
                      sx={{ 
                        position: 'relative',
                        overflow: 'hidden',
                        background: isActive ? activeBackground : inactiveBackground,
                        border: 'none',
                        color: isActive ? colors.white : colors.primary,
                        borderRadius: 3,
                        px: 3,
                        py: 1.2,
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        boxShadow: isActive
                          ? '0 8px 22px rgba(122, 30, 36, 0.35)'
                          : '0 1px 3px rgba(0,0,0,0.08)',
                        transition: 'all 0.28s ease',
                        '&::after': undefined,
                        '&:hover': {
                          background: isActive
                            ? gradient
                            : colors.headerFooterBgDark,
                          color: isActive ? colors.white : colors.primary,
                          transform: 'translateY(-2px)',
                          boxShadow: isActive
                            ? '0 10px 26px rgba(122, 30, 36, 0.36)'
                            : '0 2px 8px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          position: 'relative',
                          zIndex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: isDiscounted ? 1.25 : 0.75,
                          letterSpacing: '-0.15px'
                        }}
                      >
                        <Box component="span" sx={{ fontWeight: 600 }}>
                          {cat.name}
                        </Box>
                        {isDiscounted && (
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.15,
                              py: 0.32,
                              borderRadius: 14,
                              background: `linear-gradient(135deg, ${hexToRgba(colors.danger, 0.6)} 0%, ${hexToRgba(colors.dangerDark, 0.64)} 100%)`,
                              border: `1px solid ${hexToRgba(colors.dangerDark, 0.62)}`,
                              color: colors.white,
                              fontSize: '0.7rem',
                              fontWeight: 750,
                              letterSpacing: '-0.2px',
                              textTransform: 'uppercase',
                              backdropFilter: 'blur(14px)',
                              boxShadow: `0 4px 14px ${hexToRgba(colors.black, 0.2)}`,
                              direction: 'rtl'
                            }}
                          >
                            -{Number(cat.discountPercent).toFixed(0)}%
                          </Box>
                        )}
                      </Box>
                    </Button>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* Products Grid Header */}
          <Box>
            <Box sx={{ 
              mb: 2,
              pb: 2,
              borderBottom: `2px solid ${colors.headerFooterBg}`
            }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary, letterSpacing: '-0.5px' }}>
                محصولات ما
              </Typography>
              <Typography variant="body2" sx={{ color: colors.gray500, mt: 0.5 }}>
                {productsData?.total || 0} محصول موجود
              </Typography>
            </Box>
            
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} hasTableSession={hasTableSession} />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default function ProductsPage() {
  return (
    <ClientOnly>
      <AppShell>
        <Suspense fallback={<LoadingState />}>
          <ProductsInner />
        </Suspense>
      </AppShell>
    </ClientOnly>
  );
}