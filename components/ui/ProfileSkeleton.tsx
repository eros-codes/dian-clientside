"use client";

import React from 'react';
import { Box, Skeleton } from '@mui/material';

export const ProfileSkeleton: React.FC = () => {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Skeleton variant="rectangular" height={40} />
      <Skeleton variant="rectangular" height={200} />
    </Box>
  );
};

export default ProfileSkeleton;
