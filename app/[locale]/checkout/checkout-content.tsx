 'use client';

import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { AppShell } from '@/components/layout/AppShell';

export default function CheckoutPageContent() {
  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6">صفحه پرداخت (موقت) — محتوای اصلی اینجا قرار می‌گیرد.</Typography>
        </Box>
      </Container>
    </AppShell>
  );
}
