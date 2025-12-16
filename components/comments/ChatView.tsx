'use client';

import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Person, AdminPanelSettings, ExpandMore, ExpandLess, KeyboardArrowUp, KeyboardArrowDown, PlayArrow, Pause } from '@mui/icons-material';
import { Comment } from '@/types/comment';
import colors from '../../client-colors';

interface ChatViewProps {
  comments: Comment[];
}

export function ChatView({ comments }: ChatViewProps) {
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animStage, setAnimStage] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [animDirection, setAnimDirection] = useState<'next' | 'prev'>('next');
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const runTransition = useCallback(
    (dir: 'next' | 'prev') => {
      if (animStage !== 'idle' || comments.length === 0) return;
      setAnimDirection(dir);
      setAnimStage('exit');
      setTimeout(() => {
        setCurrentIndex((prev) =>
          dir === 'next'
            ? (prev + 1) % comments.length
            : (prev - 1 + comments.length) % comments.length,
        );
        setAnimStage('enter');
        setTimeout(() => setAnimStage('idle'), 350);
      }, 220);
    },
    [animStage, comments.length],
  );

  const goToNext = useCallback(() => runTransition('next'), [runTransition]);

  const goToPrevious = useCallback(() => runTransition('prev'), [runTransition]);

  // Handle touch/swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous comment
        runTransition('prev');
      } else {
        // Swipe left - next comment
        runTransition('next');
      }
    }
  };

  // Pause/Resume on hover and click
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleClick = () => setIsPaused(prev => !prev);

  const toggleReply = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Auto-scroll: Show one comment at a time every 4 seconds
  useEffect(() => {
    if (comments.length === 0 || isPaused) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      runTransition('next');
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [comments.length, isPaused, runTransition]);

  if (comments.length === 0) {
    return null;
  }

  const comment = comments[currentIndex];

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: 400,
        overflow: 'hidden',
      }}
    >
      {/* Navigation Controls */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: 8,
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'row',
          gap: 0.5,
          bgcolor: colors.commentControlBg,
          borderRadius: 50,
          p: 0.25,
          boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <IconButton
          onClick={goToPrevious}
          size="small"
          sx={{
            bgcolor: colors.primary,
            color: 'white',
            '&:hover': {
              bgcolor: colors.primaryDark,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <KeyboardArrowUp fontSize="small" />
        </IconButton>
        
        <IconButton
          onClick={() => setIsPaused(!isPaused)}
          size="small"
          sx={{
            bgcolor: isPaused ? colors.warning : colors.success,
            color: 'white',
            '&:hover': {
              bgcolor: isPaused ? colors.warningDark : colors.successDark,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          {isPaused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
        </IconButton>
        
        <IconButton
          onClick={goToNext}
          size="small"
          sx={{
            bgcolor: colors.primary,
            color: 'white',
            '&:hover': {
              bgcolor: colors.primaryDark,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <KeyboardArrowDown fontSize="small" />
        </IconButton>
      </Box>

      {/* Comment Counter */}
      <Box
        sx={{
          position: 'absolute',
          left: 16,
          top: 16,
          zIndex: 10,
        }}
      >
        <Chip
          label={`${currentIndex + 1} / ${comments.length}`}
          size="small"
          sx={{
            bgcolor: colors.commentCounterBg,
            backdropFilter: 'blur(10px)',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
      </Box>

      {/* Main Content */}
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          p: 3,
          pb: 6,
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <Box
          key={`${comment.id}-${currentIndex}`}
          sx={{
            animation:
              animStage === 'exit'
                ? (animDirection === 'next' ? 'exitUp 220ms ease-out both' : 'exitDown 220ms ease-out both')
                : animStage === 'enter'
                ? (animDirection === 'next' ? 'enterUp 350ms ease-out both' : 'enterDown 350ms ease-out both')
                : 'none',
            '@keyframes exitUp': {
              '0%': { opacity: 1, transform: 'translateY(0)' },
              '100%': { opacity: 0.9, transform: 'translateY(-56px)' },
            },
            '@keyframes enterUp': {
              '0%': { opacity: 0, transform: 'translateY(56px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            '@keyframes exitDown': {
              '0%': { opacity: 1, transform: 'translateY(0)' },
              '100%': { opacity: 0.9, transform: 'translateY(56px)' },
            },
            '@keyframes enterDown': {
              '0%': { opacity: 0, transform: 'translateY(-56px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {/* Customer Message */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2.5 }}>
            <Box
              sx={{
                ml: 'auto',
                maxWidth: '75%',
                bgcolor: colors.commentCustomerBg,
                borderRadius: '20px 20px 6px 20px',
                p: 2.5,
                border: `2px solid ${colors.commentCustomerBorder}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'rgba(66, 66, 66, 0.08)',
                  }}
                >
                  <Person sx={{ fontSize: 20, color: colors.commentCustomerText }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: colors.commentCustomerText, fontSize: '0.875rem' }}>
                    {comment.name || 'ناشناس'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontSize: '0.75rem' }}>
                    {new Date(comment.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ color: colors.commentMessageText, lineHeight: 1.8, fontSize: '1rem' }}>
                {comment.message}
              </Typography>
            </Box>
          </Box>

          {/* Admin Reply */}
          {comment.adminReply && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Box
                sx={{
                  mr: 'auto',
                  maxWidth: '75%',
                  bgcolor: colors.commentAdminBg,
                  borderRadius: '20px 20px 20px 6px',
                  p: 2.5,
                  border: `2px solid ${colors.commentAdminBorder}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'rgba(76, 175, 80, 0.12)',
                    }}
                  >
                    <AdminPanelSettings sx={{ fontSize: 20, color: colors.commentAdminText }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: colors.commentAdminText, fontSize: '0.875rem' }}>
                      پشتیبانی
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontSize: '0.75rem' }}>
                      پاسخ رسمی
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: colors.commentMessageText,
                    lineHeight: 1.8,
                    fontSize: '1rem',
                  }}
                >
                  {expandedReplies.has(comment.id) || comment.adminReply.length <= 150
                    ? comment.adminReply
                    : truncateText(comment.adminReply)}
                </Typography>
                {comment.adminReply.length > 150 && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReply(comment.id);
                    }}
                    sx={{
                      mt: 1,
                      p: 0.5,
                      color: colors.primary,
                      '&:hover': {
                        bgcolor: colors.commentHoverBg,
                      },
                    }}
                  >
                    {expandedReplies.has(comment.id) ? (
                      <ExpandLess fontSize="small" />
                    ) : (
                      <ExpandMore fontSize="small" />
                    )}
                  </IconButton>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
);
}
