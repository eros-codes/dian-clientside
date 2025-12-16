"use client";

import React from "react";
import { Box, Container, Skeleton, Card, CardContent } from "@mui/material";

export function OrdersSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton variant="text" width={200} height={36} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent sx={{ p: 2 }}>
              <Skeleton variant="text" width={160} height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width={120} height={18} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 1, mb: 1 }} />
              <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
