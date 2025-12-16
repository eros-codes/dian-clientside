'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  Reply,
  Preview,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/stores/authStore';
import { useAdminComments, replyToComment, updateReply } from '@/hooks/useComments';
import { Comment } from '@/types/comment';
import colors from '../../../../client-colors';

export default function AdminCommentsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: comments, isLoading, mutate } = useAdminComments();
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check authentication and admin role
  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <AppShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Card elevation={0} sx={{ border: `1px solid ${colors.borderLight}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: colors.danger, mb: 2, fontWeight: 700 }}>
                🔒 دسترسی غیرمجاز
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                شما به این بخش دسترسی ندارید. لطفاً با اکانت ادمین وارد شوید.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </AppShell>
    );
  }

  const handleOpenReply = (comment: Comment) => {
    setSelectedComment(comment);
    setReplyText(comment.adminReply || '');
    setPreviewMode(false);
  };

  const handleCloseDialog = () => {
    setSelectedComment(null);
    setReplyText('');
    setPreviewMode(false);
  };

  const handleSubmitReply = async () => {
    if (!selectedComment || !replyText.trim()) return;

    setSubmitting(true);
    try {
      if (selectedComment.isReplied) {
        await updateReply(selectedComment.id, { adminReply: replyText.trim() });
      } else {
        await replyToComment(selectedComment.id, { adminReply: replyText.trim() });
      }
      alert('پاسخ با موفقیت ثبت شد');
      mutate();
      handleCloseDialog();
    } catch (error) {
      alert('خطا در ثبت پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography>در حال بارگذاری...</Typography>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: colors.gray900 }}>
            مدیریت نظرات
          </Typography>
          <Typography variant="body1" sx={{ color: colors.textSecondary }}>
            مشاهده و پاسخ به نظرات مشتریان
          </Typography>
        </Box>

        {!comments || comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: colors.textSecondary }}>
              هیچ نظری ثبت نشده است
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {comments.map((comment: Comment) => (
              <Card
                key={comment.id}
                elevation={0}
                sx={{
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: 3,
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: colors.primary }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {comment.name || 'ناشناس'}
                      </Typography>
                    </Box>
                    <Chip
                      label={comment.isReplied ? 'پاسخ داده شده' : 'در انتظار پاسخ'}
                      size="small"
                      icon={comment.isReplied ? <CheckCircle /> : <Pending />}
                      color={comment.isReplied ? 'success' : 'warning'}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                      پیام مشتری:
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                      {comment.message}
                    </Typography>
                  </Box>

                  {comment.adminReply && (
                    <Box
                      sx={{
                        bgcolor: colors.commentAdminBg,
                        p: 2,
                        borderRadius: 2,
                        mb: 2,
                        border: `1px solid ${colors.commentAdminBorder}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AdminPanelSettings sx={{ color: colors.commentAdminText, fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: colors.commentAdminText }}>
                          پاسخ شما:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                        {comment.adminReply}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={comment.isReplied ? 'outlined' : 'contained'}
                      size="small"
                      startIcon={<Reply />}
                      onClick={() => handleOpenReply(comment)}
                      sx={{
                        bgcolor: comment.isReplied ? 'transparent' : colors.commentButtonBg,
                        color: comment.isReplied ? colors.commentButtonBg : 'white',
                        '&:hover': {
                          bgcolor: comment.isReplied ? `${colors.commentButtonBg}10` : colors.commentButtonHover,
                        },
                      }}
                    >
                      {comment.isReplied ? 'ویرایش پاسخ' : 'پاسخ دادن'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Reply Dialog */}
        <Dialog
          open={Boolean(selectedComment)}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedComment?.isReplied ? 'ویرایش پاسخ' : 'پاسخ به نظر'}
          </DialogTitle>
          <DialogContent>
            {selectedComment && (
              <>
                <Box sx={{ mb: 3, p: 2, bgcolor: colors.commentCustomerBg, borderRadius: 2, border: `1px solid ${colors.commentCustomerBorder}` }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                    پیام مشتری:
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                    {selectedComment.message}
                  </Typography>
                </Box>

                {previewMode ? (
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: colors.commentAdminBg,
                      borderRadius: 2,
                      border: `1px solid ${colors.commentAdminBorder}`,
                      minHeight: 150,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AdminPanelSettings sx={{ color: colors.commentAdminText, fontSize: 18 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: colors.commentAdminText }}>
                        پیش‌نمایش پاسخ:
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: colors.textPrimary, lineHeight: 1.6 }}>
                      {replyText || 'پاسخی وارد نشده است'}
                    </Typography>
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="پاسخ شما"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                  />
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseDialog}>انصراف</Button>
            <Button
              startIcon={<Preview />}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'ویرایش' : 'پیش‌نمایش'}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitReply}
              disabled={submitting || !replyText.trim()}
              sx={{ bgcolor: colors.commentButtonBg, '&:hover': { bgcolor: colors.commentButtonHover } }}
            >
              {submitting ? 'در حال ثبت...' : 'ثبت پاسخ'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppShell>
  );
}
