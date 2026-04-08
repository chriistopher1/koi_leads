// app/support/page.tsx
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const supportEmail = "support@kineticdigitalsolutions.com"; // ganti dengan email support Anda

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Image
              src="/app_logo.png"
              alt="KoiLeads Logo"
              width={62}
              height={62}
            />
          </div>
          <CardTitle className="text-2xl">Pusat Bantuan</CardTitle>
          <CardDescription>
            Butuh bantuan? Tim kami siap membantu Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Support */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-muted/40">
            <div className="p-3 rounded-full bg-primary/10">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Email kami di
              </p>
              <p className="font-semibold text-base">{supportEmail}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${supportEmail}`}>Kirim Email</a>
            </Button>
          </div>

          {/* Response time note */}
          <p className="text-xs text-muted-foreground">
            Kami biasanya membalas dalam{" "}
            <span className="font-medium text-foreground">1x24 jam</span> pada
            hari kerja.
          </p>

          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline block"
          >
            ← Kembali ke Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
