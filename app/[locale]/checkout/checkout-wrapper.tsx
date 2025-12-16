'use client';

import dynamic from 'next/dynamic';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { AppShell } from '@/components/layout/AppShell';

// Import صفحه checkout به صورت client-only
const CheckoutPageContent = dynamic(
  () => import('./checkout-content'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppShell>
    ),
  }
);

export default function CheckoutWrapper() {
  return <CheckoutPageContent />;
}
