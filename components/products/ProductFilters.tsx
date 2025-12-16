// components/products/ProductFilters.tsx

"use client";

import colors, { brandGradients } from '../../client-colors';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Button,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { debounce } from '@/lib/utils';
import { useCategories } from '@/hooks/useApi';
import { Chip } from '@mui/material';
import { resolveAssetUrl } from '@/lib/api';

function getCategoryColor(id: string) {
  const stops = colors.gradientStops;
  const palette = [...stops];
  let hash = 0;
  for (let i = 0; i < id.length; i++) { hash = (hash << 5) - hash + id.charCodeAt(i); hash |= 0; }
  return palette[Math.abs(hash) % palette.length];
}

export function ProductFilters() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  const updateFilters = debounce((filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    router.push(`/products?${params.toString()}`);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateFilters({ search: value, category });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateFilters({ search, category: value });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    router.push('/products');
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            فیلترها
          </Typography>
          <Button
            startIcon={<Clear />}
            onClick={clearFilters}
            size="small"
            color="error"
          >
            پاک کردن
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ my: 3 }} />

        {/* Category Filter */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('products.category')}</InputLabel>
          <Select
            value={category}
            label={t('products.category')}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={categoriesLoading}
          >
            <MenuItem value="">همه</MenuItem>
            {categories
              .filter((cat) => cat.isActive)
              .map((cat, index) => {
                const background = brandGradients[index % brandGradients.length] ?? colors.gradientStops[index % colors.gradientStops.length];
                const hasIcon = !!cat.iconPath;
                const iconSrc = hasIcon ? resolveAssetUrl(cat.iconPath) : '';
                const fallbackLetter = cat.name?.charAt(0)?.toUpperCase() || '?';
                return (
                  <MenuItem
                    key={cat.id}
                    value={cat.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 1.2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: `1px solid ${colors.gray200}`,
                        background,
                        color: '#fff',
                        boxShadow: `0 6px 14px rgba(122, 30, 36, 0.18)`,
                        position: 'relative',
                      }}
                    >
                      {hasIcon ? (
                        <Box
                          role="img"
                          aria-label={`${cat.name} icon`}
                          sx={{
                            width: 22,
                            height: 22,
                            bgcolor: '#fff',
                            mask: `url(${iconSrc}) center / contain no-repeat`,
                            WebkitMask: `url(${iconSrc}) center / contain no-repeat`,
                          }}
                        />
                      ) : (
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>
                          {fallbackLetter}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: colors.gray800 }}>
                        {cat.name}
                      </Typography>
                      {cat.iconPath ? (
                        <Typography variant="caption" sx={{ color: colors.gray500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          آیکون سفارشی
                        </Typography>
                      ) : null}
                    </Box>
                    {cat.discountPercent && cat.discountPercent > 0 ? (
                      <Chip
                        label={`-${cat.discountPercent}%`}
                        size="small"
                        color="error"
                        sx={{ ml: 'auto', fontWeight: 600 }}
                      />
                    ) : null}
                  </MenuItem>
                );
              })}
          </Select>
        </FormControl>


      </CardContent>
    </Card>
  );
}