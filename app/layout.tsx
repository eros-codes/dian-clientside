// client-side/app/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AppProviders } from '@/providers/AppProviders';
import './globals.css';
import colors, { hexToRgba, cssVars } from '../client-colors';
import { Metadata } from 'next';

import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';

export const metadata: Metadata = {
  title: 'Dian Cafe',
  icons: {
    icon: '/logo/logo.PNG',
  },
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: any | Promise<any>;
}) {
  const resolvedParams = typeof params === 'object' && typeof (params as any).then === 'function' ? await params : params;
  const locale = resolvedParams?.locale as string | undefined;
  const messages = await getMessages();

  return (
    <html lang="fa" dir="rtl" className="font-vazirmatn" suppressHydrationWarning>
  <body style={{ backgroundColor: 'var(--page-background)', color: 'var(--foreground)' }} suppressHydrationWarning>
        {/* set a few CSS variables derived from the centralized palette (CSS fallback for non-JS) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{
  --swiper-navigation-color: ${colors.swiperNavigation};
  --header-bg: ${colors.headerFooterBg};
  --header-text: ${colors.gray800};
  --header-btn-bg: ${colors.primary};
  --header-btn-color: ${colors.white};
  --header-height: 64px;
  --footer-bg: ${colors.headerFooterBg};
  --footer-text: ${colors.gray700};
  --header-active-bg: ${colors.badgeBlueBg};
  --header-hover-bg: ${hexToRgba(colors.primary, 0.06)};
  --avatar-bg: ${colors.badgeBlueBg};
  --avatar-text: ${colors.badgeBlue};
  --header-border: ${hexToRgba(colors.black, 0.06)};
  --header-search-bg: ${colors.gray100};
  --page-background: ${colors.pageBackground};
  --foreground: ${colors.gray900};
  --shadow-1: ${hexToRgba(colors.black, 0.06)};
  --shadow-2: ${hexToRgba(colors.black, 0.08)};
  --shadow-3: ${hexToRgba(colors.black, 0.12)};
  --shadow-4: ${hexToRgba(colors.black, 0.15)};
  --text-shadow: ${hexToRgba(colors.black, 0.3)};
  /* input tokens */
  --input-bg: ${colors.inputBg};
  --input-text: ${colors.inputText};
  --input-border: ${colors.inputBorder};
  --input-placeholder: ${colors.inputPlaceholder};
  /* server-side: disable focus ring so initial render shows no ring */
  --input-focus-ring: transparent;
  /* card and verify gradient */
  --card: ${colors.paper};
  --card-verify-gradient: ${colors.gradients.soft};
  /* badge */
  --badge-bg: ${colors.badgeBlueBg};
  --badge-foreground: ${colors.badgeBlue};
}
`,
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <AppProviders>
            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return [{ locale: 'fa' }];
}
