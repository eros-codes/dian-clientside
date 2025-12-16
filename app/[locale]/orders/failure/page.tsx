"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Button,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import Link from "next/link";

export default function OrderFailurePage() {
  const params = useSearchParams();
  const reason = params.get("reason");

  // پاک کردن localStorage چون پرداخت ناموفق بوده
  useEffect(() => {
    try {
      localStorage.removeItem("pendingOrder");
      localStorage.removeItem("pendingOrderId");
    } catch {}
  }, []);

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ textAlign: "center", borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 6 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <ErrorIcon color="error" sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              ثبت سفارش ناموفق بود
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {reason || "متأسفانه مشکلی رخ داد. لطفاً دوباره تلاش کنید یا بعداً مراجعه نمایید."}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <Button component={Link} href="/checkout" variant="contained" size="large">
                تلاش مجدد
              </Button>
              <Button component={Link} href="/" variant="outlined" size="large">
                بازگشت به خانه
              </Button>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="caption" color="text.secondary">
                اگر مبلغی از حساب شما کسر شده، معمولاً ظرف چند دقیقه به صورت خودکار برگشت می‌خورد. در صورت نیاز با پشتیبانی تماس بگیرید.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </AppShell>
  );
}
