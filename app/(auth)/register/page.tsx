"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleGoogleRegister() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      toast.error("Registrasi Google gagal: " + error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image src="/app_logo.png" alt="KoiLeads Logo" width={62} height={62} />
          </div>
          <CardTitle className="text-2xl">Daftar KoiLeads</CardTitle>
          <CardDescription>Daftar cepat hanya dengan akun Google</CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            type="button"
            className="w-full"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Daftar dengan Google"}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 mt-3">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}