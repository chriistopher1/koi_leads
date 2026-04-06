"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useLinkPaymentMethod } from "@/hooks/useLinkPaymentMethod";
import { useEffect } from "react"; // Refresh after redirect

interface PaymentMethodSectionProps {
  profile: any;
  onLinked?: () => void; // Callback for modal
}

export function PaymentMethodSection({ profile, onLinked }: PaymentMethodSectionProps) {
  const { linkPaymentMethod, isLinking } = useLinkPaymentMethod();

  const hasPaymentMethod = !!profile?.payment_method_id;

  useEffect(() => {
    if (hasPaymentMethod && onLinked) onLinked();
  }, [hasPaymentMethod, onLinked]);

  if (hasPaymentMethod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="default">Tersambung</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Siap untuk pembayaran berlangganan otomatis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Hubungkan Metode Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="text-sm text-muted-foreground">
          Untuk berlangganan bulanan, hubungkan metode pembayaran (Kartu, E-Wallet, VA) agar bisa dibebankan otomatis.
        </div>
        <Button onClick={linkPaymentMethod} disabled={isLinking} className="w-full">
          {isLinking ? "Menghubungkan..." : "Hubungkan Sekarang"}
        </Button>
      </CardContent>
    </Card>
  );
}