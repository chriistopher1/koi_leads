"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SubscriptionStatus = "active" | "inactive" | "trial";
type SubscriptionPlan = "free" | "pro" | "business";

type Profile = {
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
};

const plans = [
  {
    id: "free",
    name: "Gratis",
    price: "Rp 0",
    period: "/bulan",
    description: "Untuk mencoba platform",
    quota: 50,
    features: [
      "50 leads/bulan",
      "Skor AI dasar",
      "1 kampanye aktif",
      "Draft email",
    ],
    cta: "Mulai Gratis",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "Rp 299.000",
    period: "/bulan",
    description: "Untuk freelancer & solopreneur",
    quota: 500,
    features: [
      "500 leads/bulan",
      "Skor AI lengkap",
      "Kampanye tak terbatas",
      "Draft email & Instagram DM",
      "Export CSV",
    ],
    cta: "Pilih Pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "Rp 799.000",
    period: "/bulan",
    description: "Untuk tim & agensi",
    quota: 2000,
    features: [
      "2.000 leads/bulan",
      "Skor AI prioritas",
      "Kampanye tak terbatas",
      "Semua fitur Pro",
      "Akses API",
      "Support prioritas",
    ],
    cta: "Pilih Business",
    highlighted: false,
  },
];

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.replace("/register");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_status")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      setProfile(data as Profile | null);
      setCheckingAuth(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const visiblePlans = useMemo(() => {
    if (!profile) return [];

    if (profile.subscription_status === "trial") {
      return plans.filter(
        (plan) => plan.id === "pro" || plan.id === "business",
      );
    }

    if (profile.subscription_status === "inactive") {
      return plans.filter(
        (plan) => plan.id === "pro" || plan.id === "business",
      );
    }

    if (profile.subscription_status === "active") {
      if (profile.subscription_plan === "free") {
        return plans.filter(
          (plan) => plan.id === "pro" || plan.id === "business",
        );
      }

      if (profile.subscription_plan === "pro") {
        return plans.filter((plan) => plan.id === "business");
      }

      if (profile.subscription_plan === "business") {
        return [];
      }
    }

    return [];
  }, [profile]);

  async function handleUpgrade(planId: string) {
    if (planId === "free") {
      router.push("/register");
      return;
    }

    setLoading(planId);

    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = data.invoiceUrl;
    } else {
      toast.error(data.error ?? "Gagal membuat pembayaran");
    }

    setLoading(null);
  }

  if (checkingAuth) {
    return null;
  }

  if (
    profile?.subscription_status === "active" &&
    profile.subscription_plan === "business"
  ) {
    return null;
  }

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">
            Harga Transparan
          </h2>
          <p className="text-muted-foreground mt-3">
            Tidak ada biaya tersembunyi. Bayar sesuai kebutuhan.
          </p>
        </div>

        {visiblePlans.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {visiblePlans.map((plan) => (
              <Card
                key={plan.id}
                className={
                  plan.highlighted
                    ? "border-primary shadow-lg shadow-primary/10 scale-105"
                    : ""
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.highlighted && <Badge>Populer</Badge>}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? "Memproses..." : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
