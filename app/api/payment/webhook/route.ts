import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookToken } from "@/lib/xendit";

const PLAN_QUOTAS: Record<string, { limit: number; plan: string }> = {
  pro: { limit: 500, plan: "pro" },
  business: { limit: 2000, plan: "business" },
};

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-callback-token") ?? "";
  if (!verifyWebhookToken(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { id: xenditId, status, metadata } = body;

  await supabase.from("payments").update({ status: status.toLowerCase() }).eq("xendit_invoice_id", xenditId);

  if (status === "PAID" && metadata?.user_id && metadata?.plan) {
    const config = PLAN_QUOTAS[metadata.plan];
    if (config) {
      const endsAt = new Date();
      endsAt.setMonth(endsAt.getMonth() + 1);

      await supabase.from("profiles").update({
        subscription_plan: config.plan,
        subscription_status: "active",
        subscription_ends_at: endsAt.toISOString(),
        scrape_quota_limit: config.limit,
        scrape_quota_used: 0,
      }).eq("id", metadata.user_id);
    }
  }

  return NextResponse.json({ received: true });
}