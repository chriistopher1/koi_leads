import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookToken } from "@/lib/xendit";

const PLAN_QUOTAS: Record<string, number> = {
  pro: 500,
  business: 2000,
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Webhook ini menangani 3 event type dari Xendit:
 * 1. invoice.paid              — Lifetime Deal berhasil
 * 2. recurring.cycle.succeeded — Cycle subscription berhasil
 * 3. recurring.cycle.failed    — Cycle subscription gagal
 *
 * FIX: Xendit does NOT return metadata in webhook callbacks by design.
 * All contextual data (userId, plan, subscriptionId, paymentType) is
 * resolved from the local DB using xendit_invoice_id / reference_id.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-callback-token") ?? "";
    if (!verifyWebhookToken(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = getSupabase();
    const body = await req.json();
    const eventType: string = body?.event ?? "";

    console.log("[webhook] event:", eventType, JSON.stringify(body, null, 2));

    // ── 1. Lifetime Deal — invoice paid ──────────────────────────────────
    if (eventType === "invoice.paid" || body?.status === "PAID") {
      await handleInvoicePaid(supabase, body);
      return NextResponse.json({ received: true });
    }

    // ── 2. Subscription cycle sukses ─────────────────────────────────────
    if (eventType === "recurring.cycle.succeeded") {
      await handleCycleSucceeded(supabase, body);
      return NextResponse.json({ received: true });
    }

    // ── 3. Subscription cycle gagal ──────────────────────────────────────
    if (eventType === "recurring.cycle.failed") {
      await handleCycleFailed(supabase, body);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: Invoice PAID (Lifetime)
// ─────────────────────────────────────────────────────────────────────────────
async function handleInvoicePaid(
  supabase: ReturnType<typeof getSupabase>,
  body: Record<string, unknown>,
) {
  const xenditId = body.id as string;

  // FIX: Resolve context from DB — metadata is not in Xendit invoice callbacks
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("user_id, plan, payment_type, subscription_id")
    .eq("xendit_invoice_id", xenditId)
    .single();

  console.log("payment : ", payment);

  if (paymentError || !payment) {
    console.error(
      "[webhook] handleInvoicePaid: payment not found for xendit_invoice_id",
      xenditId,
    );
    return;
  }

  const {
    user_id: userId,
    plan,
    payment_type: paymentType,
    subscription_id: subscriptionId,
  } = payment;

  // Only process Lifetime invoices here
  if (paymentType !== "lifetime") return;
  if (!userId || !plan) return;

  await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("xendit_invoice_id", xenditId);

  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setMonth(now.getMonth() + 1);

  console.log("endsAt : ", endsAt);
  console.log("subscriptionId : ", subscriptionId);

  if (subscriptionId) {
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: endsAt.toISOString(),
      })
      .eq("id", subscriptionId);
  }

  console.log("userId : ", userId);

  await supabase
    .from("profiles")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      subscription_ends_at: endsAt.toISOString(),
      scrape_quota_limit: PLAN_QUOTAS[plan] ?? 500,
      scrape_quota_used: 0,
      payment_type: "lifetime",
    })
    .eq("id", userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: Recurring Cycle Succeeded (Subscription)
// ─────────────────────────────────────────────────────────────────────────────
async function handleCycleSucceeded(
  supabase: ReturnType<typeof getSupabase>,
  body: Record<string, unknown>,
) {
  // FIX: reference_id on recurring webhook = the recurring plan ID stored
  // as xendit_subscription_id in subscriptions table
  const recurringPlanId = body.reference_id as string | undefined;

  if (!recurringPlanId) {
    console.error("[webhook] handleCycleSucceeded: missing reference_id");
    return;
  }

  // Resolve context from DB via xendit_subscription_id
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan")
    .eq("xendit_subscription_id", recurringPlanId)
    .single();

  if (subError || !subscription) {
    console.error(
      "[webhook] handleCycleSucceeded: subscription not found for reference_id",
      recurringPlanId,
    );
    return;
  }

  const { id: subscriptionId, user_id: userId, plan } = subscription;

  if (!userId || !plan) return;

  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setMonth(now.getMonth() + 1);

  const cycleAmount = body.cycle_amount as number | undefined;
  if (cycleAmount) {
    await supabase.from("payments").insert({
      user_id: userId,
      xendit_invoice_id: `${recurringPlanId}_cycle_${Date.now()}`,
      amount: cycleAmount,
      currency: "IDR",
      plan,
      status: "paid",
      payment_type: "subscription",
      subscription_id: subscriptionId,
    });
  }

  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: endsAt.toISOString(),
    })
    .eq("id", subscriptionId);

  await supabase
    .from("profiles")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      subscription_ends_at: endsAt.toISOString(),
      scrape_quota_limit: PLAN_QUOTAS[plan] ?? 500,
      scrape_quota_used: 0,
      payment_type: "subscription",
    })
    .eq("id", userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: Recurring Cycle Failed (Subscription)
// ─────────────────────────────────────────────────────────────────────────────
async function handleCycleFailed(
  supabase: ReturnType<typeof getSupabase>,
  body: Record<string, unknown>,
) {
  // FIX: Same pattern — resolve from DB via xendit_subscription_id
  const recurringPlanId = body.reference_id as string | undefined;

  if (!recurringPlanId) {
    console.error("[webhook] handleCycleFailed: missing reference_id");
    return;
  }

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("xendit_subscription_id", recurringPlanId)
    .single();

  if (subError || !subscription) {
    console.error(
      "[webhook] handleCycleFailed: subscription not found for reference_id",
      recurringPlanId,
    );
    return;
  }

  const { id: subscriptionId, user_id: userId } = subscription;

  if (!userId) return;

  await supabase
    .from("subscriptions")
    .update({ status: "failed" })
    .eq("id", subscriptionId);

  await supabase
    .from("profiles")
    .update({ subscription_status: "failed" })
    .eq("id", userId);
}
