"use client";

import React from 'react';
import { Box, Skeleton } from '@mui/material';

export const AuthCardSkeleton = () => (
  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Skeleton variant="rectangular" height={48} />
    <Skeleton variant="rectangular" height={48} />
    <Skeleton variant="rectangular" height={48} />
  </Box>
);

export default AuthCardSkeleton;
