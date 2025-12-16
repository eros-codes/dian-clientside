'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import colors, { hexToRgba } from '../../client-colors';
import { useTranslations } from 'next-intl';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  const t = useTranslations();

  return (
    <Box
      component="section"
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      
      <span
        aria-hidden="true"
          style={{
          display: 'inline-block',
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `4px solid ${hexToRgba(colors.black, 0.08)}`,
          borderTopColor: colors.primary,
          animation: 'ls-spin 1s linear infinite',
        }}
      />
      <Typography variant="body1" color="text.secondary">
        {message || `${t('common.loading')} لطفاً کمی صبر کنید.`}
      </Typography>

      <style jsx global>{`
        @keyframes ls-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
}