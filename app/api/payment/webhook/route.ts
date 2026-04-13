// app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookToken } from "@/lib/xendit";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_QUOTAS: Record<string, number> = {
  pro: 1000,
  business: 3000,
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * Webhook menangani satu event utama:
 * - invoice.paid : One-time payment (1month, 12month, lifetime)
 *
 * Semua pembayaran kini melalui Xendit Invoice (bukan Recurring Plan).
 * Durasi aktif dan logika reset quota ditentukan dari billing_cycle
 * yang disimpan di tabel payments.
 */
export async function POST(req: NextRequest) {
  console.log("============ WEBHOOK CALLED ============");
  try {
    const token = req.headers.get("x-callback-token") ?? "";
    if (!verifyWebhookToken(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = getSupabase();
    const body = await req.json();
    const eventType: string = body?.event ?? "";

    console.log("[webhook] event:", eventType, JSON.stringify(body, null, 2));

    if (eventType === "invoice.paid" || body?.status === "PAID") {
      await handleInvoicePaid(supabase, body);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleInvoicePaid(
  supabase: ReturnType<typeof getSupabase>,
  body: Record<string, unknown>
) {
  const xenditId = body.id as string;
  if (!xenditId) return;

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("user_id, plan, payment_type, billing_cycle, subscription_id")
    .eq("xendit_invoice_id", xenditId)
    .single();

  if (paymentError || !payment) {
    console.error("[webhook] payment not found for xendit_invoice_id:", xenditId);
    return;
  }

  const { user_id: userId, plan, payment_type, billing_cycle, subscription_id } = payment;
  if (!userId || !plan) return;

  // Mark payment as paid
  await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("xendit_invoice_id", xenditId);

  const now = new Date();
  const { endsAt, cycleResetsAt } = resolveSubscriptionDates(now, billing_cycle);

  // Update subscription record
  if (subscription_id) {
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: endsAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", subscription_id);
  }

  // Update profile
  await supabase
    .from("profiles")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      subscription_ends_at: endsAt.toISOString(),
      scrape_quota_limit: PLAN_QUOTAS[plan] ?? 500,
      scrape_quota_used: 0,
      payment_type,
      ...(cycleResetsAt && {
        subscription_cycle_resets_at: cycleResetsAt.toISOString(),
      }),
    })
    .eq("id", userId);

  console.log(`[webhook] Activated ${plan} / ${billing_cycle} for user ${userId} until ${endsAt}`);
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function resolveSubscriptionDates(
  from: Date,
  billingCycle: string
): { endsAt: Date; cycleResetsAt: Date | null } {
  const endsAt = new Date(from);

  if (billingCycle === "1month") {
    endsAt.setMonth(endsAt.getMonth() + 1);
    return { endsAt, cycleResetsAt: null };
  }

  if (billingCycle === "12month") {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
    // First monthly quota reset = 1 month from now
    const cycleResetsAt = new Date(from);
    cycleResetsAt.setMonth(cycleResetsAt.getMonth() + 1);
    return { endsAt, cycleResetsAt };
  }

  if (billingCycle === "lifetime") {
    endsAt.setFullYear(endsAt.getFullYear() + 100);
    // Lifetime: reset quota tiap bulan — cycleResetsAt = 1 bulan dari sekarang
    const cycleResetsAt = new Date(from);
    cycleResetsAt.setMonth(cycleResetsAt.getMonth() + 1);
    return { endsAt, cycleResetsAt };
  }

  endsAt.setMonth(endsAt.getMonth() + 1);
  return { endsAt, cycleResetsAt: null };
}