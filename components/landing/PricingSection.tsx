// components/pricing/PricingSection.tsx
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
import {
  BillingCycle,
  PaymentType,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/types";

type Profile = {
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  payment_type: PaymentType;
  subscription_ends_at: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHLY_PRICES: Record<string, number> = {
  pro: 299000,
  business: 799000,
};

const LIFETIME_PRICES: Record<string, number> = {
  pro: 999000,
  business: 2499000,
};

const DISCOUNT_12MONTH = 0.2;

function calc12MonthPrice(planId: string): number {
  const monthly = MONTHLY_PRICES[planId] ?? 0;
  const total = monthly * 12;
  return Math.round(total * (1 - DISCOUNT_12MONTH));
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Plan Data ────────────────────────────────────────────────────────────────

interface PlanData {
  id: "free" | "pro" | "business";
  name: string;
  description: string;
  features: readonly string[];
  highlighted: boolean;
}

const PLANS: PlanData[] = [
  {
    id: "free",
    name: "Free",
    description: "Untuk mencoba fitur dasar",
    features: ["50 leads/bulan", "Skor AI dasar", "1 kampanye aktif"],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Untuk freelancer & solopreneur",
    features: [
      "500 leads/bulan",
      "Skor AI lengkap",
      "Kampanye tak terbatas",
      "Draft email & Instagram DM",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    description: "Untuk tim & agensi",
    features: [
      "2.000 leads/bulan",
      "Skor AI prioritas",
      "Kampanye tak terbatas",
      "Semua fitur Pro",
      "Support prioritas",
    ],
    highlighted: false,
  },
];

const PLAN_ORDER = ["free", "pro", "business"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPriceDisplay(
  planId: string,
  cycle: BillingCycle,
): { price: string; period: string; badge?: string } {
  if (planId === "free") return { price: "Rp 0", period: "" };

  if (cycle === "1month") {
    return {
      price: formatRupiah(MONTHLY_PRICES[planId]),
      period: "/bulan",
    };
  }

  if (cycle === "12month") {
    const total = calc12MonthPrice(planId);
    const monthly = MONTHLY_PRICES[planId];
    return {
      price: formatRupiah(total),
      period: "/tahun",
      badge: `Hemat ${formatRupiah(monthly * 12 - total)}`,
    };
  }

  // lifetime
  return {
    price: formatRupiah(LIFETIME_PRICES[planId]),
    period: " sekali bayar",
    badge: "Bayar sekali selamanya",
  };
}

function getVisiblePlans(profile: Profile | null): PlanData[] {
  if (!profile) return PLANS;

  const { subscription_status, subscription_plan, payment_type } = profile;

  if (payment_type === "lifetime") return [];

  if (
    subscription_status === "trial" ||
    subscription_status === "inactive" ||
    subscription_status === "failed"
  ) {
    return PLANS.filter((p) => p.id !== "free");
  }

  if (subscription_status === "active" && payment_type === "onetime") {
    const currentIdx = PLAN_ORDER.indexOf(subscription_plan);
    return PLANS.filter((p) => PLAN_ORDER.indexOf(p.id) > currentIdx);
  }

  return PLANS;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface BillingToggleProps {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}

function BillingToggle({ cycle, onChange }: BillingToggleProps) {
  const options: { value: BillingCycle; label: string }[] = [
    { value: "1month", label: "1 Bulan" },
    { value: "12month", label: "12 Bulan" },
    { value: "lifetime", label: "Lifetime" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-muted p-1 w-fit mx-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            cycle === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
          {opt.value === "12month" && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              -20%
            </span>
          )}
          {opt.value === "lifetime" && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              Hemat
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface PlanCardProps {
  plan: PlanData;
  cycle: BillingCycle;
  isLoading: boolean;
  onSelect: (planId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSubscriptionActive(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.subscription_status !== "active") return false;

  // Lifetime: selalu aktif (ends_at = 100 tahun ke depan, tapi cukup cek status)
  if (profile.payment_type === "lifetime") return true;

  // Onetime: cek apakah ends_at belum lewat
  if (profile.subscription_ends_at) {
    return new Date(profile.subscription_ends_at) > new Date();
  }

  return false;
}

interface ActivePlanGateProps {
  profile: Profile;
}

function ActivePlanGate({ profile }: ActivePlanGateProps) {
  const isLifetime = profile.payment_type === "lifetime";

  const endsAt =
    !isLifetime && profile.subscription_ends_at
      ? new Date(profile.subscription_ends_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const cycleLabel: Record<string, string> = {
    lifetime: "Lifetime",
    onetime: "One-time",
    none: "-",
  };

  return (
    <section id="pricing" className="py-10 px-4">
      <div className="container mx-auto max-w-lg space-y-4 text-center">
        <Badge variant="default" className="text-sm px-3 py-1">
          Paket Aktif
        </Badge>
        <div className="rounded-lg border border-border bg-muted/50 p-6 space-y-3">
          <p className="text-lg font-semibold text-foreground">
            {profile.subscription_plan.toUpperCase()}{" "}
            <span className="text-muted-foreground font-normal text-sm">
              · {cycleLabel[profile.payment_type]}
            </span>
          </p>
          {isLifetime ? (
            <p className="text-sm text-muted-foreground">
              Paket Lifetime aktif selamanya. Kuota direset otomatis tiap bulan.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Paket aktif hingga{" "}
              <span className="font-medium text-foreground">{endsAt}</span>.
              Opsi perpanjangan akan tersedia setelah paket berakhir.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, cycle, isLoading, onSelect }: PlanCardProps) {
  const { price, period, badge } = getPriceDisplay(plan.id, cycle);
  const isFreeOnPaid = plan.id === "free" && cycle !== "1month";
  if (isFreeOnPaid) return null;

  const ctaLabels: Record<string, string> = {
    free: "Mulai Gratis",
    pro: "Pilih Pro",
    business: "Pilih Business",
  };

  return (
    <Card
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
        <div className="mt-2 space-y-1">
          <div>
            <span className="text-3xl font-extrabold text-foreground">
              {price}
            </span>
            <span className="text-muted-foreground text-sm">{period}</span>
          </div>
          {badge && (
            <span className="inline-block text-xs font-medium text-primary">
              ✓ {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        {cycle === "12month" && plan.id !== "free" && (
          <p className="text-xs text-primary font-medium">
            ✓ Kuota di-reset otomatis tiap bulan selama 12 bulan
          </p>
        )}
        {cycle === "lifetime" && plan.id !== "free" && (
          <p className="text-xs text-primary font-medium">
            ✓ Tanpa langganan · Kuota di-reset tiap bulan selamanya
          </p>
        )}
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
        {plan.id !== "free" && (
          <Button
            className="w-full"
            variant={plan.highlighted ? "default" : "outline"}
            onClick={() => onSelect(plan.id)}
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : ctaLabels[plan.id]}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface ActiveSubscriptionBannerProps {
  profile: Profile;
}

function ActiveSubscriptionBanner({ profile }: ActiveSubscriptionBannerProps) {
  const endsAt = profile.subscription_ends_at
    ? new Date(profile.subscription_ends_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-center space-y-1">
      <p className="text-sm font-medium text-foreground">
        Paket <strong>{profile.subscription_plan.toUpperCase()}</strong> aktif
        {endsAt && (
          <span className="text-muted-foreground"> · hingga {endsAt}</span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        Untuk upgrade ke paket lebih tinggi, pilih paket di bawah ini.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PricingSection({ profile }: { profile: Profile | null }) {
  const [cycle, setCycle] = useState<BillingCycle>("1month");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  // ── Gate: sembunyikan pricing jika plan masih aktif ──
  if (profile && isSubscriptionActive(profile)) {
    return <ActivePlanGate profile={profile} />;
  }

  const visiblePlans = getVisiblePlans(profile);

  async function handleSelectPlan(planId: string) {
    if (!profile) {
      router.push("/register");
      return;
    }

    setLoading(planId);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, billingCycle: cycle }),
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

  return (
    <section id="pricing" className="py-10 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            Pilih Paket Anda
          </h2>
          <p className="text-muted-foreground">
            Tidak ada biaya tersembunyi. Bayar sesuai kebutuhan.
          </p>
          <BillingToggle cycle={cycle} onChange={setCycle} />
        </div>

        {visiblePlans.length > 0 ? (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                isLoading={loading === plan.id}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            Tidak ada paket tersedia.
          </p>
        )}
      </div>
    </section>
  );
}
