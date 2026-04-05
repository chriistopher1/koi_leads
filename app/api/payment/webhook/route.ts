import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookToken } from "@/lib/xendit";

const PLAN_QUOTAS: Record<string, { limit: number; plan: string }> = {
  pro: { limit: 500, plan: "pro" },
  business: { limit: 2000, plan: "business" },
};

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-callback-token") ?? "";
    if (!verifyWebhookToken(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("halo1");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const body = await req.json();
    const { id: xenditId, status, external_id } = body;

    // console.log("body", body);

    // extract user_id from external_id
    let userId: string | null = null;
    let plan: string | null = null;

    if (external_id) {
      const parts = external_id.split("_");
      userId = parts[1]; // koileads_USERID_timestamp
    }

    await supabase
      .from("payments")
      .update({ status: status.toLowerCase() })
      .eq("xendit_invoice_id", xenditId);

    const { data: payment } = await supabase
      .from("payments")
      .select("plan, user_id")
      .eq("xendit_invoice_id", xenditId)
      .single();

    if (payment) {
      userId = payment.user_id;
      plan = payment.plan;
    }

    console.log("payment : ", payment);

    if (status === "PAID" && payment?.user_id && payment?.plan) {
      const config = PLAN_QUOTAS[payment.plan];
      if (config) {
        const now = new Date();
        const endsAt = new Date(now);
        endsAt.setDate(now.getDate() + 30);
        
        console.log("endsAt : ", endsAt);

        await supabase
          .from("profiles")
          .update({
            subscription_plan: config.plan,
            subscription_status: "active",
            subscription_ends_at: endsAt.toISOString(),
            scrape_quota_limit: config.limit,
            scrape_quota_used: 0,
          })
          .eq("id", payment.user_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { received: true, error: "Webhook handled with error" },
      { status: 200 },
    );
  }
}
