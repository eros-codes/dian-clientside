"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Box, Card, CardContent, Container, Typography, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { keyframes } from "@mui/system";
import Link from "next/link";
import { useCartStore } from "@/stores/cartStore";

export default function OrderConfirmationPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const { clearCart } = useCartStore();

  // Clear cart and remove pending order ID
  useEffect(() => {
    try {
      const pending = localStorage.getItem("pendingClearCart");
      if (pending) {
        clearCart();
        localStorage.removeItem("pendingClearCart");
      }
      localStorage.removeItem("pendingOrderId");
      localStorage.removeItem("pendingOrder");
    } catch {}
  }, [clearCart]);

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ textAlign: "center", borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 6 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  '@keyframes popIn': {
                    '0%': { transform: 'scale(0.9)', opacity: 0 },
                    '60%': { transform: 'scale(1.08)', opacity: 1 },
                    '100%': { transform: 'scale(1)' },
                  },
                  animation: 'popIn 280ms ease-out',
                  '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                  },
                }}
              >
                <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              سفارش شما با موفقیت ثبت شد
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {orderId
                ? `شماره سفارش: ${orderId}`
                : "سفارش شما ثبت شده است. می‌توانید وضعیت آن را در بخش سفارش‌ها پیگیری کنید."}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <Button component={Link} href="/orders" variant="contained" size="large">
                پیگیری سفارش‌ها
              </Button>
              <Button component={Link} href="/" variant="outlined" size="large">
                بازگشت به خانه
              </Button>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="caption" color="text.secondary">
                تاییدیه سفارش برای شما ارسال شده است. در صورت نیاز می‌توانید با پشتیبانی تماس بگیرید.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </AppShell>
  );
}
