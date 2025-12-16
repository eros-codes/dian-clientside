'use client';

import { useState } from 'react';
import { Container, Box, Typography, TextField, Button, IconButton, Skeleton } from '@mui/material';
import { Send } from '@mui/icons-material';
import { AppShell } from '@/components/layout/AppShell';
import { usePublicComments, createComment } from '@/hooks/useComments';
import { ChatView } from '@/components/comments/ChatView';
import colors from '../../../client-colors';

export default function CommentsPage() {
  const { data: comments, isLoading, mutate } = usePublicComments();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      setMessageError('پیام باید حداقل ۵ کاراکتر باشد');
      return;
    }

    setSubmitting(true);
    try {
      await createComment({
        name: name.trim() || undefined,
        message: trimmed,
      });
      alert('نظر شما ارسال شد و پس از بررسی نمایش داده می‌شود');
      setName('');
      setMessage('');
      setMessageError(null);
      mutate();
    } catch (error) {
      setMessageError('خطا در ارسال نظر. لطفاً بعداً دوباره تلاش کنید');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box sx={{ bgcolor: colors.commentFormBg, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {/* Header Skeleton */}
            <Box sx={{ p: 3 }}>
              <Skeleton variant="text" width={200} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.5)' }} />
              <Skeleton variant="text" width={260} height={20} sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.5)' }} />
            </Box>

            {/* Chat Skeleton */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Skeleton variant="rounded" width={280} height={84} sx={{ borderRadius: 3 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Skeleton variant="rounded" width={320} height={72} sx={{ borderRadius: 3 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Skeleton variant="rounded" width={200} height={60} sx={{ borderRadius: 3 }} />
              </Box>
            </Box>

            {/* Form Skeleton */}
            <Box sx={{ p: 3, borderTop: `2px solid ${colors.borderLight}` }}>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="rounded" height={48} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" height={112} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" height={48} sx={{ mt: 2 }} />
            </Box>
          </Box>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            bgcolor: colors.commentFormBg,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${colors.commentButtonBg} 0%, ${colors.commentButtonBg}dd 100%)`,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', mb: 0.5 }}>
               نظرات و پاسخ‌ها
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              مکالمات ما با مشتریان عزیز
            </Typography>
          </Box>

          {/* Comments Display Section with Chat UI */}
          <Box sx={{ p: 3 }}>
            {!comments || comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, minHeight: 400 }}>
                <Typography variant="h6" sx={{ color: colors.textSecondary }}>
                  هنوز نظری ثبت نشده است
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 1 }}>
                  اولین نفری باشید که نظر خود را ثبت می‌کند
                </Typography>
              </Box>
            ) : (
              <ChatView comments={comments} />
            )}
          </Box>

          {/* Submit Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 3,
              borderTop: `2px solid ${colors.borderLight}`,
              bgcolor: 'rgba(0,0,0,0.02)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: colors.textPrimary }}>
              نظر خود را بنویسید
            </Typography>

            <TextField
              fullWidth
              label="نام (اختیاری)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="اگر خالی بگذارید، به عنوان 'ناشناس' ثبت می‌شود"
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="پیام شما"
              value={message}
              onChange={(e) => {
                const val = e.target.value;
                setMessage(val);
                if (val.trim().length >= 5) {
                  setMessageError(null);
                }
              }}
              required
              sx={{ mb: 2 }}
              placeholder="نظر خود را بنویسید..."
              error={!!messageError}
              helperText={messageError || ''}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              endIcon={<Send />}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: colors.commentButtonBg,
                '&:hover': {
                  bgcolor: colors.commentButtonHover,
                },
              }}
            >
              {submitting ? 'در حال ارسال...' : 'ارسال نظر'}
            </Button>
          </Box>
        </Box>
      </Container>
    </AppShell>
  );
}
