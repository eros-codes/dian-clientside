"use client";

import React from 'react';
import { Box } from '@mui/material';

export default function FlipAuthCard({ front, back }: { front: React.ReactNode; back?: React.ReactNode }) {
  return (
    <Box>
      {/* Simple wrapper: render front only for now. Flip behaviour can be added later. */}
      {front}
    </Box>
  );
}
