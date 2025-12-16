"use client";

import React from 'react';
import { Box, Skeleton } from '@mui/material';

export const ReturnsSkeleton: React.FC = () => {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Skeleton variant="rectangular" height={48} />
      <Skeleton variant="rectangular" height={120} />
      <Skeleton variant="rectangular" height={120} />
    </Box>
  );
};

export default ReturnsSkeleton;
