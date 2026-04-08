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
import { LinkPaymentModal } from "../settings/LinkPaymentModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionStatus =
  | "active"
  | "inactive"
  | "trial"
  | "failed"
  | "cancelled";
type SubscriptionPlan = "free" | "pro" | "business";
type PaymentType = "none" | "lifetime" | "subscription";

export type Profile = {
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  payment_type: PaymentType;
  payment_method_id: string | null;
};

// ─── Plan Data ────────────────────────────────────────────────────────────────

type PlanMode = "subscription" | "lifetime";

interface PlanData {
  id: "free" | "pro" | "business";
  name: string;
  subscriptionPrice: string;
  lifetimePrice: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  highlighted: boolean;
}

const plans: PlanData[] = [
  {
    id: "free",
    name: "Free",
    subscriptionPrice: "Rp 0",
    lifetimePrice: "Rp 0",
    period: "",
    description: "Untuk mencoba fitur dasar",
    features: [
      "50 leads/bulan",
      "Skor AI dasar",
      "1 kampanye aktif",
      // "Tanpa export CSV",
    ],
    cta: "Mulai Gratis",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    subscriptionPrice: "Rp 299.000",
    lifetimePrice: "Rp 999.000",
    period: "/bulan",
    description: "Untuk freelancer & solopreneur",
    features: [
      "500 leads/bulan",
      "Skor AI lengkap",
      "Kampanye tak terbatas",
      "Draft email & Instagram DM",
      // "Export CSV",
    ],
    cta: "Pilih Pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    subscriptionPrice: "Rp 799.000",
    lifetimePrice: "Rp 2.499.000",
    period: "/bulan",
    description: "Untuk tim & agensi",
    features: [
      "2.000 leads/bulan",
      "Skor AI prioritas",
      "Kampanye tak terbatas",
      "Semua fitur Pro",
      // "Akses API",
      "Support prioritas",
    ],
    cta: "Pilih Business",
    highlighted: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_ORDER = ["free", "pro", "business"] as const;

function getVisiblePlans(profile: Profile | null): PlanData[] {
  if (!profile) return plans;

  const { subscription_status, subscription_plan, payment_type } = profile;

  // Lifetime user: tidak ada paket yang ditampilkan
  if (payment_type === "lifetime") return [];

  // Inactive / trial: tampilkan semua
  if (
    subscription_status === "trial" ||
    subscription_status === "inactive" ||
    subscription_status === "failed"
  ) {
    return plans.filter((p) => p.id !== "free");
  }

  // Active subscription: hanya tampilkan plan lebih tinggi
  if (subscription_status === "active" && payment_type === "subscription") {
    const currentIdx = PLAN_ORDER.indexOf(subscription_plan);
    return plans.filter((p) => PLAN_ORDER.indexOf(p.id) > currentIdx);
  }

  return plans;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ModeToggleProps {
  mode: PlanMode;
  onChange: (mode: PlanMode) => void;
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-muted p-1 w-fit mx-auto">
      <button
        onClick={() => onChange("subscription")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "subscription"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Bulanan
      </button>
      <button
        onClick={() => onChange("lifetime")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "lifetime"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Lifetime
        <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
          Hemat
        </span>
      </button>
    </div>
  );
}

interface PlanCardProps {
  plan: PlanData;
  mode: PlanMode;
  isLoading: boolean;
  onSelect: (planId: string) => void;
}

function PlanCard({ plan, mode, isLoading, onSelect }: PlanCardProps) {
  if (plan.id === "free" && mode === "lifetime") {
    return;
  }

  const price =
    mode === "lifetime" ? plan.lifetimePrice : plan.subscriptionPrice;
  const period = mode === "lifetime" ? " sekali bayar" : plan.period;

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
        <div className="mt-2">
          <span className="text-3xl font-extrabold text-foreground">
            {price}
          </span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        {mode === "lifetime" && (
          <p className="text-xs text-primary font-medium">
            ✓ Tanpa langganan bulanan · Reset kuota tiap bulan
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
        <Button
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
          onClick={() => onSelect(plan.id)}
          disabled={isLoading}
        >
          {isLoading ? "Memproses..." : plan.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface CancelSubscriptionCardProps {
  isLoading: boolean;
  onCancel: () => void;
}

function CancelSubscriptionCard({
  isLoading,
  onCancel,
}: CancelSubscriptionCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">
          Batalkan Langganan
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Akses tetap aktif hingga akhir periode berjalan.
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onCancel}
        disabled={isLoading}
      >
        {isLoading ? "Membatalkan..." : "Batalkan"}
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PricingSection({ profile }: { profile: Profile | null }) {
  // if(profile != null && )

  const [mode, setMode] = useState<PlanMode>("subscription");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  // const [showPaymentModal, setShowPaymentModal] = useState(false);
  // const [selectedPlanForSub, setSelectedPlanForSub] = useState<string | null>(
  //   null,
  // );

  const visiblePlans = getVisiblePlans(profile);
  const isActiveSubscription =
    profile?.subscription_status === "active" &&
    profile?.payment_type === "subscription";

  async function handleSelectPlan(planId: string) {
    if (!profile) {
      router.push("/register");
      return;
    }

    // If subscription mode and no payment method, show modal first
    // if (mode === "subscription" && !profile.payment_method_id) {
    //   setSelectedPlanForSub(planId);
    //   setShowPaymentModal(true);
    //   return;
    // }

    setLoading(planId);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, paymentType: mode }),
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

  // New: After linking, proceed to subscription payment
  // const handlePaymentModalSuccess = async () => {
  //   setShowPaymentModal(false);
  //   if (selectedPlanForSub) {
  //     // Refresh profile or optimistic update, then create payment
  //     router.refresh();
  //     // Trigger handleSelectPlan again or directly call payment API
  //     handleSelectPlan(selectedPlanForSub);
  //   }
  // };

  async function handleCancelSubscription() {
    setLoading("cancel");
    try {
      const res = await fetch("/api/payment/cancel", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Langganan berhasil dibatalkan");
        router.refresh();
      } else {
        toast.error(data.error ?? "Gagal membatalkan langganan");
      }
    } finally {
      setLoading(null);
    }
  }

  // Lifetime aktif — tidak ada opsi upgrade/downgrade
  if (
    profile?.payment_type === "lifetime" &&
    profile?.subscription_status === "active"
  ) {
    return (
      <section id="pricing" className="py-10 px-4">
        <div className="container mx-auto max-w-lg text-center space-y-3">
          <Badge variant="default" className="text-sm px-3 py-1">
            Paket Lifetime Aktif
          </Badge>
          <p className="text-muted-foreground text-sm">
            Anda menggunakan paket{" "}
            <strong>{profile.subscription_plan.toUpperCase()} Lifetime</strong>.
            Kuota Anda direset otomatis setiap bulan.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-10 px-4">
      <div className="container mx-auto space-y-8 ">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            Pilih Paket Anda
          </h2>
          <p className="text-muted-foreground">
            Tidak ada biaya tersembunyi. Bayar sesuai kebutuhan.
          </p>
          {/* Toggle hanya muncul jika belum active subscription */}
          {profile?.payment_type !== "subscription" ||
          profile?.subscription_status !== "active" ? (
            <ModeToggle mode={mode} onChange={setMode} />
          ) : null}
        </div>

        {visiblePlans.length > 0 ? (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3 ">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                mode={mode}
                isLoading={loading === plan.id}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            Anda sudah menggunakan paket tertinggi.
          </p>
        )}

        {isActiveSubscription && (
          <div className="mx-auto max-w-3xl">
            <CancelSubscriptionCard
              isLoading={loading === "cancel"}
              onCancel={handleCancelSubscription}
            />
          </div>
        )}
      </div>

      {/* <LinkPaymentModal
        profile={profile}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentModalSuccess}
      /> */}
    </section>
  );
}
