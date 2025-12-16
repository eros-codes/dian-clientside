"use client";

import React from "react";
import { Box, Skeleton } from "@mui/material";

export function ProductGridSkeleton() {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="text" width={200} height={28} />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
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
