"use client";

import React from "react";
import { Box, Container, Skeleton, Chip, Typography } from "@mui/material";

export function HomeCategoriesSkeleton() {
  return (
    <Box sx={{ mb: 8 }}>
      <Skeleton variant="text" width={220} height={40} sx={{ mx: 'auto', mb: 3 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
          gap: 3,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3, mb: 1.5 }} />
            <Skeleton variant="text" width="70%" sx={{ mx: 'auto' }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function HomeFeaturedSkeleton() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={200} height={36} />
        <Chip label={<Skeleton variant="text" width={80} />} />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2, mb: 1 }} />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="50%" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
