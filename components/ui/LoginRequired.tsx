"use client";

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export const LoginRequired: React.FC<{ children?: React.ReactNode; title?: string; message?: string }> = ({ children, title, message }) => {
  // Simple wrapper: if you want to enforce auth, replace with real logic.
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        برای مشاهده این محتوا باید وارد شوید
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Link href="/auth/login"><Button variant="contained">ورود</Button></Link>
        <Link href="/auth/register"><Button variant="outlined">ثبت نام</Button></Link>
      </Box>
      {children}
    </Box>
  );
};

export default LoginRequired;
