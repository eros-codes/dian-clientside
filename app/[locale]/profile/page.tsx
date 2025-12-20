'use client';

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import { InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Person, Lock } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProfileSkeleton } from '@/components/ui/ProfileSkeleton';
import { FadeTransition } from '@/components/ui/FadeTransition';
import { useAuthStore } from '@/stores/authStore';

import { useChangePassword } from '@/hooks/useApi';
import { changePasswordSchema } from '@/lib/validations';
import { z } from 'zod';
import { usersApi } from '@/lib/api';

export default function ProfilePage() {
  const t = useTranslations();
  const { user, isLoading, setUser } = useAuthStore();
  const changePasswordMutation = useChangePassword();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showIbanForm, setShowIbanForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [valCurrent, setValCurrent] = useState('');
  const [valNew, setValNew] = useState('');

  // ensure same initial render on server and client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug: log user and localStorage whenever user changes to trace IBAN visibility
  useEffect(() => {
    try {
      // debug logging removed
      const ls = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
    } catch (e) {
      // logging failed — ignore
    }
  }, [user]);

  const ibanSchema = z.object({
    iban: z
      .string()
      .min(26, 'شماره شبا باید 26 کاراکتر باشد')
      .max(26, 'شماره شبا باید 26 کاراکتر باشد')
      .regex(/^IR[0-9]{24}$/, 'شماره شبا باید با IR شروع شده و بقیه اعداد باشند'),
  });

  const {
    register: registerIban,
    handleSubmit: handleSubmitIban,
    formState: { errors: ibanErrors },
    reset: resetIban,
  } = useForm({ resolver: zodResolver(ibanSchema) });

  const onSubmitIban = async (data: any) => {
    try {
      // call users update API
      const payload = { iban: data.iban };

      // Use self-update endpoint; backend allows updating own IBAN without admin role
      let updatedUser: any = await usersApi.updateMe(payload);

      // Fallback: some servers may return empty body on PATCH success
      if (!updatedUser || typeof updatedUser !== 'object' || !updatedUser.id) {
        try {
          const fresh = await usersApi.getMe();
          updatedUser = fresh;
        } catch (e) {
          // fallback fetch failed
        }
      }

      // Update local store and localStorage only if we have a valid user shape
      if (updatedUser && typeof updatedUser === 'object' && updatedUser.id) {
        setUser(updatedUser as any);
        try {
          localStorage.setItem('userData', JSON.stringify(updatedUser));
        } catch (e) {
          // ignore localStorage write errors
        }
      } else {
        throw new Error('پاسخ نامعتبر از سرور');
      }
      resetIban();
      setShowIbanForm(false);
    } catch (err) {
      // error saving IBAN
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await changePasswordMutation.mutateAsync(data);
      reset();
      setShowPasswordForm(false);
    } catch (error) {
      // error changing password
    }
  };

  // Show loading state while checking authentication
  if (!isClient || isLoading) {
    return (
      <AppShell>
        <ProfileSkeleton />
      </AppShell>
    );
  }

  // Show error if no user data
  if (!user) {
    return (
      <AppShell>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('profile.title')}
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            خطا در بارگذاری اطلاعات کاربر. لطفاً دوباره وارد شوید.
          </Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FadeTransition>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          {t('profile.title')}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              // make the security column a bit wider so IBAN edit field can show 26 chars
              md: '1.4fr 1fr',
            },
            gap: 4,
          }}
        >
          {/* Personal Information */}
          <Box>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Person sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {t('profile.personalInfo')}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                    },
                    gap: 3,
                  }}
                >
                  <TextField
                    label={t('auth.firstName')}
                    value={user.firstName}
                    fullWidth
                    disabled
                  />
                  <TextField
                    label={t('auth.lastName')}
                    value={user.lastName}
                    fullWidth
                    disabled
                  />
                  <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                    <TextField
                      label={t('auth.email')}
                      value={user.email}
                      fullWidth
                      disabled
                    />
                  </Box>
                  {/* make the displayed IBAN span full width like the email label */}
                  <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, mt: 1 }}>
                    <TextField
                      label="شماره شبای شما"
                      value={user.iban && user.iban.trim() !== '' ? user.iban : 'شماره شبایی ثبت نشده'}
                      fullWidth
                      disabled
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Security Section */}
          <Box>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Lock sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {t('profile.security')}
                  </Typography>
                </Box>

                {!showPasswordForm ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setShowPasswordForm(true);
                      setShowIbanForm(false);
                    }}
                  >
                    {t('auth.changePassword')}
                  </Button>
                ) : (
                  <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <TextField
                      label={t('auth.currentPassword')}
                      type={showCurrent ? 'text' : 'password'}
                      fullWidth
                      margin="normal"
                      {...register('currentPassword')}
                      onChange={(e) => {
                        // maintain react-hook-form registration while mirroring value for adornment visibility
                        setValCurrent(e.target.value);
                      }}
                      error={!!errors.currentPassword}
                      helperText={errors.currentPassword?.message}
                      InputProps={{
                        endAdornment: valCurrent ? (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showCurrent ? 'پنهان کردن رمز' : 'نمایش رمز'}
                              onClick={() => setShowCurrent((v) => !v)}
                              edge="end"
                              size="small"
                            >
                              {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ) : undefined,
                      }}
                    />
                    <TextField
                      label={t('auth.newPassword')}
                      type={showNew ? 'text' : 'password'}
                      fullWidth
                      margin="normal"
                      {...register('newPassword')}
                      onChange={(e) => {
                        setValNew(e.target.value);
                      }}
                      error={!!errors.newPassword}
                      helperText={errors.newPassword?.message}
                      InputProps={{
                        endAdornment: valNew ? (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showNew ? 'پنهان کردن رمز' : 'نمایش رمز'}
                              onClick={() => setShowNew((v) => !v)}
                              edge="end"
                              size="small"
                            >
                              {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ) : undefined,
                      }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={changePasswordMutation.isPending}
                        fullWidth
                      >
                        {changePasswordMutation.isPending ? 'در حال تغییر...' : t('common.save')}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setShowIbanForm(false);
                          reset();
                        }}
                        fullWidth
                      >
                        {t('common.cancel')}
                      </Button>
                    </Box>
                  </Box>
                )}
                <Box sx={{ mt: 2 }}>
                  {!showIbanForm ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setShowIbanForm(true);
                        setShowPasswordForm(false);
                      }}
                    >
                      اطلاعات بانکی
                    </Button>
                  ) : (
                    <Box component="form" onSubmit={handleSubmitIban(onSubmitIban)}>
                      <TextField
                        label="شماره شبا"
                        fullWidth
                        margin="normal"
                        defaultValue={user.iban ?? ''}
                        {...registerIban('iban')}
                        error={!!ibanErrors.iban}
                        helperText={ibanErrors.iban?.message}
                        inputProps={{
                          // monospace and slight letter spacing helps show all 26 chars
                          style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace', letterSpacing: '0.6px' },
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button type="submit" variant="contained" fullWidth>
                          ثبت
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setShowIbanForm(false);
                            setShowPasswordForm(false);
                            resetIban();
                          }}
                          fullWidth
                        >
                          {t('common.cancel')}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
      </FadeTransition>
      {/* debug panel removed */}
    </AppShell>
  );
}