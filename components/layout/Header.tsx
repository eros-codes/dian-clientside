//header
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { debounce } from '@/lib/utils';
import colors from '@/client-colors';
import { useCurrentTable } from '@/hooks/useCurrentTable';
// logo moved to public/logo/logo.png — reference via public URL

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';

import {
  Search,
  ShoppingCart,
  Menu as MenuIcon,
  Home,
  Package,
  Receipt,
  MessageSquare,
  Coffee,
  UtensilsCrossed,
} from 'lucide-react';


import { useCartStore } from '@/stores/cartStore';
import { useMenuStore } from '@/stores/menuStore';
import { useSharedCart } from '@/hooks/useSharedCart';

export function Header() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const { totalItems, openCart } = useCartStore();
  const { tableNumber, tableId, sessionId } = useCurrentTable();
  const hasTableSession = !!(sessionId && sessionId.trim().length);
  const { menuType, setMenuType } = useMenuStore();
  
  // Activate shared cart when table session exists
  useSharedCart(hasTableSession && tableId ? tableId : undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);

    checkMobile();
    handleScroll();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMounted]);

  const handleSearch = debounce((value: string) => {
    if (value.trim()) {
      router.push(`/products?search=${encodeURIComponent(value)}`);
    }
  }, 300);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    handleSearch(value);
  };



  const navigationItems = useMemo(() => ([
    { label: t('navigation.home'), href: '/', icon: <Home className="h-4 w-4" />, requiresSession: false },
    { label: t('navigation.products'), href: '/products', icon: <Package className="h-4 w-4" />, requiresSession: false },
    { label: t('navigation.orders'), href: '/orders', icon: <Receipt className="h-4 w-4" />, requiresSession: true },
    { label: 'نظرات', href: '/comments', icon: <MessageSquare className="h-4 w-4" />, requiresSession: false },
  ]), [t]);

  const isActiveRoute = (href: string) => pathname === href;

  const tableBannerText = useMemo(() => {
    if (!tableNumber) return null;
    const trimmed = tableNumber.trim();
    if (!trimmed) return null;
    return /^\d+$/.test(trimmed) ? `میز شماره ${trimmed}` : trimmed;
  }, [tableNumber]);

  const logoSrc = '/logo/logo.PNG';

  if (!isMounted) {
    return (
      <header className="w-full site-header">
        {/* <div className="bg-gradient-to-l from-blue-600 via-blue-500 to-blue-600 text-white py-1 px-4 text-xs md:text-sm flex justify-center items-center">
          <span className="font-medium">ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان</span>
        </div> */}
    <div className="sticky top-0 z-50 w-full transition-all duration-300 site-header" style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)', height: 64 }} />
      </header>
    );
  }

  const headerInnerClasses = `container mx-auto h-16 px-4 md:px-6 ${isMobile ? 'grid grid-cols-3 items-center' : 'flex items-center justify-between'}`;
  const mobileMenuWrapperClasses = isMobile
    ? 'flex items-center justify-self-start'
    : 'flex items-center';
  const logoContainerClasses = isMobile
    ? 'flex items-center justify-center gap-2 justify-self-center'
    : 'flex items-center gap-2';
  const rightActionsClasses = isMobile
    ? 'flex items-center justify-end gap-2 justify-self-end'
    : 'flex items-center gap-2';

  return (
  <header className="w-full site-header">
      {/* Top bar */}
      {tableBannerText && (
        <div
          className="py-1 px-4 text-xs md:text-sm flex justify-center items-center"
          style={{ backgroundColor: colors.tableBannerBg, color: colors.tableBannerText }}
        >
          <span className="font-medium">{tableBannerText}</span>
        </div>
      )}

      {/* Main header */}
  <div className={`sticky top-0 z-50 w-full ${isScrolled ? 'shadow-md' : ''} transition-all duration-300 site-header`} style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}>
        <div className={headerInnerClasses}>

          {/* Mobile menu */}
          {isMobile && (
            <div className={mobileMenuWrapperClasses}>
              <Sheet>
                  <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden mr-2 icon-btn hover:bg-[var(--header-hover-bg)]" style={{ color: 'var(--header-text)' }}>
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="pr-0"
                  style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)', borderLeft: '1px solid var(--header-border)' }}
                >
                  <div className="px-7 flex justify-center">
                    <Link href="/" className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{ backgroundColor: 'var(--header-btn-bg)', width: 48, height: 48 }}
                      >
                        <Image
                          src={logoSrc}
                          alt="DIAN logo"
                          width={36}
                          height={36}
                          style={{ objectFit: 'contain', width: 36, height: 36 }}
                          priority
                        />
                      </div>
                      <span className="font-bold text-lg" style={{ color: 'var(--header-text)', fontFamily: '"Futura", "Futura PT", "Trebuchet MS", sans-serif' }}>DIAN</span>
                    </Link>
                  </div>
                  <Separator className="my-4" />
                  <div className="px-1 py-2">
                    <div className="px-4 mb-4">
                      <Input
                        placeholder={t('common.search')}
                        value={searchValue}
                        onChange={handleSearchChange}
                        className="rounded-full search-input"
                        icon={<Search className="h-4 w-4 text-muted-foreground" />}
                      />
                    </div>
                    <div className="px-4 mb-4">
                      <div className="flex items-center gap-1 rounded-full bg-[var(--header-hover-bg)]/30 px-1 py-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMenuType('CAFE')}
                          className={`flex-1 h-10 rounded-full text-sm transition-colors ${menuType === 'CAFE' ? 'bg-[var(--header-hover-bg)]' : ''}`}
                          style={{ color: 'var(--header-text)' }}
                        >
                          <Coffee className="h-4 w-4 ml-1" />
                          کافه
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMenuType('RESTAURANT')}
                          className={`flex-1 h-10 rounded-full text-sm transition-colors ${menuType === 'RESTAURANT' ? 'bg-[var(--header-hover-bg)]' : ''}`}
                          style={{ color: 'var(--header-text)' }}
                        >
                          <UtensilsCrossed className="h-4 w-4 ml-1" />
                          رستوران
                        </Button>
                      </div>
                    </div>
                    <nav className="flex flex-col space-y-1">
                      {navigationItems.filter(item => !item.requiresSession || hasTableSession).map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors nav-item hover:bg-[var(--header-hover-bg)] ${isActiveRoute(item.href) ? 'active' : ''}`}
                        style={{ color: 'var(--header-text)' }}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Logo + desktop menu */}
          <div className={logoContainerClasses}>
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--header-btn-bg)', width: 56, height: 56 }}
              >
                <Image
                  src={logoSrc}
                  alt="DIAN logo"
                  width={40}
                  height={40}
                  style={{ objectFit: 'contain', width: 40, height: 40 }}
                  priority
                />
              </div>
              <span className="font-bold text-xl hidden md:inline-block" style={{ color: 'var(--header-text)', fontFamily: '"Futura", "Futura PT", "Trebuchet MS", sans-serif' }}>DIAN</span>
            </Link>

            {!isMobile && (
              <NavigationMenu className="hidden md:flex mx-6">
                <NavigationMenuList className="gap-2">
                  {navigationItems.filter(item => !item.requiresSession || hasTableSession).map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <Link 
                        href={item.href} 
                        className={`group inline-flex h-9 w-max items-center justify-center rounded-full px-4 py-2 text-sm transition-colors nav-item hover:bg-[var(--header-hover-bg)] ${isActiveRoute(item.href) ? 'active' : ''}`}
                      >
                        <span className="flex items-center gap-1.5">
                          {item.icon}
                          {item.label}
                        </span>
                      </Link>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 items-center justify-center px-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('common.search')}
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full rounded-full search-input pl-8 pr-4 border-none"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className={rightActionsClasses}>
            {!isMobile && (
              <div className="flex items-center gap-1 rounded-full bg-[var(--header-hover-bg)]/30 px-1 py-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMenuType('CAFE')}
                  className={`h-8 px-2 text-xs sm:text-sm rounded-full transition-colors ${menuType === 'CAFE' ? 'bg-[var(--header-hover-bg)]' : ''}`}
                  style={{ color: 'var(--header-text)' }}
                >
                  <Coffee className="h-3.5 w-3.5 ml-1" />
                  کافه
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMenuType('RESTAURANT')}
                  className={`h-8 px-2 text-xs sm:text-sm rounded-full transition-colors ${menuType === 'RESTAURANT' ? 'bg-[var(--header-hover-bg)]' : ''}`}
                  style={{ color: 'var(--header-text)' }}
                >
                  <UtensilsCrossed className="h-3.5 w-3.5 ml-1" />
                  رستوران
                </Button>
              </div>
            )}
            {hasTableSession && (
              <Button variant="ghost" size="icon" onClick={openCart} className="relative rounded-full icon-btn hover:bg-[var(--header-hover-bg)] transition-transform duration-200 hover:scale-105 active:scale-95" style={{ color: 'var(--header-text)' }}>
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full header-badge text-[10px] font-medium">
                    {totalItems}
                  </span>
                )}
              </Button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
