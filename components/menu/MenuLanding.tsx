'use client';

import { Box, Button, Typography } from '@mui/material';
import { Restaurant, LocalCafe } from '@mui/icons-material';
import colors, { hexToRgba, menuSelectionGradients } from '@/client-colors';
import { MenuType } from '@/stores/menuStore';
import { Footer } from '@/components/layout/Footer';

interface MenuLandingProps {
  onSelect: (type: MenuType) => void;
}

const menuOptions: Array<{ label: string; type: MenuType; gradient: string; icon: typeof Restaurant }> = [
  {
    label: 'منوی رستوران',
    type: 'RESTAURANT',
    gradient: menuSelectionGradients.restaurant,
    icon: Restaurant,
  },
  {
    label: 'منوی کافه',
    type: 'CAFE',
    gradient: menuSelectionGradients.cafe,
    icon: LocalCafe,
  },
];

export function MenuLanding({ onSelect }: MenuLandingProps) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: colors.pageBackground }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 6,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 640,
            textAlign: 'center',
            backgroundColor: colors.white,
            borderRadius: 8,
            boxShadow: '0 24px 80px rgba(20,20,20,0.08)',
            border: `1px solid ${hexToRgba(colors.gray200 ?? '#e5e7eb', 0.8)}`,
            p: { xs: 4, md: 6 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: colors.gray900,
                mb: 1,
              }}
            >
              خوش آمدید
            </Typography>
            <Typography sx={{ color: colors.gray600, mb: 4, fontSize: '1rem' }}>
              لطفاً منوی مورد نظر خود را انتخاب کنید تا تجربه‌ای دقیقاً مطابق سلیقه‌تان داشته باشید.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
              {menuOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.type}
                    onClick={() => onSelect(option.type)}
                    sx={{
                      flex: 1,
                      py: 2,
                      borderRadius: 16,
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      background: option.gradient,
                      color: colors.white,
                      border: 'none',
                      boxShadow: '0 16px 36px rgba(15,15,15,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 44px rgba(15,15,15,0.22)',
                        opacity: 0.95,
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: 34 }} />
                    {option.label}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
      <Footer />
    </div>
  );
}
