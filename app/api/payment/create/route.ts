// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/xendit";
import type { BillingCycle } from "@/types/index";

// ─── Pricing ──────────────────────────────────────────────────────────────────
const MONTHLY_PRICES: Record<string, number> = {
  pro: 299000,
  business: 599000,
};

const LIFETIME_PRICES: Record<string, number> = {
  pro: 999000,
  business: 1799000,
};

const DISCOUNT_12MONTH = 0.2;

function resolveAmount(plan: string, cycle: BillingCycle): number | null {
  if (cycle === "1month") return MONTHLY_PRICES[plan] ?? null;
  if (cycle === "12month") {
    const monthly = MONTHLY_PRICES[plan];
    if (!monthly) return null;
    return Math.round(monthly * 12 * (1 - DISCOUNT_12MONTH));
  }
  if (cycle === "lifetime") return LIFETIME_PRICES[plan] ?? null;
  return null;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan, billingCycle } = (await req.json()) as {
      plan: string;
      billingCycle: BillingCycle;
    };

    if (!["pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
    }
    if (!["1month", "12month", "lifetime"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "Siklus pembayaran tidak valid" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, subscription_plan, subscription_status, payment_type")
      .eq("id", user.id)
      .single();

    // Guard: Lifetime user tidak bisa ganti plan
    if (profile?.payment_type === "lifetime") {
      return NextResponse.json(
        { error: "Pengguna Lifetime tidak dapat mengubah paket" },
        { status: 403 }
      );
    }

    // Guard: Active user hanya bisa upgrade ke plan lebih tinggi
    if (
      profile?.subscription_status === "active" &&
      profile?.payment_type === "onetime"
    ) {
      const planOrder = ["free", "pro", "business"];
      const currentIdx = planOrder.indexOf(profile.subscription_plan);
      const newIdx = planOrder.indexOf(plan);
      if (newIdx <= currentIdx) {
        return NextResponse.json(
          { error: "Hanya dapat upgrade ke paket lebih tinggi" },
          { status: 403 }
        );
      }
    }

    const amount = resolveAmount(plan, billingCycle);
    if (!amount) {
      return NextResponse.json(
        { error: "Harga tidak ditemukan" },
        { status: 400 }
      );
    }

    // Upsert subscription record
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const paymentType = billingCycle === "lifetime" ? "lifetime" : "onetime";

    let subscriptionId: string;

    if (!existingSubscription) {
      const { data: newSub, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan,
          payment_type: paymentType,
          billing_cycle: billingCycle,
          status: "pending",
        })
        .select("id")
        .single();

      if (subError || !newSub) {
        return NextResponse.json(
          { error: "Gagal membuat data subscription" },
          { status: 500 }
        );
      }
      subscriptionId = newSub.id;
    } else {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan,
          payment_type: paymentType,
          billing_cycle: billingCycle,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Gagal memperbarui data subscription" },
          { status: 500 }
        );
      }
      subscriptionId = existingSubscription.id;
    }

    const name = profile?.full_name ?? "User";

    const invoice = await createInvoice({
      userId: user.id,
      plan,
      amount,
      email: user.email!,
      name,
      paymentType,
      subscriptionId,
    });

    if (!invoice?.id) {
      return NextResponse.json(
        { error: "Gagal membuat invoice Xendit" },
        { status: 500 }
      );
    }

    await supabase.from("payments").insert({
      user_id: user.id,
      xendit_invoice_id: invoice.id,
      amount,
      currency: "IDR",
      plan,
      status: "pending",
      payment_type: paymentType,
      billing_cycle: billingCycle,
      subscription_id: subscriptionId,
    });

    await supabase
      .from("subscriptions")
      .update({ xendit_immediate_invoice_id: invoice.id })
      .eq("id", subscriptionId);

    return NextResponse.json({ invoiceUrl: invoice.invoice_url });
  } catch (error) {
    console.error("[payment/create]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}