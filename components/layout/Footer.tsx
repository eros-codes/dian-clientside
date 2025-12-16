'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { FaInstagram, FaTelegram, FaMapMarkerAlt, FaPhone, FaTruck, FaRegEnvelope, FaClock } from 'react-icons/fa';
import { footerSettingsApi } from '@/lib/api-real';

type FooterSetting = { id: number; key: string; title: string; url?: string | null };

export function Footer() {
  const [settings, setSettings] = useState<FooterSetting[]>([]);
  const hiddenKeys = new Set(['fee', 'swarm', 'tax', 'bulk_discount']);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await footerSettingsApi.getFooterSettings();
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : [];
        setSettings(arr);
      } catch (e) {
        setSettings([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const renderIcon = (k: string) => {
    switch (k) {
      case 'instagram': return <FaInstagram size={16} color="var(--mui-palette-text-secondary)" />;
      case 'telegram': return <FaTelegram size={16} color="var(--mui-palette-text-secondary)" />;
      case 'address': return <FaMapMarkerAlt size={16} color="var(--mui-palette-text-secondary)" />;
      case 'phone': return <FaPhone size={16} color="var(--mui-palette-text-secondary)" />;
      case 'open_time': return <FaClock size={16} color="var(--mui-palette-text-secondary)" />;
      case 'fee': return <FaTruck size={16} color="var(--mui-palette-text-secondary)" />;
      default: return <FaRegEnvelope size={16} color="var(--mui-palette-text-secondary)" />;
    }
  };

  const makeTelHref = (input?: string | null) => {
    if (!input) return '';
    let n = String(input).trim();
    if (n.startsWith('tel:')) return n;
    // keep leading + and digits only
    n = n.replace(/[^+\d]/g, '');
    return `tel:${n}`;
  };
  return (
    <Box
      component="footer"
      className="site-footer"
      sx={{
        backgroundColor: (theme) => `var(--footer-bg, ${theme.palette.background.paper})`,
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr',
              md: '1fr',
            },
            gap: 4,
          }}
        >
          {/* Contact Info */}
          <Box>
            {/**
             * <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
             *   تماس با ما
             * </Typography>
             */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {settings
                .filter((s) => !hiddenKeys.has(s.key))
                .map((s) => {
                  const isPhone = s.key === 'phone';
                  const phoneHref = isPhone ? makeTelHref(s.url || s.title) : '';
                  const isLink = isPhone ? Boolean(phoneHref) : Boolean(s.url);
                  return (
                    <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIcon(s.key)}
                      {isLink ? (
                        <Link
                          href={isPhone ? phoneHref : (s.url as string)}
                          {...(isPhone ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                          color="text.secondary"
                          underline="hover"
                          sx={{ fontSize: '0.875rem', direction: 'ltr', textAlign: 'right' }}
                          aria-label={isPhone ? `تماس با ${s.title}` : undefined}
                        >
                          {s.title}
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ direction: 'ltr', textAlign: 'right' }}>
                          {s.title}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 2 }}
        >
          {`Made with love 🤍 Eros & Nord`}
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}>
        </Box>
      </Container>
    </Box>
  );
}