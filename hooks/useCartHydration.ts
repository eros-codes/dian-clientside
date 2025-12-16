"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useCurrentTable } from "@/hooks/useCurrentTable";
import { toast } from "sonner";

export function useCartHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const { sessionId, sessionExpiresAt, isSessionActive } = useCurrentTable();
  const { setTableId, clearCart } = useCartStore();

  useEffect(() => {
    // Update store with current table/session id whenever it changes
    setTableId(sessionId ?? null);
    
    // Manually trigger hydration after component mounts
    useCartStore.persist.rehydrate();
    setIsHydrated(true);
  }, [sessionId, setTableId]);

  // Monitor session expiry and clear cart accordingly
  useEffect(() => {
    if (!sessionExpiresAt || !isSessionActive) {
      return;
    }

    const checkExpiry = () => {
      if (sessionExpiresAt <= Date.now()) {
        clearCart();
          setTableId(null);
        toast.error("نشست میز شما منقضی شد. لطفاً دوباره QR را اسکن کنید.");
      }
    };

    const remaining = sessionExpiresAt - Date.now();
    if (remaining <= 0) {
      checkExpiry();
      return;
    }

    // Check expiry periodically (every 30 seconds)
    const interval = setInterval(checkExpiry, 30000);

    // Also check on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkExpiry();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionExpiresAt, isSessionActive, clearCart, setTableId]);

  return isHydrated;
}
