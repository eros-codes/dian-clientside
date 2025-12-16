// Centralized color palette for the storefront UI
// هر رنگ با یک توضیح فارسی همراه است تا بدانید کجا استفاده شود.
// هدف: وقتی خواستید یک رنگ را تغییر دهید، فقط این فایل را ویرایش کنید.
export const colors = {
  // برند / رنگ اصلی اپلیکیشن
  // استفاده: دکمه‌های اصلی، لینک‌های مهم، اکشن‌های اولیه در UI
  primary: '#7A1E24', // رنگ دکمه‌های اصلی (رنگ برند اصلی)
  primaryLight: '#84232aff', // نسخهٔ روشن‌تر برای hover/active های نرم
  primaryDark: '#70191fff', // نسخهٔ تیره‌تر برای سایه‌ها یا حالت فشرده

  // رنگ ثانویه / تاکید
  // استفاده: آیکون‌های تاکید، badges ثانویه، المان‌های تزئینی
  teal: '#14B8A6',
  tealLight: '#5EEAD4',
  tealDark: '#0F766E',

  // حالت‌های معنایی (Semantic)
  // استفاده: پیام‌های خطا/هشدار/موفقیت در فرم‌ها و نوتیفیکیشن‌ها
  danger: '#EF4444', // پیام‌ها و نشان‌دهندهٔ خطا
  dangerLight: '#F87171',
  dangerDark: '#DC2626',
  warning: '#F59E0B', // هشدارها
  warningLight: '#FCD34D', // نسخهٔ روشن برای بک‌گراند هشدار
  warningDark: '#D97706', // نسخهٔ تیره برای آیکون‌های هشدار

  // مجموعهٔ خاکستری‌ها — برای بافت‌بندی، border و متن ثانویه
  // استفاده: متن ثانویه، پس‌زمینهٔ کارت‌ها، borderها و placeholderها
  gray50: '#FCF9F4', // پس‌زمینهٔ بسیار روشن (کارت‌ها، الِمان‌های برجسته)
  gray100: '#FCF9F4', // بک‌گراند کارت/لیست
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280', // متن کم‌رنگ/ثانویه
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937', // متن اصلی تیره
  gray900: '#111827', // متن پرکنتراست (فارست)

  // رنگ اختصاصی آیکون دسته‌بندی‌ها برای حفظ خوانایی روی گرادینت‌ها
  categoryIcon: '#FCF9F4',

  // سطوح / کاغذی
  // استفاده: background صفحات، paper و کارت‌ها
  white: '#FCF9F4', // رنگ زمینهٔ سفید-گرم (قالب سایت)
  paper: '#FCF9F4', // رنگ پیش‌فرض برای paper / کارت
  headerFooterBg: '#D8BFA7', // پس‌زمینهٔ هدر و فوتر
  headerFooterBgDark: '#C9AB8E', // نسخهٔ تیره‌تر برای hover state
  pageBackground: '#F5E8D0', // پس‌زمینهٔ کلی صفحه

  // رنگ‌های مخصوص دیالوگ جزییات سریع محصول
  quickViewPaperBg: '#F5E8D0', // پس‌زمینهٔ لایهٔ بیرونی دیالوگ
  quickViewContentBg: '#F5E8D0', // پس‌زمینهٔ محتوای داخلی دیالوگ
  quickViewShadowBase: '#020617', // پایهٔ سایهٔ دیالوگ
  quickViewThumbBorder: '#E1D9CF', // حاشیهٔ پیش‌فرض تصاویر کوچک
  quickViewThumbBorderActive: '#7A1E24', // حاشیهٔ فعال تصاویر کوچک
  quickViewPaperBorder: 'rgba(0, 0, 0, 0.06)', // حاشیهٔ دور دیالوگ
  quickViewModalShadow: '0 24px 60px rgba(2, 6, 23, 0.18)', // سایهٔ اصلی دیالوگ
  quickViewHighlightBg: '#F5E1D8', // پس‌زمینهٔ باکس توضیح افزودنی‌ها
  quickViewHighlightBorder: '#E1C7BA', // حاشیهٔ باکس توضیح افزودنی‌ها
  quickViewHighlightShadow: '0 18px 40px rgba(2, 6, 23, 0.12)', // سایهٔ باکس توضیح افزودنی‌ها
  quickViewOptionBorder: '#E4D7CA', // حاشیهٔ پیش‌فرض کارت افزودنی
  quickViewOptionBorderSelected: '#7A1E24', // حاشیهٔ کارت افزودنی انتخاب‌شده
  quickViewOptionBorderDisabled: '#EDE2D8', // حاشیهٔ کارت افزودنی غیرفعال
  quickViewOptionBackground: '#FCF9F4', // پس‌زمینهٔ کارت افزودنی
  quickViewOptionBackgroundSelected: '#F5E3DE', // پس‌زمینهٔ کارت افزودنی انتخاب‌شده
  quickViewOptionShadowSelected: '0 8px 24px rgba(122, 30, 36, 0.18)', // سایهٔ کارت انتخاب‌شده
  quickViewOptionText: '#1F2937', // رنگ متن اصلی کارت افزودنی
  quickViewOptionTextDisabled: '#6B7280', // رنگ متن کارت افزودنی غیرفعال
  quickViewOptionPrice: '#7A1E24', // رنگ قیمت افزودنی
  quickViewOptionPriceDisabled: '#6B7280', // رنگ قیمت افزودنی غیرفعال
  quickViewOptionDivider: '#E7D9CC', // رنگ خطوط جداکننده در دیالوگ افزودنی
  quickViewOptionSummaryBg: '#F3E6D9', // پس‌زمینهٔ جمع افزودنی‌ها
  quickViewUnavailableText: '#4B5563', // متن وضعیت غیرفعال

  // نوار اعلام شماره میز
  tableBannerBg: '#7A1E24', // پس‌زمینهٔ نوار شماره میز (قابل تغییر)
  tableBannerText: '#FCF9F4', // رنگ متن نوار شماره میز

  // تنظیمات مخصوص فیلدهای ورودی (برای جلوگیری از استفادهٔ هم‌رنگِ پس‌زمینهٔ صفحه)
  inputBg: '#FCF9F4', // پس‌زمینهٔ پیش‌فرض برای inputها (سفید خالص)
  inputText: '#1F2937', // رنگ متن داخل فیلدها
  inputBorder: '#E5E7EB', // رنگ حاشیهٔ فیلدها
  inputPlaceholder: '#6B7280', // رنگ placeholder

  // نشانک‌ها / Badge و رنگ‌های تاکید کوچک
  // استفاده: تگ‌ها، نشانک‌ها، Highlight های کوچک در لیست‌ها
  badgeBlue: '#7A1E24', // رنگ متن/آیکونِ نشانک
  badgeBlueBg: '#FCF9F4', // پس‌زمینهٔ نرم برای badge
  priceRed: '#d32f2f', // قیمت‌های برجسته/تخفیف
  badgeSoftBlue: '#a7bed3', // تن‌های نرم برای کارت/پس‌زمینه تگ - استفاده در Order Card
  badgeSoftBlueDark: '#8cabc4', // تن تیره‌تر برای hover
  discountBadgeAccent: '#7A1E24', // رنگ پایه برای لیبل تخفیف روی دسته‌بندی
  discountBadgeText: '#FCF9F4', // رنگ متن لیبل تخفیف

  // رنگ‌های سفارشات و عملیات
  orderCardBg: '#a7bed3', // پس‌زمینه هدر کارت سفارش (آبی روشن)
  reorderButton: '#7A1E24', // رنگ دکمه سفارش مجدد (برند اصلی)
  reorderButtonHover: '#84232aff', // hover دکمه سفارش مجدد


  
  ctaBg: '#FCF9F4',
  ctaText: '#111827',
  overlayRadialEdgeAlpha: 0.22, // تیره‌کردن خفیف لبه‌های تصویر (افکت رادیال)
  overlayBottomStartAlpha: 0, // شفافیت شروع گرادیان سایهٔ پایین (بالای نوار)
  overlayBottomMidAlpha: 0.70, // شدت در میانهٔ گرادیان سایهٔ پایین (۰ تا ۱)
  overlayBottomEndAlpha: 0.95, // شدت در لبهٔ پایینی (نزدیک دکمه) — حداکثر ۱.۰
  overlayBottomHeightFraction: 0.5, // ارتفاع نوار سایهٔ پایین نسبت به کل تصویر (مثلاً 0.4 = 40%)
  overlayTopStartAlpha: 0.9, // (در صورت استفاده) شفافیت شروع سایهٔ بالا
  overlayTopEndAlpha: 0.0, // (در صورت استفاده) شفافیت انتهای سایهٔ بالا
  overlayTopHeightFraction: 0.2, // (در صورت استفاده) ارتفاع نوار سایهٔ بالا
  glassBase: '#FCF9F4', // رنگ پایه برای افکت شیشه‌ایِ چیپ‌ها/پیل‌ها
  glassHiAlpha: 0.14, // شدت روشن‌تر گرادیان گلس (بالای چیپ)
  glassLoAlpha: 0.10, // شدت تیره‌تر گرادیان گلس (پایین چیپ)
  productTitleColor: '#FCF9F4', // رنگ عنوان محصول روی تصویر
  productPriceColor: '#FCF9F4', // رنگ قیمت فعلی روی تصویر
  productCategoryTextColor: '#FCF9F4', // رنگ متن دسته‌بندی روی تصویر
  
  // رنگ‌های مرجوعی‌ها
  returnCardBg: '#F59E0B', // پس‌زمینه هدر کارت مرجوعی (زرد/نارنجی)

  // رنگ‌های سیستم Comments (نظرات)
  // استفاده: Chat UI، پیام‌های مشتری و پاسخ‌های ادمین
  commentCustomerBg: '#F5E8D0', // پس‌زمینه پیام مشتری (primary با شفافیت)
  commentCustomerBorder: '#F5E8D0', // border پیام مشتری
  commentCustomerText: '#000000', // رنگ متن نام مشتری و آیکون
  commentAdminBg: '#10B98110', // پس‌زمینه پاسخ ادمین (success با شفافیت)
  commentAdminBorder: '#10B98110', // border پاسخ ادمین
  commentAdminText: '#10B981', // رنگ متن نام ادمین و آیکون
  commentScrollbarThumb: '#7A1E24', // رنگ thumb اسکرول‌بار
  commentScrollbarTrack: '#F5E8D0', // رنگ track اسکرول‌بار
  commentMessageText: '#1F2937', // رنگ متن پیام‌ها
  commentFormBg: '#FCF9F4', // پس‌زمینه فرم ثبت نظر
  commentButtonBg: '#7A1E24', // دکمه ارسال نظر
  commentButtonHover: '#84232aff', // hover دکمه ارسال
  commentBadgeReplied: '#10B981', // badge نظرات پاسخ داده شده
  commentBadgePending: '#F59E0B', // badge نظرات در انتظار
  commentControlBg: 'rgba(255, 255, 255, 0.95)', // پس‌زمینه کنترل‌های ناوبری چت
  commentHoverBg: 'rgba(0,0,0,0.04)', // بک‌گراند hover سبک برای دکمه‌ها
  commentCounterBg: 'rgba(255, 255, 255, 0.95)', // پس‌زمینه شمارنده موقعیت کامنت

  // سیاه و سایه‌ها
  // استفاده: تولید سایه‌ها، متن‌های بسیار تیره و overlayها
  black: '#000000', // سیاه کامل برای محاسبهٔ rgba سایه
  shadowDark: '#020617', // سایهٔ خیلی تیره برای افکت‌ها

  // رنگ جهت‌یابی / کنترل سویپر
  // استفاده: دکمه‌های navigation در اسلایدرها و سویپرها
  swiperNavigation: '#FCF9F4',

  // حالت موفقیت
  // استفاده: تیکِ موفقیت، پیام‌های موفقیت‌آمیز
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',

  // رنگ‌های اطلاعاتی و متنی
  info: '#3B82F6', // آبی برای اطلاعات
  textPrimary: '#1F2937', // متن اصلی
  textSecondary: '#6B7280', // متن ثانویه
  borderLight: '#E5E7EB', // border روشن
  badgeSoftGreen: '#D1FAE5', // سبز کم‌رنگ برای badge

  // گرادینت‌های عمومی
  // استفاده: کاور‌ها، پس‌زمینه‌های تزئینی و بنرها
  // تمرکز روی تناژ تیره مرون؛ با فاصلهٔ کنتراست بیشتر، بدون کرم/سفید روشن
  gradientStops: [
    '#3A0C10', '#4A0F13', '#5A1418', '#6B181D', '#70191F', '#7A1E24', '#8C2A30', '#A13A3F',
    '#4B1C23', '#5C2A2E', '#3E1B1F', '#9E2A2F',
  ],
  gradients: {
    // هر preset فقط از تن‌های مرون تیره ساخته شده با کنتراست بیشتر
    purple: 'linear-gradient(135deg, #5E0F12 0%, #A13A3F 100%)', // عمیق → مرون میانی برای تاکید
    pink: 'linear-gradient(135deg, #3A0C10 0%, #7A1E24 100%)', // خیلی تیره → برند
    cyan: 'linear-gradient(135deg, #4B1C23 0%, #8C2A30 100%)', // تون تمشکی تیره → اکسنت مرون
    green: 'linear-gradient(135deg, #3E1B1F 0%, #70191F 100%)', // براون تیره → مرون تیره
    warm: 'linear-gradient(135deg, #5C2A2E 0%, #84232A 100%)', // براون/رازبری تیره → مرون روشن
    soft: 'linear-gradient(135deg, #4A0F13 0%, #7A1E24 100%)', // خیلی عمیق → برند
    blush: 'linear-gradient(135deg, #5A1418 0%, #9E2A2F 100%)', // تیره → مرون مایل به قرمز
    peach: 'linear-gradient(135deg, #3A0C10 0%, #6B181D 100%)', // خیلی تیره → عمیق
  },
};

// لیست مرکزی گرادینت‌های برند برای کارت دسته‌ها و placeholder محصولات
export const brandGradients: string[] = [
  colors.gradients.purple,
  colors.gradients.pink,
  colors.gradients.cyan,
  colors.gradients.warm,
  colors.gradients.blush,
];

// گرادینت‌های صفحه انتخاب نوع منو (کافه / رستوران) - مستقیماً از brandGradients
export const menuSelectionGradients = {
  restaurant: brandGradients[0],
  cafe: brandGradients[2] ?? brandGradients[0],
};

// helper to produce rgba strings from hex (مثلاً برای سایه‌ها یا بک‌گراندهای نیمه‌شفاف)
export function hexToRgba(hex: string, alpha = 1) {
  const cleaned = hex.replace('#', '').trim();
  const full = cleaned.length === 3 ? cleaned.split('').map(c => c + c).join('') : cleaned;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// CSS variable defaults mapped to the palette above.
// Exported so ThemeVarsProvider and other runtime code can consume a single source-of-truth.
export const cssVars: Record<string, string> = {
    // رنگ کنترل‌های navigation در اسلایدر (Swiper)
    '--swiper-navigation-color': colors.swiperNavigation,

    /* هدر (Header) */
    '--header-bg': colors.headerFooterBg, // پس‌زمینهٔ کلی هدر
    '--header-text': colors.gray800, // رنگ متن و آیکون‌های هدر
    '--header-btn-bg': colors.primary, // رنگ پس‌زمینهٔ دکمه‌های مهم در هدر (مثلاً ثبت‌نام)
    '--header-btn-color': colors.white, // رنگ متن داخل دکمه‌های هدر
    '--header-border': hexToRgba(colors.black, 0.06), // رنگ خط جداکنندهٔ هدر
    '--header-hover-bg': hexToRgba(colors.primary, 0.06), // رنگ hover آیتم‌های ناوبری / دکمه‌ها (هالهٔ کم‌رنگ از رنگ برند)
    '--header-active-bg': colors.badgeBlueBg, // پس‌زمینهٔ آیتم فعال ناوبری
    '--header-search-bg': colors.gray100, // پس‌زمینهٔ فیلد جستجو در هدر

    /* فوتر (Footer) */
    '--footer-bg': colors.headerFooterBg, // پس‌زمینهٔ کلی فوتر
    '--footer-text': colors.gray700, // رنگ متن لینک‌ها و نوشته‌ها در فوتر

    /* عمومی صفحه */
    '--page-background': colors.pageBackground, // پس‌زمینهٔ کلی صفحات
    '--foreground': colors.gray900, // رنگ متن اصلی سایت

    /* کارت‌ها / paper */
    '--card': colors.paper, // پس‌زمینهٔ کارت‌ها
    '--card-foreground': colors.gray800, // رنگ متن داخل کارت
    '--card-border': colors.gray200, // رنگ حاشیهٔ کارت‌ها

    /* قیمت‌ها در کارت محصول */
    '--price-primary': colors.priceRed, // قیمت با تخفیف یا تاکید
    '--price-regular': colors.black, // قیمت معمولی (بدون تخفیف)

    /* دسته‌بندی‌ها / چیپ‌ها */
    '--category-bg': '#7A1E24', // پس‌زمینهٔ چیپِ دسته‌بندی (مرون)
    '--category-foreground': '#FCF9F4', // رنگ متن/آیکونِ چیپ (روشن برای کنتراست)

    /* حلقهٔ فوکوس عمومی */
    '--ring': colors.primary, // رنگ پیش‌فرض حلقهٔ فوکوس

    /* فیلدهای فرم / تکست‌فیلدها */
    '--input-bg': colors.inputBg, // پس‌زمینهٔ فیلدهای ورودی (ورودی‌ها باید مستقل باشند)
    '--input-text': colors.inputText, // رنگ متن داخل input
    '--input-placeholder': colors.inputPlaceholder, // رنگ placeholder
    '--input-border': colors.inputBorder, // رنگ border فیلد
    // حلقهٔ فوکوس ورودی‌ها با رنگ برند برای دسترس‌پذیری بهتر
    '--input-focus-ring': colors.primary, // رنگ حلقهٔ فوکوس برای inputها
    '--input-disabled-bg': hexToRgba(colors.gray50, 1), // بک‌گراند وقتی input غیرفعال است

    /* دکمه‌های هدر */
    '--header-btn-hover-bg': colors.primary, // رنگ hover برای دکمه‌های مهم هدر

    /* سبد خرید (Cart Drawer) — سه ناحیه: بالا / میانی / پایین */
    '--cart-header-bg': colors.paper, // پس‌زمینهٔ ناحیهٔ بالایی (عنوان سبد)
    '--cart-body-bg': colors.pageBackground, // پس‌زمینهٔ لیست آیتم‌ها
    '--cart-footer-bg': colors.paper, // پس‌زمینهٔ ناحیهٔ پایین (جمع و دکمه‌ها)
    '--cart-item-bg': colors.paper, // پس‌زمینهٔ آیتم‌های سبد
    '--cart-item-accent': colors.badgeBlueBg, // رنگ تاکید در آیتم سبد (مثلاً badge تخفیف)

    /* بخش تسویه / تایید آدرس / متد پرداخت */
    '--checkout-wrapper-bg': colors.paper, // پس‌زمینهٔ بزرگ‌ترین div در صفحهٔ تسویه
    '--checkout-card-bg': colors.paper, // پس‌زمینهٔ کارت‌های داخلی (آدرس، روش پرداخت)
    '--checkout-section-box-bg': colors.paper, // باکس‌های داخلی داخل کارت تسویه
    '--payment-method-bg': colors.gray50, // پس‌زمینهٔ آیتم‌های روش پرداخت
    '--address-confirm-bg': colors.paper, // پس‌زمینهٔ بخش تایید آدرس نهایی

    /* نشانک‌ها، Badge و اعلان‌های کوچک */
    '--badge-bg': colors.badgeBlueBg,
    '--badge-foreground': colors.badgeBlue,

    /* سایه‌ها و متن‌های دارای افکت */
    '--shadow-1': hexToRgba(colors.black, 0.06),
    '--shadow-2': hexToRgba(colors.black, 0.08),
    '--shadow-3': hexToRgba(colors.black, 0.12),
    '--shadow-4': hexToRgba(colors.black, 0.15),
    '--text-shadow': hexToRgba(colors.black, 0.3),

    /* گرادینتِ مخصوص برخی صفحات/کارت‌ها */
    '--card-verify-gradient': colors.gradients.soft,
};

export default colors;
