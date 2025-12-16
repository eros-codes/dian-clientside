'use client';

import React, { Suspense } from 'react';
import { Container, Alert, Box } from '@mui/material';
import { AppShell } from '@/components/layout/AppShell';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import FlipAuthCard from '@/components/auth/FlipAuthCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { AuthCardSkeleton } from '@/components/ui/AuthCardSkeleton';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const params = useSearchParams();
  const redirect = params.get('redirect');
  return (
    <AppShell>
      <Suspense fallback={<AuthCardSkeleton />}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, sm: 0 }, minHeight: { xs: '78vh', md: '70vh' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {redirect === '/checkout' && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" variant="outlined">
                بعد از ورود به صفحه تسویه بازگردانده می‌شوید.
              </Alert>
            </Box>
          )}
          <Box sx={{ mx: 'auto', width: '100%', maxWidth: { xs: '100%', sm: 560 } }}>
            <FlipAuthCard 
              front={<LoginForm />} 
              back={<RegisterForm />} 
            />
          </Box>
        </Container>
      </Suspense>
    </AppShell>
  );
}
