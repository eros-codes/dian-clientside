//appshell
'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { FloatingCartButton } from '../cart/FloatingCartButton';
import { Toaster } from '@/components/ui/toaster';
import { MenuLanding } from '@/components/menu/MenuLanding';
import { useMenuStore } from '@/stores/menuStore';
import { LoadingState } from '@/components/ui/LoadingState';
import { useCartHydration } from '@/hooks/useCartHydration';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Ensure cart hydration and session-expiry watcher runs app-wide
  useCartHydration();
  const { menuType, hasHydrated, setMenuType } = useMenuStore();

  if (!hasHydrated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--page-background)]"
        suppressHydrationWarning
      >
        <LoadingState />
      </div>
    );
  }

  if (!menuType) {
    return <MenuLanding onSelect={setMenuType} />;
  }

  return (
    // Use the centralized page background variable so changing `colors.pageBackground`
    // updates the visible app shell. Tailwind arbitrary value uses the CSS var.
    <div className="flex flex-col min-h-screen direction-rtl overflow-x-hidden bg-[var(--page-background)]" suppressHydrationWarning>
      <Header />
      <main className="flex-1 flex flex-col pt-16 pb-4" suppressHydrationWarning>
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <FloatingCartButton />
      <Toaster />
    </div>
  );
}