import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { toPersianDigits } from '@/lib/utils';

interface OrderCountBadgeProps {
  productId: string;
}

export function OrderCountBadge({ productId }: OrderCountBadgeProps) {
  const [orderCount, setOrderCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [countChange, setCountChange] = useState<'up' | 'down' | null>(null);

  // Simulate order count changes (for demo)
  useEffect(() => {
    // This would normally fetch from API
    // For now, let's simulate with some random changes
    const interval = setInterval(() => {
      setOrderCount(prev => {
        const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const newCount = Math.max(0, prev + change);
        
        if (newCount !== prev) {
          setCountChange(newCount > prev ? 'up' : 'down');
          setTimeout(() => setCountChange(null), 600);
        }
        
        return newCount;
      });
    }, 5000); // Change every 5 seconds for demo

    return () => clearInterval(interval);
  }, []);

  if (orderCount === 0) {
    return null; // Don't show anything if count is 0
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: -8,
        right: -12,
        backgroundColor: '#ef4444', // red-500
        color: 'white',
        borderRadius: '50%',
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        animation: countChange === 'up' ? 'rotateUp 600ms ease-in-out' : 
                   countChange === 'down' ? 'rotateDown 600ms ease-in-out' : 'none',
        '@keyframes rotateUp': {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' }
        },
        '@keyframes rotateDown': {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(-90deg)' },
          '100%': { transform: 'rotateY(0deg)' }
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      }}
    >
      {toPersianDigits(orderCount.toString())}
    </Box>
  );
}
