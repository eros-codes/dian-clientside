// ✅ نسخهٔ کامل و نهایی — ConceptProductCard.tsx
// تغییرات اصلی:
// - عنوان و دسته‌بندی در جریان طبیعی (flow) قرار گرفتند و همیشه راست (items-end) می‌مانند
// - price pill دیگر absolute نیست و در سمت چپِ ردیفِ عنوان قرار می‌گیرد
// - CTA همان پایینِ کارت باقی می‌ماند (بدون تغییر مکان)
// - انیمیشن cart-bounce و badge تخفیف حفظ شده‌اند
// - لینک به صفحه جزئیات محصول اضافه شد

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import colors, { hexToRgba, brandGradients } from '../../client-colors';
import ShoppingCart from '@mui/icons-material/ShoppingCart';

type ConceptProductCardProps = {
  title: string;
  price: number | string;
  category: string;
  imageUrl?: string;
  productId: string;
  onAddToCart?: () => void;
  onViewDetail?: () => void;
  ctaLabel?: string;
  originalPrice?: number;
  productDiscountPercent?: number;
  categoryDiscountPercent?: number;
  showAddButton?: boolean;
  addButtonDisabled?: boolean;
  isAvailable?: boolean;
};

function formatPrice(value: number | string): string {
  if (typeof value === 'number') {
    try {
      return new Intl.NumberFormat('fa-IR').format(value);
    } catch {
      return String(value);
    }
  }
  return value;
}

function getProductColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return brandGradients[Math.abs(hash) % brandGradients.length];
}

const ConceptProductCard: React.FC<ConceptProductCardProps> = ({
  title,
  price,
  category,
  imageUrl,
  productId,
  onAddToCart,
  onViewDetail,
  ctaLabel = 'افزودن به سبد خرید',
  originalPrice,
  productDiscountPercent,
  categoryDiscountPercent,
  showAddButton = true,
  addButtonDisabled = false,
  isAvailable = true,
}) => {
  const [cartAnim, setCartAnim] = useState(false);
  const hasDiscount = Number(productDiscountPercent ?? 0) > 0 || Number(categoryDiscountPercent ?? 0) > 0;
  const pricePillHeightRegular = 'clamp(24px, 4.8vw, 30px)';
  const pricePillHeightDiscount = 'clamp(28px, 5.6vw, 36px)';
  const cartButtonSize = 'clamp(24px, 4.9vw, 30px)';
  const allowCartAction = showAddButton && !!onAddToCart && !addButtonDisabled && isAvailable;

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault(); // جلوگیری از رفتن به صفحه محصول
    e.stopPropagation();
    if (!allowCartAction) return;
    try { onAddToCart && onAddToCart(); } finally {
      setCartAnim(true);
      setTimeout(() => setCartAnim(false), 320);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onViewDetail) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.blur();
    onViewDetail();
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (!onViewDetail) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (e.currentTarget as HTMLAnchorElement).blur();
      onViewDetail();
    }
  };

  return (
    <Link
      href={`/products/${productId}`}
      className="group relative w-full overflow-hidden rounded-[24px] sm:rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-transform duration-200 will-change-transform hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)] transform-gpu hover:-translate-y-1.5 hover:scale-[1.01] block"
      style={{ aspectRatio: '4 / 5' }}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* IMAGE + OVERLAYS */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 transition-transform duration-300 will-change-transform group-hover:scale-[1.04]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority={false}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-[50%_35%] sm:object-center"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: getProductColor(productId) }}
            >
              <div
                className="flex items-center justify-center rounded-full border"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: hexToRgba(colors.white, 0.18),
                  borderColor: hexToRgba(colors.white, 0.28),
                }}
              >
                <span
                  className="font-bold"
                  style={{
                    color: colors.white,
                    fontSize: 'clamp(28px, 5vw, 36px)',
                    lineHeight: 1,
                  }}
                >
                  {title?.charAt(0)?.toUpperCase() ?? ''}
                </span>
              </div>
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(120% 60% at 50% 50%, ${hexToRgba(colors.black, 0)} 60%, ${hexToRgba(colors.black, (colors as any).overlayRadialEdgeAlpha ?? 0.22)} 100%)`,
              zIndex: 0,
            }}
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 sm:hidden"
            style={{
              background: `linear-gradient(180deg, ${hexToRgba(colors.black, (colors as any).overlayBottomStartAlpha ?? 0)} 0%, ${hexToRgba(colors.black, (colors as any).overlayBottomMidAlpha ?? 0.45)} 60%, ${hexToRgba(colors.black, (colors as any).overlayBottomEndAlpha ?? 0.88)} 100%)`,
              zIndex: 1,
            }}
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden sm:block"
            style={{
              height: `${((colors as any).overlayBottomHeightFraction ?? 0.333) * 100}%`,
              background: `linear-gradient(180deg, ${hexToRgba(colors.black, (colors as any).overlayBottomStartAlpha ?? 0)} 0%, ${hexToRgba(colors.black, (colors as any).overlayBottomMidAlpha ?? 0.45)} 60%, ${hexToRgba(colors.black, (colors as any).overlayBottomEndAlpha ?? 0.88)} 100%)`,
              zIndex: 1,
            }}
          />
        </div>
      </div>

      {/* DISCOUNT BADGE */}
      {Number(productDiscountPercent ?? 0) > 0 && (
        <div className="absolute top-3 left-3 z-10 select-none">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border"
            style={{
              color: colors.white,
              background: `linear-gradient(180deg, ${hexToRgba(colors.danger, 0.28)} 0%, ${hexToRgba(colors.dangerDark, 0.28)} 100%)`,
              backdropFilter: 'blur(8px)',
              borderColor: hexToRgba(colors.danger, 0.5),
              boxShadow: `0 2px 10px ${hexToRgba(colors.black, 0.25)}`,
            }}
          >
            -{Number(productDiscountPercent).toFixed(0)}%
          </span>
        </div>
      )}

      {/* CONTENT + PRICE/ACTION ROW */}
      <div className="absolute inset-x-4 bottom-2 sm:bottom-3 flex flex-col gap-1 sm:gap-2 z-20">

        {/* Title pinned to the right above price/action row */}
        <div className="pointer-events-none select-none w-full">
          <div
            className="text-right font-extrabold drop-shadow"
            style={{
              color: (colors as any).productTitleColor ?? colors.white,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden' as any,
              fontSize: 'clamp(17px, 3.2vw, 22px)',
              marginTop: 'clamp(12px, 2.3vw, 26px)',
              marginBottom: 'clamp(-4px, -0.7vw, 0px)',
              lineHeight: 'clamp(18px, 3.1vw, 24px)'
            }}
          >
            {title}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="pointer-events-none inline-flex flex-col rounded-full border whitespace-nowrap"
            style={{
              color: !isAvailable
                ? colors.white
                : hasDiscount
                  ? colors.white
                  : ((colors as any).productPriceColor ?? colors.white),
              background: !isAvailable
                ? hexToRgba(colors.black, 0.45)
                : hasDiscount
                    ? `linear-gradient(180deg, ${hexToRgba(colors.danger, 0.28)} 0%, ${hexToRgba(colors.dangerDark, 0.28)} 100%)`
                    : `linear-gradient(180deg, ${hexToRgba((colors as any).glassBase ?? colors.white, (colors as any).glassHiAlpha ?? 0.14)} 0%, ${hexToRgba((colors as any).glassBase ?? colors.white, (colors as any).glassLoAlpha ?? 0.10)} 100%)`,
              backdropFilter: 'blur(10px)',
              boxShadow: hasDiscount
                ? `0 2px 10px ${hexToRgba(colors.danger, 0.25)}`
                : `0 1px 4px ${hexToRgba(colors.white, 0.06)}, 0 2px 8px ${hexToRgba(colors.black, 0.06)}`,
              borderColor: hasDiscount || !isAvailable ? hexToRgba(colors.danger, 0.5) : hexToRgba(colors.white, 0.16),
              padding: hasDiscount || !isAvailable
                ? 'clamp(3px, 0.8vw, 7px) clamp(9px, 1.4vw, 13px)'
                : 'clamp(2px, 0.6vw, 5px) clamp(8px, 1.2vw, 12px)',
              borderRadius: hasDiscount || !isAvailable ? '18px' : '9999px',
              direction: 'rtl',
              fontSize: 'clamp(13px, 2.2vw, 15px)',
              minHeight: hasDiscount ? pricePillHeightDiscount : pricePillHeightRegular,
              alignItems: hasDiscount ? 'flex-end' : 'center',
              justifyContent: hasDiscount ? 'flex-end' : 'center',
              rowGap: hasDiscount ? '2px' : '0px',
              textAlign: hasDiscount ? 'right' : 'center',
              marginRight: '-0.25rem',
              marginLeft: 'auto'
            }}
          >
            {isAvailable && hasDiscount && (
              <span
                className="text-[9px] sm:text-[10px] font-semibold line-through whitespace-nowrap"
                style={{
                  color: hexToRgba(colors.white, 0.78),
                  fontSize: 'clamp(7.5px, 1.2vw, 10px)',
                  lineHeight: 1,
                  transform: 'translateY(1px)'
                }}
              >
                {formatPrice(typeof originalPrice === 'number' ? originalPrice : (typeof price === 'number' && hasDiscount) ? Math.round(Number(price) / (1 - (Number(productDiscountPercent ?? 0) || Number(categoryDiscountPercent ?? 0)) / 100)) : Number(price))}
              </span>
            )}

            <span className="text-[10px] sm:text-[13px] font-bold whitespace-nowrap" style={{ fontSize: 'clamp(13px, 2.3vw, 15px)', lineHeight: 1 }}>
              {isAvailable ? formatPrice(typeof price === 'number' ? price : Number(price)) : 'ناموجود'}
            </span>
          </span>

          {showAddButton && (
            <button
              type="button"
              onClick={handleCartClick}
              className="pointer-events-auto inline-flex items-center justify-center rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.16)] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:brightness-95 active:brightness-90 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              style={{
                outlineColor: colors.reorderButton,
                backgroundColor: (colors as any).ctaBg ?? colors.white,
                color: (colors as any).ctaText ?? colors.black,
                width: cartButtonSize,
                height: cartButtonSize,
                minWidth: cartButtonSize,
                minHeight: cartButtonSize,
                marginLeft: '-0.25rem',
                marginRight: 'auto'
              }}
              disabled={!allowCartAction}
            >
              <ShoppingCart
                fontSize="small"
                style={{
                  color: (colors as any).ctaText ?? colors.black,
                  animation: cartAnim ? 'cart-bounce 320ms ease-in-out' : 'none',
                  fontSize: 'clamp(13px, 2.1vw, 17px)'
                }}
              />
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes cart-bounce {
          0% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-3px) scale(1.06); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </Link>
  );
};

export default ConceptProductCard;
