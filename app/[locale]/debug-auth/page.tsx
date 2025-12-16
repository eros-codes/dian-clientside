'use client';

import { useAuthStore } from '@/stores/authStore';
import { Container, Card, CardContent, Typography, Box, Button } from '@mui/material';
import { AppShell } from '@/components/layout/AppShell';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
              🔍 Debug Authentication
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                وضعیت Authentication:
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {isAuthenticated ? '✅ لاگین هستید' : '❌ لاگین نیستید'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                اطلاعات User:
              </Typography>
              <Typography variant="body1" component="pre" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto' }}>
                {JSON.stringify(user, null, 2)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Role شما:
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {user?.role || 'هیچ'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                آیا ADMIN هستید؟
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {user?.role === 'ADMIN' ? '✅ بله' : '❌ خیر'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
              >
                Logout و Login مجدد
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => router.push('/admin/comments')}
              >
                تست Admin Comments
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                💡 راه حل:
              </Typography>
              <Typography variant="body2">
                1. اگر Role شما ADMIN نیست، باید در دیتابیس تغییرش دهید<br/>
                2. بعد از تغییر Role حتماً Logout و Login مجدد کنید<br/>
                3. Token قدیمی Role قدیمی را دارد و باید Refresh شود
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </AppShell>
  );
}
