import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelRecurringPlan } from "@/lib/xendit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("payment_type, subscription_status")
      .eq("id", user.id)
      .single();

    if (profile?.payment_type !== "subscription") {
      return NextResponse.json({ error: "Hanya berlaku untuk paket langganan bulanan" }, { status: 400 });
    }

    if (profile?.subscription_status !== "active") {
      return NextResponse.json({ error: "Tidak ada langganan aktif" }, { status: 400 });
    }

    // Ambil subscription aktif
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, xendit_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!subscription?.xendit_subscription_id) {
      return NextResponse.json({ error: "Data langganan tidak ditemukan" }, { status: 404 });
    }

    // Cancel di Xendit
    await cancelRecurringPlan(subscription.xendit_subscription_id);

    // Update DB
    await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    await supabase
      .from("profiles")
      .update({ subscription_status: "cancelled" })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[payment/cancel]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}