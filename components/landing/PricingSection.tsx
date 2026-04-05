"use client";

import { useState } from "react";
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

type SubscriptionStatus = "active" | "inactive" | "trial";
type SubscriptionPlan = "free" | "pro" | "business";

type Profile = {
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
};

const plans = [
  {
    id: "free",
    name: "Gratis",
    price: "Rp 0",
    period: "/bulan",
    description: "Untuk mencoba platform",
    quota: 50,
    features: ["50 leads/bulan", "Skor AI dasar", "1 kampanye aktif", "Draft email"],
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
] as const;

function getVisiblePlans(profile: Profile | null) {
  if (!profile) return plans;

  const { subscription_status, subscription_plan } = profile;

  if (subscription_status === "trial" || subscription_status === "inactive") {
    return plans.filter((plan) => plan.id === "pro" || plan.id === "business");
  }

  if (subscription_status === "active") {
    if (subscription_plan === "free") {
      return plans.filter((plan) => plan.id === "pro" || plan.id === "business");
    }

    if (subscription_plan === "pro") {
      return plans.filter((plan) => plan.id === "business");
    }

    if (subscription_plan === "business") {
      return [];
    }
  }

  return plans;
}

export function PricingSection({ profile }: { profile: Profile | null }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const visiblePlans = getVisiblePlans(profile);

  async function handleUpgrade(planId: string) {
    if (!profile) {
      router.push("/register");
      return;
    }

    if (planId === "free") {
      router.push("/register");
      return;
    }

    setLoading(planId);

    try {
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
    } finally {
      setLoading(null);
    }
  }

  if (visiblePlans.length === 0) {
    return null;
  }

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Harga Transparan</h2>
          <p className="mt-3 text-muted-foreground">
            Tidak ada biaya tersembunyi. Bayar sesuai kebutuhan.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
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

                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
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
      </div>
    </section>
  );
}