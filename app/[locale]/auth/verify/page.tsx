'use client';

import React, { useState, useEffect } from 'react';
import colors, { hexToRgba } from '../../../../client-colors';
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
import ClientOnly from '@/components/ui/ClientOnly';
import { useAuthStore } from '@/stores/authStore';
import { usersApi } from '@/lib/api';
import { applyLoginSuccess } from '@/hooks/useApi';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  // اگر ایمیل نبود به صفحه ثبت‌نام برگرد
  useEffect(() => {
    if (!email) {
      window.location.href = '/auth/register';
    }
  }, [email]);

  const { register, handleSubmit, formState: { errors } } = useForm<{ code: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setTokens, setUser } = useAuthStore();

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
      // Accept both plain response and wrapped { success: true, data: {...} }
      const payload = result.data || result;
      if (payload?.accessToken) {
        // store tokens and user in localStorage and update global auth store
        sessionStorage.removeItem('pendingRegistration');
        try {
          // reuse shared login success flow so behavior matches login button
          await applyLoginSuccess(payload, setUser, setTokens);
        } catch (e) {
          // auto-login failed
        }
        // redirect to home
        window.location.href = '/';
      } else if (payload?.success || result.success) {
        sessionStorage.removeItem('pendingRegistration');
        window.location.href = '/';
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
      const payload = result.data || result;
      if (payload?.accessToken) {
        sessionStorage.removeItem('pendingRegistration');
        try {
          await applyLoginSuccess(payload, setUser, setTokens);
        } catch (e) {
          // auto-login failed
        }
        window.location.href = '/';
      } else if (payload?.success || result.success) {
        sessionStorage.removeItem('pendingRegistration');
        window.location.href = '/';
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
    <ClientOnly>
      <AppShell>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Box
          sx={{
            maxWidth: { xs: '95%', sm: 560 },
            mx: 'auto',
            width: '100%',
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
                elevation={6}
                sx={{
                  width: '100%',
                  borderRadius: 4,
                  p: { xs: 1.5, sm: 2.5 },
                  /* Use centralized card color so verify card matches design tokens */
                  backgroundColor: `var(--card, ${colors.paper})`,
                  boxShadow: `0 6px 18px ${hexToRgba(colors.shadowDark, 0.04)}`,
                }}
              >
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
              {/* Icon placed clearly above the text */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ color: 'primary.main', transform: 'translateY(-6px)' }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Box>
                </Box>

              <Typography
                variant="h5"
                fontWeight="bold"
                textAlign="center"
                gutterBottom
                sx={{ color: 'text.primary', mb: 1 }}
              >
                تأیید ایمیل
              </Typography>

              <Typography
                variant="body2"
                textAlign="center"
                mb={2}
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
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" textAlign="center">کد ۶ رقمی را وارد کنید</Typography>
                </Box>

                {/* Custom 6 input boxes with better spacing and LTR direction */}
                <Box
                  dir="ltr"
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1.25,
                    mb: 1.25,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    background: (theme) => theme.palette.mode === 'light' ? 'var(--page-background)' : hexToRgba(colors.black, 0.14),
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
                        dir: 'ltr',
                        style: {
                          textAlign: 'center',
                          fontSize: '1rem',
                          width: 48,
                          height: 48,
                          padding: 0,
                          transition: 'transform 140ms ease, box-shadow 140ms ease',
                        },
                      }}
                      variant="outlined"
                      sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'var(--page-background)',
                              /* very subtle default shadow */
                              boxShadow: `0 2px 6px ${hexToRgba(colors.shadowDark, 0.04)}`,
                              transition: 'transform 160ms ease, box-shadow 160ms ease',
                            },
                            '& .MuiOutlinedInput-root.Mui-focused': {
                              transform: 'translateY(-2px)',
                              /* subtler focused shadow (matches global focus ring) */
                              boxShadow: (theme: any) => `0 6px 18px ${hexToRgba(colors.primary, 0.06)}`,
                            },
                      }}
                    />
                  ))}
                </Box>

                {/* No submit button: auto-verify when all digits filled */}
              </Box>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
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
    </ClientOnly>
  );
}
