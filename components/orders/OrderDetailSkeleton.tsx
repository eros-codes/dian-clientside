'use client';

import { Container, Box, Card, CardContent, Skeleton } from '@mui/material';
import colors from '../../client-colors';

export function OrderDetailSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Skeleton */}
      <Box 
        sx={{ 
          mb: 4,
          bgcolor: colors.orderCardBg,
          borderRight: `4px solid ${colors.primary}`,
          p: 2.5,
          borderRadius: 2
        }}
      >
        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="30%" height={24} />
      </Box>

      {/* Order Info Grid Skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
          mb: 4,
        }}
      >
        {/* وضعیت سفارش */}
        <Card 
          elevation={0}
          sx={{ 
            background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}05 100%)`,
            border: `1px solid ${colors.primary}30`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Skeleton 
                variant="rectangular" 
                width={40} 
                height={40} 
                sx={{ borderRadius: 2 }} 
              />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width="80%" height={32} sx={{ borderRadius: 5 }} />
          </CardContent>
        </Card>

        {/* روش پرداخت */}
        <Card 
          elevation={0}
          sx={{ 
            background: `linear-gradient(135deg, ${colors.info}15 0%, ${colors.info}05 100%)`,
            border: `1px solid ${colors.info}30`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Skeleton 
                variant="rectangular" 
                width={40} 
                height={40} 
                sx={{ borderRadius: 2 }} 
              />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="text" width="70%" height={28} />
          </CardContent>
        </Card>

        {/* تاریخ ثبت */}
        <Card 
          elevation={0}
          sx={{ 
            background: `linear-gradient(135deg, ${colors.warning}15 0%, ${colors.warning}05 100%)`,
            border: `1px solid ${colors.warning}30`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Skeleton 
                variant="rectangular" 
                width={40} 
                height={40} 
                sx={{ borderRadius: 2 }} 
              />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="text" width="75%" height={28} />
          </CardContent>
        </Card>

        {/* مبلغ کل */}
        <Card 
          elevation={0}
          sx={{ 
            background: `linear-gradient(135deg, ${colors.success}20 0%, ${colors.success}08 100%)`,
            border: `2px solid ${colors.success}40`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Skeleton 
                variant="rectangular" 
                width={40} 
                height={40} 
                sx={{ borderRadius: 2 }} 
              />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="text" width="85%" height={36} />
          </CardContent>
        </Card>
      </Box>

      {/* آدرس ارسال Skeleton */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${colors.borderLight}`,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Skeleton 
            variant="circular" 
            width={20} 
            height={20} 
            sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} 
          />
          <Skeleton 
            variant="text" 
            width={100} 
            height={24} 
            sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} 
          />
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 5 }} />
            <Skeleton variant="rectangular" width={90} height={32} sx={{ borderRadius: 5 }} />
            <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 5 }} />
            <Skeleton variant="rectangular" width={140} height={32} sx={{ borderRadius: 5 }} />
          </Box>
          <Skeleton variant="text" width="90%" height={24} />
        </CardContent>
      </Card>

      {/* آیتم‌های سفارش Skeleton */}
      <Card 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          border: `1px solid ${colors.borderLight}`,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Skeleton 
            variant="circular" 
            width={20} 
            height={20} 
            sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} 
          />
          <Skeleton 
            variant="text" 
            width={120} 
            height={24} 
            sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} 
          />
        </Box>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2].map((i) => (
              <Box 
                key={i} 
                sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  p: 2, 
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: 2
                }}
              >
                <Skeleton variant="rectangular" width={80} height={80} sx={{ borderRadius: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="30%" height={24} />
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* توضیحات سفارش Skeleton */}
      <Card 
        elevation={0}
        sx={{ 
          mt: 3,
          borderRadius: 3,
          border: `1px solid ${colors.borderLight}`,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Skeleton 
            variant="circular" 
            width={20} 
            height={20} 
            sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} 
          />
          <Skeleton 
            variant="text" 
            width={120} 
            height={24} 
            sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} 
          />
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Skeleton variant="text" width="100%" height={24} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="80%" height={24} />
        </CardContent>
      </Card>
    </Container>
  );
}
