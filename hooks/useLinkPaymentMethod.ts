"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useLinkPaymentMethod() {
  const [isLinking, setIsLinking] = useState(false);
  const router = useRouter();

  const linkPaymentMethod = async () => {
    setIsLinking(true);
    try {
      const res = await fetch("/api/payment-method/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (res.ok) {
        // Redirect to Xendit Linking UI (handles VA, EWallet, Cards for IDR)
        window.location.href = data.redirect_url;
      } else {
        toast.error(data.error ?? "Gagal menghubungkan metode pembayaran");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLinking(false);
    }
  };

  return { linkPaymentMethod, isLinking };
}