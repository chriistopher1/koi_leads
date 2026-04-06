"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export default function PaymentMethodSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show success toast
    toast.success("Metode pembayaran berhasil dihubungkan!");
    
    // Auto-redirect to settings after 3s
    const timer = setTimeout(() => {
      router.push("/settings");
    }, 3000);

    setLoading(false);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Berhasil!"
          description="Metode pembayaran Anda telah berhasil dihubungkan."
        />
        
        <Card className="mt-8">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl">✅ Tersambung!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sekarang Anda bisa berlangganan paket bulanan dengan pembayaran otomatis.
            </p>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push("/settings")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ke Pengaturan
              </Button>
              <Button 
                onClick={() => router.push("/pricing")}
                className="flex-1"
              >
                Pilih Paket
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="mt-6 text-center text-sm text-muted-foreground animate-pulse">
            Redirecting to settings...
          </div>
        )}
      </div>
    </div>
  );
}