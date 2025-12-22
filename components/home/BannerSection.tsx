'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import { useBanners } from '@/hooks/useApi';

// BannerSlider is client-only and uses Swiper; load dynamically
const BannerSlider = dynamic(() => import('@/components/home/BannerSlider'), { ssr: false });

export function BannerSection() {
  const banners = useBanners();

  // Only render if there are banners
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 0.5, px: 0 }}>
      <BannerSlider banners={banners} />
    </Box>
  );
}
