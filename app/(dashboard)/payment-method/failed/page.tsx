"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export default function PaymentMethodFailed() {
  const router = useRouter();

  useEffect(() => {
    toast.error("Gagal menghubungkan metode pembayaran. Silakan coba lagi.");
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Gagal Menghubungkan"
          description="Tidak dapat menyimpan metode pembayaran."
        />
        
        <Card className="mt-8">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">⚠️ Gagal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Pembayaran dibatalkan atau terjadi kesalahan.
              </p>
              <p className="text-sm text-muted-foreground">
                Coba lagi atau hubungi support jika masalah berlanjut.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => router.push("/settings")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Pengaturan
              </Button>
              <Button 
                onClick={() => router.push("/settings")}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2 h-4 w-4 animate-spin" />
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}