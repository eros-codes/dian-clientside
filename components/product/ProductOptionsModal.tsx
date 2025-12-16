"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import colors, { hexToRgba } from "@/client-colors";
import { Product, ProductOption, SelectedOption } from "@/types";
import { Price } from "@/components/ui/Price";

function areOptionsEqual(a: SelectedOption[], b: SelectedOption[]) {
  if (a.length !== b.length) return false;
  return a.every((option, index) => {
    const other = b[index];
    if (!other) return false;
    return (
      option.id === other.id &&
      option.name === other.name &&
      Number(option.additionalPrice) === Number(other.additionalPrice)
    );
  });
}

interface ProductOptionsModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedOptions: SelectedOption[]) => void;
  initialOptions?: SelectedOption[];
}

function mapOption(option: ProductOption): SelectedOption {
  return {
    id: option.id,
    name: option.name,
    additionalPrice: Number(option.additionalPrice) || 0,
  };
}

export function ProductOptionsModal({
  product,
  open,
  onClose,
  onConfirm,
  initialOptions,
}: ProductOptionsModalProps) {
  const t = useTranslations();
  const optionsList = useMemo(() => product.options ?? [], [product.options]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const normalizedInitialOptions = useMemo(
    () =>
      (initialOptions ?? []).map((opt) => ({
        ...opt,
        additionalPrice: Number(opt.additionalPrice) || 0,
      })),
    [initialOptions]
  );

  const [selected, setSelected] = useState<SelectedOption[]>(normalizedInitialOptions);

  useEffect(() => {
    if (open) {
      setSelected((prev) => {
        if (areOptionsEqual(prev, normalizedInitialOptions)) {
          return prev;
        }
        return normalizedInitialOptions;
      });
    }
  }, [open, normalizedInitialOptions]);

  const toggleOption = (option: ProductOption) => {
    if (option.isAvailable === false) {
      return;
    }
    setSelected((prev) => {
      const exists = prev.some((item) =>
        item.id !== undefined ? item.id === option.id : item.name === option.name
      );
      if (exists) {
        return prev.filter((item) =>
          item.id !== undefined ? item.id !== option.id : item.name !== option.name
        );
      }
      return [...prev, mapOption(option)];
    });
  };

  const isChecked = (option: ProductOption) =>
    selected.some((item) =>
      item.id !== undefined ? item.id === option.id : item.name === option.name
    );

  const optionsSubtotal = useMemo(
    () => selected.reduce((sum, option) => sum + (Number(option.additionalPrice) || 0), 0),
    [selected]
  );

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: { xs: "calc(100% - 32px)", sm: "auto" },
          mx: { xs: 2, sm: "auto" },
          my: { xs: 3, sm: 6 },
          backgroundColor: colors.quickViewContentBg,
          border: `1px solid ${colors.quickViewPaperBorder}`,
          boxShadow: colors.quickViewModalShadow,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: colors.quickViewOptionText }}>
        {t("products.options.dialogTitle", { defaultMessage: "افزودن افزودنی‌ها" })}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
          backgroundColor: colors.quickViewContentBg,
          borderTop: `1px solid ${colors.quickViewOptionDivider}`,
          borderBottom: `1px solid ${colors.quickViewOptionDivider}`,
        }}
      >
        {optionsList.length === 0 ? (
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {t("products.options.emptyState", {
              defaultMessage: "برای این محصول افزودنی فعالی ثبت نشده است.",
            })}
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.7, color: colors.textSecondary }}
            >
              {t("products.options.instructions", {
                defaultMessage: "می‌توانید چند گزینه را هم‌زمان انتخاب کنید.",
              })}
            </Typography>
            <Divider sx={{ borderColor: colors.quickViewOptionDivider }} />
            <Stack spacing={1.5}>
              {optionsList.map((option) => {
                const disabled = option.isAvailable === false;
                const checked = isChecked(option);
                const borderColor = disabled
                  ? colors.quickViewOptionBorderDisabled
                  : checked
                    ? colors.quickViewOptionBorderSelected
                    : colors.quickViewOptionBorder;
                const backgroundColor = checked
                  ? colors.quickViewOptionBackgroundSelected
                  : colors.quickViewOptionBackground;
                const labelColor = disabled
                  ? colors.quickViewOptionTextDisabled
                  : colors.quickViewOptionText;
                const priceColor = disabled
                  ? colors.quickViewOptionPriceDisabled
                  : colors.quickViewOptionPrice;
                const boxShadow = checked ? colors.quickViewOptionShadowSelected : "none";
                return (
                  <Box
                    key={option.id ?? option.name}
                    sx={{
                      border: "1px solid",
                      borderColor,
                      borderRadius: 2,
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 1.25, sm: 1.5 },
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      gap: 2,
                      transition: "border-color 160ms ease, box-shadow 160ms ease",
                      opacity: disabled ? 0.55 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                      boxShadow,
                      backgroundColor,
                    }}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onClick={() => toggleOption(option)}
                    onKeyDown={(event) => {
                      if (disabled) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleOption(option);
                      }
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (disabled) return;
                            toggleOption(option);
                          }}
                          color="primary"
                          disabled={disabled}
                          sx={{
                            "& .MuiSvgIcon-root": {
                              fontSize: 24,
                              color: checked
                                ? colors.quickViewOptionBorderSelected
                                : colors.quickViewOptionBorder,
                            },
                            "&.Mui-checked .MuiSvgIcon-root": {
                              color: colors.quickViewOptionBorderSelected,
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: labelColor }}
                          >
                            {option.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.textSecondary }}
                          >
                            {t("products.options.priceSuffix", { defaultMessage: "افزایش قیمت" })}
                            {disabled
                              ? ` · ${t("products.options.unavailable", { defaultMessage: "ناموجود" })}`
                              : null}
                          </Typography>
                        </Box>
                      }
                      sx={{ flexGrow: 1, mr: 0 }}
                    />
                    <Price
                      amount={Number(option.additionalPrice) || 0}
                      variant="body1"
                      withCurrency
                      sx={{ fontWeight: 600, color: priceColor }}
                    />
                  </Box>
                );
              })}
            </Stack>
            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: colors.quickViewOptionSummaryBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: colors.quickViewOptionText }}
              >
                {t("products.options.totalLabel", { defaultMessage: "جمع افزودنی‌های انتخابی" })}
              </Typography>
              <Price
                amount={optionsSubtotal}
                variant="subtitle1"
                withCurrency
                sx={{ fontWeight: 700, color: colors.quickViewOptionPrice }}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          gap: 1.5,
          flexWrap: "wrap",
          justifyContent: { xs: "stretch", sm: "flex-end" },
        }}
      >
        <Button onClick={onClose} variant="outlined" fullWidth={isMobile}>
          {t("common.cancel", { defaultMessage: "انصراف" })}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={optionsList.length === 0}
          sx={{ fontWeight: 600 }}
          fullWidth={isMobile}
        >
          {t("products.options.confirmLabel", { defaultMessage: "افزودن به سبد" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
