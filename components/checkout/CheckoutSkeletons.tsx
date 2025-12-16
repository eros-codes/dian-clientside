"use client";

import React from "react";
import { Box, Card, CardContent, Skeleton } from "@mui/material";

export function AddressFormSkeleton() {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {[1,2,3,4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
          <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export function OrderSummarySkeleton() {
  return (
    <Box>
      {[1,2,3].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Skeleton variant="rounded" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </Box>
          <Skeleton variant="text" width={60} />
        </Box>
      ))}
      <Skeleton variant="rectangular" height={1} sx={{ my: 2 }} />
      <Box sx={{ display: 'grid', rowGap: 1 }}>
        <Skeleton variant="text" width={140} />
        <Skeleton variant="text" width={110} />
        <Skeleton variant="text" width={160} />
      </Box>
    </Box>
  );
}

export function PaymentSectionSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={160} height={28} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 1.5 }} />
      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
    </Box>
  );
}
