"use client";

import React from "react";
import { Box, Container, Skeleton } from "@mui/material";

export function ProductDetailSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 8 }, alignItems: 'start' }}>
        {/* Gallery */}
        <Box>
          <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={64} height={64} sx={{ borderRadius: 1.5 }} />
            ))}
          </Box>
        </Box>
        {/* Details */}
        <Box>
          <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={280} height={36} sx={{ mb: 2 }} />
          <Skeleton variant="text" width={200} height={28} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="text" width={140} height={22} />
          <Box sx={{ mt: 3 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 2, mb: 1 }} />
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
