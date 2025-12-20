'use client';

import React, { useState, useEffect, Suspense } from 'react';

import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  Container,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';

import { useAuthStore } from '@/stores/authStore';
import { usersApi, authApi, setAccessToken } from '@/lib/api';

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const { setUser, setTokens } = useAuthStore();

  // اگر ایمیل نبود به صفحه ثبت‌نام برگرد
  useEffect(() => {
    if (!email) {
      window.location.href = '/auth/register';
    }
  }, [email]);

  const { register, handleSubmit, formState: { errors } } = useForm<{ code: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 6-digit code inputs state
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  // focus the first input on mount so the user can start typing immediately
  useEffect(() => {
    const t = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // helper to join digits
  const joinedCode = codeDigits.join('');

  useEffect(() => {
    // when all digits are filled, auto-submit
    if (joinedCode.length === 6 && joinedCode.match(/^\d{6}$/)) {
      // call verify
      handleVerify(joinedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedCode]);

  const onDigitInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number,
  ) => {
    const target = e.target as HTMLInputElement;
    const v = target.value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...codeDigits];
    next[idx] = v;
    setCodeDigits(next);
    if (v && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1]!.focus();
    }
  };

  const onDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>, idx: number) => {
    if (e.key === 'Backspace' && !codeDigits[idx] && idx > 0) {
      const prev = idx - 1;
      inputsRef.current[prev]?.focus();
      const next = [...codeDigits];
      next[prev] = '';
      setCodeDigits(next);
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLDivElement>) => {
    const paste = e.clipboardData.getData('Text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!paste) return;
    const next = [...codeDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = paste[i] || '';
    }
    setCodeDigits(next);
    // focus at end
    const filled = Math.min(paste.length, 6) - 1;
    if (inputsRef.current[filled + 1]) inputsRef.current[filled + 1]!.focus();
  };

  const handleVerify = async (codeToVerify: string) => {
    setLoading(true);
    setError(null);
    try {
      const pending = sessionStorage.getItem('pendingRegistration');
      const userData = pending ? JSON.parse(pending) : null;
      if (!userData) {
        setError('❌ اطلاعات ثبت‌نام یافت نشد. لطفاً دوباره تلاش کنید.');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email-verification/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: codeToVerify, userData }),
        }
      );

      const result = await res.json();
      if (result.accessToken) {
        // store tokens via auth store (writes localStorage and set API token)
        setTokens(result.accessToken, result.refreshToken);
        // Re-fetch canonical user to ensure extra fields (like iban) are present
        try {
          const userId = result.user?.id;
          if (userId) {
            const fresh = await usersApi.getUser(userId);
            setUser(fresh);
            localStorage.setItem('userData', JSON.stringify(fresh));
          } else if (result.user) {
            setUser(result.user);
            localStorage.setItem('userData', JSON.stringify(result.user));
          }
        } catch (e) {
          if (result.user) {
            setUser(result.user);
            localStorage.setItem('userData', JSON.stringify(result.user));
          }
        }
        sessionStorage.removeItem('pendingRegistration');
        // redirect to home (or to checkout/orders as needed)
        router.push('/');
      } else if (result.success) {
        // Backend created the account but did not return tokens. Try to login automatically
        try {
          const pending = sessionStorage.getItem('pendingRegistration');
          const userData = pending ? JSON.parse(pending) : null;
          if (userData?.email && userData?.password) {
            try {
              const loginRes = await authApi.login({ email: userData.email, password: userData.password });
              const responseData = (loginRes as any).data || loginRes;
              const access = responseData?.accessToken || responseData?.access_token || responseData?.token || responseData?.access;
              const refresh = responseData?.refreshToken || responseData?.refresh_token || null;
              if (access) {
                // got access token, setting tokens
                setTokens(access, refresh || '');
                // setAccessToken is also used internally by the api module, setTokens will call it via auth store
                setAccessToken(access);
                // fetch full user if possible
                try {
                  const userId = responseData.user?.id;
                  if (userId) {
                    const fresh = await usersApi.getUser(userId);
                    setUser(fresh);
                    localStorage.setItem('userData', JSON.stringify(fresh));
                  } else if (responseData.user) {
                    setUser(responseData.user);
                    localStorage.setItem('userData', JSON.stringify(responseData.user));
                  }
                } catch (e) {
                  // ignore
                }
              }
            } catch (e) {
              // auto-login failed
            }
          }
        } catch (e) {
          // ignore parsing errors
        }
        sessionStorage.removeItem('pendingRegistration');
        router.push('/');
      } else {
        setError(result.error || '❌ کد وارد شده معتبر نیست.');
      }
    } catch (err) {
      setError('⚠️ مشکلی در ارتباط با سرور پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  // ⏳ تایمر
  const [timer, setTimer] = useState(60);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: { code: string }) => {
    setLoading(true);
    setError(null);
    try {
      const pending = sessionStorage.getItem('pendingRegistration');
      const userData = pending ? JSON.parse(pending) : null;

      if (!userData) {
        setError('❌ اطلاعات ثبت‌نام یافت نشد. لطفاً دوباره تلاش کنید.');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email-verification/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: data.code, userData }),
        }
      );

      const result = await res.json();
      if (result.success) {
        sessionStorage.removeItem('pendingRegistration');
        router.push('/');
      } else {
        setError(result.error || '❌ کد وارد شده معتبر نیست.');
      }
    } catch {
      setError('⚠️ مشکلی در ارتباط با سرور پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email-verification/resend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const result = await res.json();
      if (!result.success) setError(result.error || '❌ خطا در ارسال دوباره کد.');
      else setTimer(60);
    } catch {
      setError('⚠️ مشکلی در ارسال دوباره کد پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>

        <Box
          sx={{
            maxWidth: 420,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <IconButton
            aria-label="back"
            sx={{ alignSelf: 'flex-start', mb: 2 }}
            onClick={() => window.location.href = '/auth/register'}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Card
            elevation={3}
            sx={{
              width: '100%',
              borderRadius: 3,
              p: { xs: 2, sm: 3 },
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                fontWeight="bold"
                textAlign="center"
                gutterBottom
                sx={{ color: 'primary.main' }}
              >
                تأیید ایمیل
              </Typography>

              <Typography
                variant="body2"
                textAlign="center"
                mb={3}
                color="text.secondary"
              >
                لطفاً کد ۶ رقمی ارسال‌شده به <b>{email}</b> را وارد کنید.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Icon like login/register pages */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <ArrowBackIosNewIcon sx={{ display: 'none' }} />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <Box sx={{ color: 'primary.main', transform: 'translateY(-4px)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" textAlign="center">کد ۶ رقمی را وارد کنید</Typography>
                </Box>

                {/* Custom 6 input boxes */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <TextField
                      key={idx}
                      inputMode="numeric"
                      autoComplete={idx === 0 ? 'one-time-code' : undefined}
                      value={codeDigits[idx] || ''}
                      onChange={(e) => onDigitInput(e, idx)}
                      onKeyDown={(e) => onDigitKeyDown(e, idx)}
                      onPaste={(e) => onPaste(e)}
                      inputRef={(el) => (inputsRef.current[idx] = el)}
                      autoFocus={idx === 0}
                      inputProps={{
                        maxLength: 1,
                        style: { textAlign: 'center', fontSize: '1.25rem', width: 40, height: 48 },
                      }}
                      variant="outlined"
                    />
                  ))}
                </Box>

                {/* No submit button: auto-verify when all digits filled */}
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="text"
                  onClick={resendCode}
                  disabled={loading || timer > 0}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                    color: timer > 0 ? 'text.secondary' : 'primary.main',
                  }}
                >
                  {timer > 0 ? `ارسال دوباره (${timer})` : 'ارسال دوباره کد'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </AppShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<AppShell><LoadingState /></AppShell>}>
      <VerifyInner />
    </Suspense>
  );
}