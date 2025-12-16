'use client';

import { Container, Typography, Box, Card, CardContent } from '@mui/material';
import colors, { hexToRgba, brandGradients } from '../../client-colors';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { bannersApi } from '@/lib/api-real';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { ProductCardNew as ProductCard } from '@/components/products/ProductCardNew';
import { LoadingState } from '@/components/ui/LoadingState';
import { FadeTransition } from '@/components/ui/FadeTransition';
import { HomeCategoriesSkeleton, HomeFeaturedSkeleton } from '@/components/ui/HomeSkeletons';
import { useProducts, useCategories, usePopularProducts } from '@/hooks/useApi';
import { Product } from '@/types';
import { useCurrentTable } from '@/hooks/useCurrentTable';
import { resolveAssetUrl } from '@/lib/api';
import { MenuLanding } from '@/components/menu/MenuLanding';
import { MenuType, useMenuStore } from '@/stores/menuStore';
// BannerSlider is client-only and uses Swiper; load dynamically
const BannerSlider = dynamic(() => import('@/components/home/BannerSlider'), { ssr: false });

function useBanners() {
  const [banners, setBanners] = useState<any[] | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await bannersApi.getBanners();
        if (!mounted) return;
        // ensure array and only active banners, sorted by order asc
        const arr = Array.isArray(data) ? data : [];
        // include only active banners that have an imageUrl
        const active = arr
          .filter((b: any) => b.isActive && b.imageUrl)
          .sort((a: any, z: any) => (a.order ?? 0) - (z.order ?? 0));
        setBanners(active);
      } catch (e) {
        // errors intentionally not logged to console
        setBanners([]);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return banners;
}

export default function HomePage() {
  const t = useTranslations();
  const { menuType, hasHydrated, setMenuType } = useMenuStore();
  const { data: productsData, isLoading, error } = usePopularProducts({
    limit: 8,
    categoryType: menuType ?? undefined,
    enabled: hasHydrated && !!menuType,
  }) as { data?: Product[]; isLoading: boolean; error?: any };
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { tableNumber } = useCurrentTable();
  const hasTableSession = !!(tableNumber && tableNumber.trim().length);

  // Generate a consistent color based on category ID
  const getCategoryColor = (id: string) => {
    const gradientList = brandGradients;
    // Use a more stable hash function for consistent server/client rendering
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % gradientList.length;
    return gradientList[index];
  };

  const banners = useBanners();

  const filteredCategories = useMemo(() => {
    if (!menuType) return [];
    return categories.filter((category) => category.isActive && category.type === menuType);
  }, [categories, menuType]);

  const filteredProducts = useMemo(() => {
    if (!menuType || !productsData) return [];
    return productsData.filter((product) => product.category?.type === menuType);
  }, [productsData, menuType]);

  const handleMenuSelect = (type: MenuType) => {
    setMenuType(type);
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-pulse text-gray-500 text-sm">در حال بارگذاری…</div>
      </div>
    );
  }

  if (!menuType) {
    return <MenuLanding onSelect={handleMenuSelect} />;
  }

  return (
    <AppShell>
  <Container maxWidth="xl" sx={{ py: 1 }}>
        {/* Site Banners (from admin) - replace hero with slider */}
        <Box sx={{ mb: 0.5 }}>
          <BannerSlider banners={banners ?? []} />
        </Box>

        {/* Categories */}
        <Box sx={{ mb: 8 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold', 
              mb: 4,
              color: colors.gray900,
              textAlign: 'center',
            }}
          >
            دسته‌بندی‌های محصولات
          </Typography>
          
          {categoriesLoading ? (
            <HomeCategoriesSkeleton />
          ) : (
            <FadeTransition>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                  lg: 'repeat(6, 1fr)',
                },
                gap: 3,
              }}
            >
              {filteredCategories
                .sort((a, b) => {
                  const aDisc = !!(a.discountPercent && a.discountPercent > 0);
                  const bDisc = !!(b.discountPercent && b.discountPercent > 0);
                  if (aDisc && !bDisc) return -1;
                  if (!aDisc && bDisc) return 1;
                  return 0;
                })
                .map((category, index) => {
                  const background = brandGradients[index % brandGradients.length] ?? getCategoryColor(category.id);
                  const hasIcon = !!category.iconPath;
                  const iconSrc = hasIcon ? resolveAssetUrl(category.iconPath) : '';
                  const fallbackLetter = category.name?.charAt(0)?.toUpperCase() || '?';

                  return (
                    <Link
                      href={`/products?category=${category.id}`}
                      style={{ textDecoration: 'none' }}
                      key={category.id}
                      aria-label={
                        category.discountPercent && category.discountPercent > 0
                          ? `دسته: ${category.name} — تخفیف ${category.discountPercent} درصد`
                          : `دسته: ${category.name}`
                      }
                    >
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          borderRadius: 3,
                          overflow: 'hidden',
                          border: 'none',
                          boxShadow: `0 4px 20px var(--shadow-2)`,
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: `0 20px 40px var(--shadow-4)`,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            height: 120,
                            background,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              backgroundColor: hexToRgba(colors.white, 0.18),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backdropFilter: 'blur(14px)',
                              border: `1px solid ${hexToRgba(colors.white, 0.28)}`,
                              boxShadow: `0 12px 28px rgba(0,0,0,0.18)`,
                            }}
                          >
                            {hasIcon ? (
                              <Box
                                role="img"
                                aria-label={`${category.name} icon`}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  bgcolor: '#fff',
                                  mask: `url(${iconSrc}) center / contain no-repeat`,
                                  WebkitMask: `url(${iconSrc}) center / contain no-repeat`,
                                }}
                              />
                            ) : (
                              <Typography
                                variant="h4"
                                sx={{
                                  color: '#fff',
                                  fontWeight: 800,
                                  letterSpacing: '-0.6px',
                                  textShadow: `0 4px 12px rgba(0,0,0,0.35)`,
                                }}
                              >
                                {fallbackLetter}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <CardContent
                          sx={{
                            textAlign: 'center',
                            py: 2,
                            px: 2,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: colors.gray900,
                              fontSize: '1rem',
                              lineHeight: 1.3,
                            }}
                          >
                            {category.name}
                          </Typography>
                          {category.description && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                display: 'block',
                                mt: 0.5,
                              }}
                            >
                              {category.description}
                            </Typography>
                          )}
                          {category.discountPercent && category.discountPercent > 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                              <Box
                                component="span"
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  px: 1.6,
                                  py: 0,
                                  minWidth: 54,
                                  height: 26,
                                  borderRadius: 999,
                                  fontWeight: 800,
                                  letterSpacing: '-0.2px',
                                  textTransform: 'uppercase',
                                  fontSize: '0.8rem',
                                  lineHeight: 1,
                                  color: colors.white,
                                  backgroundColor: hexToRgba(colors.primary, 0.79),
                                  border: `1px solid ${hexToRgba(colors.primary, 0.5)}`,
                                  backdropFilter: 'blur(8px)',
                                  WebkitBackdropFilter: 'blur(8px)',
                                  textShadow: 'none',
                                  boxShadow: 'none',
                                }}
                              >
                                -{category.discountPercent}%
                              </Box>
                            </Box>
                          ) : null}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </Box>
            </FadeTransition>
          )}
        </Box>

        {/* Featured Products */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: colors.gray900, textAlign: 'center' }}>
              محصولات محبوب
            </Typography>
            <Link href="/products" style={{ textDecoration: 'none' }}>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2.4,
                  py: 0.6,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: colors.white,
                  background: colors.primary,
                  boxShadow: `0 6px 14px ${hexToRgba(colors.black, 0.18)}`,
                }}
              >
                مشاهده همه
              </Box>
            </Link>
          </Box>
          
          {isLoading ? (
            <HomeFeaturedSkeleton />
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">
                خطا در بارگذاری محصولات: {error.message}
              </Typography>
            </Box>
          ) : filteredProducts.length > 0 ? (
            <FadeTransition>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 3,
              }}
            >
              {filteredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} hasTableSession={hasTableSession} />
              ))}
            </Box>
            </FadeTransition>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                هیچ محصولی یافت نشد
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </AppShell>
  );
}