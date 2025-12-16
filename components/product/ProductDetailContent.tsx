"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  CardMedia,
  Stack,
  IconButton,
} from "@mui/material";
import { ShoppingCart, CheckCircleOutline, Close } from "@mui/icons-material";
import { keyframes } from "@mui/system";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Image from "next/image";

import colors, { hexToRgba } from "../../client-colors";
import { useTranslations } from "next-intl";
import { Price } from "@/components/ui/Price";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ProductDetailSkeleton } from "@/components/ui/ProductDetailSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useProduct } from "@/hooks/useApi";
import { useCartStore } from "@/stores/cartStore";
import type { SelectedOption } from "@/types";
import { ProductOptionsModal } from "@/components/product/ProductOptionsModal";
import { useCurrentTable } from "@/hooks/useCurrentTable";

export interface ProductDetailContentProps {
  productId: string;
  variant?: "page" | "modal";
  /** Optional callback used by parent dialog to render a close button */
  onRequestClose?: () => void;
  /** Forces modal layout to behave like xs (mobile) even on wider breakpoints */
  forceMobileLayout?: boolean;
}

type MaybeImage = string | { url?: string } | null | undefined;

function resolveImageUrl(img: MaybeImage): string | undefined {
  if (!img) return undefined;
  const val = typeof img === "string" ? img : (img as any)?.url;
  if (!val || typeof val !== "string") return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  const base =
    process.env.NEXT_PUBLIC_CLOUDINARY_BASE ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";
  if (!base) return val.startsWith("/") ? val : `${val}`;
  return base.replace(/\/$/, "") + (val.startsWith("/") ? val : `/${val}`);
}

function getProductColor(id: string) {
  const palette = [
    colors.gradients.purple,
    colors.gradients.pink,
    colors.gradients.cyan,
    colors.gradients.green,
    colors.gradients.warm,
    colors.gradients.soft,
    colors.gradients.blush,
    colors.gradients.peach,
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export function ProductDetailContent({
  productId,
  variant = "page",
  onRequestClose,
  forceMobileLayout = false,
}: ProductDetailContentProps) {
  const t = useTranslations();
  const [quantity, setQuantity] = useState<number>(1);
  const [cartAnim, setCartAnim] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const { data: product, isLoading, error } = useProduct(productId);
  const { addItem } = useCartStore();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const { isSessionActive, tableNumber } = useCurrentTable();
  const hasTableSession = Boolean(isSessionActive && tableNumber);
  const isProductAvailable = Boolean(
    product?.isActive !== false && product?.isAvailable === true,
  );

  const optionsList = useMemo(
    () =>
      (product?.options ?? []).map((opt) => ({
        ...opt,
        isAvailable: opt.isAvailable !== false,
      })),
    [product?.options]
  );
  const hasSelectableOptions = useMemo(
    () => optionsList.some((opt) => opt.isAvailable),
    [optionsList]
  );
  const hasAnyOptions = optionsList.length > 0;
  const allOptionsUnavailable = hasAnyOptions && !hasSelectableOptions;

  const selectedOptionKeys = useMemo(
    () =>
      new Set(
        selectedOptions
          .map((opt) =>
            opt?.id != null ? String(opt.id) : opt.name?.trim() ?? ""
          )
          .filter((key) => key.length > 0)
      ),
    [selectedOptions]
  );

  useEffect(() => {
    if (!hasTableSession) {
      setIsOptionsOpen(false);
    }
  }, [hasTableSession]);

  const addProductToCart = (options: SelectedOption[]) => {
    if (!product || !isProductAvailable) {
      setIsOptionsOpen(false);
      return;
    }
    setSelectedOptions(options);

    if (!hasTableSession) {
      setIsOptionsOpen(false);
      return;
    }

    addItem(product, quantity, options);
    setIsOptionsOpen(false);
    setCartAnim(true);
    setTimeout(() => setCartAnim(false), 320);
  };

  const openOptionsModal = () => {
    if (!product || !isProductAvailable) return;
    if (!hasSelectableOptions) {
      addProductToCart([]);
      return;
    }
    setIsOptionsOpen(true);
  };

  const handlePrimaryAdd = () => {
    openOptionsModal();
  };

  const handleConfirmOptions = (options: SelectedOption[]) => {
    addProductToCart(options);
  };

  const bounceOnce = keyframes`
    0% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-3px) scale(1.06); }
    100% { transform: translateY(0) scale(1); }
  `;

  if (isLoading) {
    return (
      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
        <ProductDetailSkeleton />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
        <ErrorState />
      </Box>
    );
  }

  const hasProductDiscount = Number(product.discountPercent ?? 0) > 0;
  const categoryDiscount = Number(product.category?.discountPercent ?? 0);
  const hasAnyDiscount = hasProductDiscount || categoryDiscount > 0;
  const displayDiscount = hasProductDiscount
    ? Number(product.discountPercent)
    : categoryDiscount;
  const computedOriginal =
    product.originalPrice ??
    (displayDiscount > 0 && product.price
      ? Math.round(Number(product.price) / (1 - displayDiscount / 100))
      : product.price);

  const imagesRaw = Array.isArray(product.images) ? product.images : [];
  const imageUrls = imagesRaw
    .map((i) => resolveImageUrl(i as MaybeImage))
    .filter(Boolean) as string[];

  const slides = imageUrls.length > 0 ? imageUrls : [undefined];
  const shouldShowOptionsModal = hasSelectableOptions;
  const isModalVariant = variant === "modal";
  const shouldForceMobile = Boolean(forceMobileLayout);

  return (
    <Box
      sx={{
        width: "100%",
        py: isModalVariant ? { xs: 1.75, md: 3.5 } : { xs: 3, md: 6 },
        px: isModalVariant
          ? shouldForceMobile
            ? { xs: 1.5, sm: 1.5 }
            : { xs: 1.5, sm: 2 }
          : { xs: 2, md: 0 },
        overflowX: "hidden",
        boxSizing: "border-box",
        maxWidth: isModalVariant ? { xs: "100%", sm: "100%" } : "none",
        mx: isModalVariant ? "auto" : 0,
        backgroundColor: isModalVariant ? "transparent" : colors.quickViewPaperBg,
        borderRadius: isModalVariant ? 0 : 0,
      }}
    >
      <Container
        maxWidth={isModalVariant ? "md" : "lg"}
        disableGutters={isModalVariant}
        sx={{
          px: isModalVariant
            ? shouldForceMobile
              ? { xs: 0, sm: 0 }
              : { xs: 0, sm: 2 }
            : { xs: 2, md: 0 },
          overflowX: "hidden",
          boxSizing: "border-box",
          width: "100%",
          mx: isModalVariant ? "auto" : 0,
          backgroundColor: isModalVariant ? "transparent" : colors.quickViewContentBg,
          borderRadius: isModalVariant ? 0 : 0,
          boxShadow: isModalVariant
            ? "none"
            : `0 24px 60px ${hexToRgba(colors.shadowDark, 0.18)}`,
          border: isModalVariant ? "none" : `1px solid ${hexToRgba(colors.black, 0.06)}`,
        }}
      >
        {isModalVariant && onRequestClose ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              px: { xs: 0, sm: 0 },
              mb: { xs: 1.5, md: 2 },
            }}
          >
            <IconButton onClick={onRequestClose} aria-label={t("common.close", { defaultMessage: "بستن" })}>
              <Close />
            </IconButton>
          </Box>
        ) : null}
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "minmax(0, 380px) minmax(0, 1fr)",
              md: "minmax(0, 430px) minmax(0, 1fr)",
            },
            gap: { xs: 1.5, sm: 1.25, md: 3.5 },
            alignItems: "start",
            justifyItems: { xs: "stretch", sm: "stretch" },
            maxWidth: { xs: "100%", sm: "100%" },
            mx: { xs: "auto", sm: 0 },
            px: { xs: 1.5, sm: 0 },
            minWidth: 0,
            ...(shouldForceMobile && {
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 1.5,
              px: 1.5,
            }),
          }}
        >
          {/* Left: Gallery */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: shouldForceMobile ? "center" : { xs: "center", md: "flex-start" },
              mx: shouldForceMobile ? "auto" : { xs: "auto", sm: "auto", md: 0 },
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                position: { xs: "static", md: "sticky" },
                top: { md: 120 },
                width: "100%",
                maxWidth: { xs: "100%", sm: 480, md: 480 },
                display: "block",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: { xs: "100%", sm: 340, md: 440 },
                  height: "auto",
                  aspectRatio: { xs: "1 / 1", sm: "auto" },
                  mx: { xs: 0, sm: "auto", md: 0 },
                  boxSizing: "border-box",
                  borderRadius: 2,
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <Swiper
                  onSwiper={(s) => (swiperRef.current = s)}
                  modules={[Navigation, Pagination, A11y]}
                  spaceBetween={16}
                  slidesPerView={1}
                  navigation
                  pagination={{ clickable: true }}
                  loop={slides.length > 1}
                  onSlideChange={(s) =>
                    setSelectedImageIndex(s.realIndex ?? s.activeIndex ?? 0)
                  }
                  style={{ width: "100%", maxWidth: "100%" }}
                >
                  {slides.map((src, idx) => (
                    <SwiperSlide
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 0,
                        width: "100%",
                        maxWidth: "100%",
                        flex: "0 0 100%",
                        boxSizing: "border-box",
                        margin: "0 auto",
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          aspectRatio: "1 / 1",
                          width: "100%",
                          maxWidth: { xs: "100%", sm: 320, md: 440 },
                          height: "auto",
                          maxHeight: { xs: "100%", sm: 360, md: 480 },
                          mx: 0,
                          borderRadius: 2,
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 20px 60px var(--shadow-2)`,
                          background: src ? "transparent" : getProductColor(product.id),
                          minWidth: 0,
                        }}
                      >
                        {product.discountPercent && product.discountPercent > 0 ? (
                          <Chip
                            label={`-${product.discountPercent}%`}
                            sx={{
                              position: "absolute",
                              top: 7,
                              left: 7,
                              zIndex: 6,
                              minHeight: "unset",
                              background: `linear-gradient(180deg, ${hexToRgba(colors.danger, colors.glassHiAlpha)} 0%, ${hexToRgba(colors.dangerDark, colors.glassLoAlpha)} 100%)`,
                              color: colors.discountBadgeText,
                              backdropFilter: "blur(8px)",
                              border: `1px solid ${hexToRgba(colors.danger, 0.5)}`,
                              boxShadow: `0 3px 10px ${hexToRgba(colors.black, 0.2)}`,
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              px: 0.95,
                              py: 0.06,
                              lineHeight: 1.1,
                              letterSpacing: "-0.15px",
                            }}
                          />
                        ) : null}
                        {src ? (
                          <CardMedia
                            component="img"
                            image={src}
                            alt={product.name}
                            loading="lazy"
                            sx={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: { xs: "cover", sm: "cover" },
                              objectPosition: "center",
                            }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 140,
                              height: 140,
                              borderRadius: "50%",
                              backgroundColor: hexToRgba(colors.white, 0.18),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `2px solid ${hexToRgba(colors.white, 0.22)}`,
                            }}
                          >
                            <Typography
                              variant="h2"
                              sx={{ color: "white", fontWeight: "bold" }}
                            >
                              {product.name?.charAt(0).toUpperCase()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Box>

              {imageUrls.length > 1 && (
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    gap: { xs: 1, md: 1 },
                    mt: 3,
                    overflowX: "auto",
                    pb: 1,
                    justifyContent: { xs: "flex-start", md: "flex-start" },
                    maxWidth: "100%",
                    minWidth: 0,
                  }}
                >
                  {imageUrls.map((u, i) => (
                    <Box
                      key={u + i}
                      onClick={() => {
                        swiperRef.current?.slideToLoop(i);
                        setSelectedImageIndex(i);
                      }}
                      sx={{
                        width: { xs: 54, md: 60 },
                        height: { xs: 54, md: 60 },
                        borderRadius: 1.5,
                        overflow: "hidden",
                        cursor: "pointer",
                        border:
                          i === selectedImageIndex
                            ? `2px solid ${colors.quickViewThumbBorderActive}`
                            : `1px solid ${colors.quickViewThumbBorder}`,
                        flex: "0 0 auto",
                      }}
                    >
                      <Image
                        src={u}
                        alt={`${product.name}-thumb-${i}`}
                        width={60}
                        height={60}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Right: Details */}
          <Box
            sx={{
              pt: { xs: 0.35, md: 2 },
              width: "100%",
              maxWidth: { xs: "100%", sm: 520, md: "none" },
              px: { xs: 0, sm: 0.5, md: 0 },
              margin: { xs: "0 auto", md: 0 },
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "center", md: "flex-start" },
              textAlign: { xs: "center", md: "left" },
              minWidth: 0,
              ...(shouldForceMobile && { px: 0 }),
            }}
          >
            <Box sx={{ mb: { xs: 1.5, md: 3 }, textAlign: { xs: "center", md: "left" } }}>
              <Chip
                label={product.category?.name ?? ""}
                sx={{
                  backgroundColor: hexToRgba(colors.badgeBlue, 0.1),
                  color: colors.badgeBlue,
                  fontWeight: 500,
                  borderRadius: 2,
                  mb: 1,
                  alignSelf: { xs: "center", md: "flex-start" },
                }}
              />
            </Box>

            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.35rem", md: "2.3rem" },
                textAlign: { xs: "center", md: "left" },
                mb: { xs: 1, md: 2 },
              }}
            >
              {product.name}
            </Typography>

            <Box sx={{ mb: { xs: 1.5, md: 4 } }}>
              {hasAnyDiscount ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "center", md: "center" },
                    gap: 2,
                    flexWrap: "wrap",
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      textDecoration: "line-through",
                      color: "text.secondary",
                      fontSize: { xs: "0.85rem", md: "1.15rem" },
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    {toPersianDigits(formatPrice(computedOriginal ?? product.price))}
                  </Typography>
                  <Price
                    amount={product.price}
                    variant="h4"
                    sx={{
                      fontWeight: "800",
                      color: colors.black,
                      fontSize: { xs: "0.78rem", md: "1.1rem" },
                      textAlign: { xs: "center", md: "left" },
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "center", md: "flex-start" },
                    mt: { xs: 0.5, md: 0 },
                  }}
                >
                  <Price
                    amount={product.price}
                    variant="h4"
                    sx={{
                      fontWeight: "700",
                      color: colors.black,
                      fontSize: { xs: "0.78rem", md: "1.05rem" },
                      textAlign: { xs: "center", md: "left" },
                    }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ mb: { xs: 2.25, md: 5 }, textAlign: { xs: "center", md: "left" } }}>
              <Typography variant="body1" color="text.secondary">
                {product.description}
              </Typography>
            </Box>

            {hasAnyOptions ? (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: shouldForceMobile
                    ? { xs: "100%", sm: "66.666%" }
                    : "100%",
                  mb: { xs: 2.5, md: 4 },
                  backgroundColor: colors.quickViewHighlightBg,
                  borderRadius: 3,
                  p: { xs: 1.75, md: 3 },
                  textAlign: { xs: "center", md: "left" },
                  border: `1px solid ${colors.quickViewHighlightBorder}`,
                  boxShadow: colors.quickViewHighlightShadow,
                  mx: shouldForceMobile ? { xs: 0, sm: "auto" } : 0,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    mb: { xs: 1.5, md: 2 },
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  {t("products.options.sectionTitle", {
                    defaultMessage: "افزودنی‌های محصول",
                  })}
                </Typography>
                {allOptionsUnavailable ? (
                  <Typography
                    variant="body2"
                    sx={{
                      mb: { xs: 1.5, md: 2 },
                      color: colors.gray600,
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    {t("products.options.allUnavailable", {
                      defaultMessage: "تمام افزودنی‌های این محصول در حال حاضر غیرفعال هستند.",
                    })}
                  </Typography>
                ) : null}
                <Stack spacing={1.2}>
                  {optionsList.map((option) => {
                    const optionKey =
                      option.id != null
                        ? String(option.id)
                        : option.name?.trim() ?? "";
                    const isSelected =
                      optionKey.length > 0 && selectedOptionKeys.has(optionKey);
                    const priceValue = Number(option.additionalPrice) || 0;

                    const isUnavailable = !option.isAvailable;
                    const borderColor = isUnavailable
                      ? colors.quickViewOptionBorderDisabled
                      : isSelected
                        ? colors.quickViewOptionBorderSelected
                        : colors.quickViewOptionBorder;
                    const backgroundColor = isSelected
                      ? colors.quickViewOptionBackgroundSelected
                      : colors.quickViewOptionBackground;
                    const nameColor = isUnavailable
                      ? colors.quickViewOptionTextDisabled
                      : colors.quickViewOptionText;
                    const priceColor = isUnavailable
                      ? colors.quickViewOptionPriceDisabled
                      : colors.quickViewOptionPrice;

                    return (
                      <Box
                        key={option.id ?? option.name}
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          flexWrap: { xs: "wrap", md: "nowrap" },
                          borderRadius: 2,
                          p: { xs: 1.25, md: 1.5 },
                          border: `1px solid ${borderColor}`,
                          backgroundColor,
                          boxShadow: isSelected
                            ? colors.quickViewOptionShadowSelected
                            : "none",
                          transition: "all 0.2s ease",
                          opacity: isUnavailable ? 0.75 : 1,
                          pointerEvents: "none",
                          cursor: "default",
                          filter: isUnavailable ? "grayscale(0.12)" : "none",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            flex: 1,
                            minWidth: 0,
                            textAlign: "right",
                            color: nameColor,
                          }}
                        >
                          {option.name}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            flexShrink: 0,
                            textAlign: "left",
                            flexWrap: "wrap",
                            rowGap: 0.5,
                          }}
                        >
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700, color: priceColor }}
                            >
                              +
                            </Typography>
                            <Price
                              amount={priceValue}
                              variant="body2"
                              withCurrency
                              sx={{ fontWeight: 700, color: priceColor }}
                            />
                          </Stack>
                          {isSelected ? (
                            <Chip
                              label={t("products.options.selectedBadge", {
                                defaultMessage: "انتخاب شده",
                              })}
                              icon={<CheckCircleOutline fontSize="small" />}
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          ) : null}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ) : null}

            <Box
              sx={{
                backgroundColor: colors.pageBackground,
                borderRadius: 3,
                p: { xs: 2, md: 4 },
                mb: { xs: 3, md: 4 },
                width: "100%",
                textAlign: { xs: "center", md: "left" },
              }}
            >
              {hasTableSession ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      تعداد:
                    </Typography>
                    <QuantityStepper
                      value={quantity}
                      onChange={setQuantity}
                      min={1}
                      max={10}
                      disabled={!isProductAvailable}
                    />
                  </Box>

                  <Stack spacing={1.5} sx={{ width: "100%" }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={
                        <span style={{ display: "inline-flex" }}>
                          <ShoppingCart />
                        </span>
                      }
                      onClick={handlePrimaryAdd}
                      disabled={!isProductAvailable}
                      sx={{
                        width: "100%",
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.5,
                        fontSize: { xs: "0.9rem", md: "1rem" },
                        "& .MuiButton-startIcon": {
                          "@media (prefers-reduced-motion: reduce)": {
                            animation: "none !important",
                          },
                          animation: cartAnim ? `${bounceOnce} 320ms ease-in-out` : "none",
                        },
                        alignSelf: "stretch",
                      }}
                    >
                      {!isProductAvailable
                        ? t("products.unavailableMessage")
                        : shouldShowOptionsModal
                            ? t("products.options.configurePrimary", {
                                defaultMessage: "انتخاب افزودنی و افزودن",
                              })
                            : t("products.addToCart")}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("products.tableSessionRequired")}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Container>

      {shouldShowOptionsModal ? (
        <ProductOptionsModal
          product={product}
          open={isOptionsOpen}
          onClose={() => setIsOptionsOpen(false)}
          onConfirm={handleConfirmOptions}
          initialOptions={selectedOptions}
        />
      ) : null}
    </Box>
  );
}
