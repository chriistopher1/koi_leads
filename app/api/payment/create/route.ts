import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createInvoice,
  createRecurringPlan,
  createXenditCustomer,
  fetchPaymentMethods,
  getOrCreateXenditCustomer,
} from "@/lib/xendit";

const LIFETIME_PRICES: Record<string, number> = {
  pro: 999000,
  business: 2499000,
};

const SUBSCRIPTION_PRICES: Record<string, number> = {
  pro: 299000,
  business: 799000,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // console.log("halo1");

    const { plan, paymentType } = (await req.json()) as {
      plan: string;
      paymentType: "lifetime" | "subscription";
    };

    if (!["pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
    }
    if (!["lifetime", "subscription"].includes(paymentType)) {
      return NextResponse.json(
        { error: "Tipe pembayaran tidak valid" },
        { status: 400 },
      );
    }

    // console.log("halo2");

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, email, subscription_plan, subscription_status, payment_type",
      )
      .eq("id", user.id)
      .single();

    // console.log("halo3");

    // Guard: Lifetime user tidak bisa ganti plan
    if (profile?.payment_type === "lifetime") {
      return NextResponse.json(
        { error: "Pengguna Lifetime tidak dapat mengubah paket" },
        { status: 403 },
      );
    }

    // console.log("halo4");

    // Guard: Subscription user hanya bisa upgrade ke plan lebih tinggi
    if (
      profile?.subscription_status === "active" &&
      profile?.payment_type === "subscription"
    ) {
      const planOrder = ["free", "pro", "business"];
      const currentIdx = planOrder.indexOf(profile.subscription_plan);
      const newIdx = planOrder.indexOf(plan);
      if (newIdx <= currentIdx) {
        return NextResponse.json(
          { error: "Hanya dapat upgrade ke paket lebih tinggi" },
          { status: 403 },
        );
      }
    }

    // console.log("halo5");

    const amount =
      paymentType === "lifetime"
        ? LIFETIME_PRICES[plan]
        : SUBSCRIPTION_PRICES[plan];

    if (!amount) {
      return NextResponse.json(
        { error: "Harga tidak ditemukan" },
        { status: 400 },
      );
    }

    // console.log("halo6");

    // Cari subscription existing milik user
    const { data: existingSubscription, error: existingSubError } =
      await supabase
        .from("subscriptions")
        .select(
          "id, user_id, plan, payment_type, status, xendit_subscription_id, xendit_immediate_invoice_id",
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingSubError) {
      return NextResponse.json(
        { error: "Gagal memeriksa subscription user" },
        { status: 500 },
      );
    }

    let subscription = existingSubscription;

    if (!subscription) {
      const { data: newSubscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan,
          payment_type: paymentType,
          status: "pending",
        })
        .select()
        .single();

      if (subError || !newSubscription) {
        return NextResponse.json(
          { error: "Gagal membuat data subscription" },
          { status: 500 },
        );
      }

      subscription = newSubscription;
    } else {
      const { data: updatedSubscription, error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan,
          payment_type: paymentType,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)
        .select()
        .single();

      if (updateError || !updatedSubscription) {
        return NextResponse.json(
          { error: "Gagal memperbarui data subscription" },
          { status: 500 },
        );
      }

      subscription = updatedSubscription;
    }

    // console.log("halo7");

    if (!subscription) {
      return NextResponse.json(
        { error: "Gagal membuat data subscription" },
        { status: 500 },
      );
    }

    // console.log("halo8");

    const name = profile?.full_name ?? "User";

    if (paymentType === "lifetime") {
      const invoice = await createInvoice({
        userId: user.id,
        plan,
        amount,
        email: user.email!,
        name,
        paymentType: "lifetime",
        subscriptionId: subscription.id,
      });

      if (!invoice?.id) {
        return NextResponse.json(
          { error: "Gagal membuat invoice Xendit" },
          { status: 500 },
        );
      }

      await supabase.from("payments").insert({
        user_id: user.id,
        xendit_invoice_id: invoice.id,
        amount,
        currency: "IDR",
        plan,
        status: "pending",
        payment_type: "lifetime",
        subscription_id: subscription.id,
      });

      // Simpan xendit invoice id ke subscriptions
      await supabase
        .from("subscriptions")
        .update({ xendit_immediate_invoice_id: invoice.id })
        .eq("id", subscription.id);

      return NextResponse.json({ invoiceUrl: invoice.invoice_url });
    }

    // Normal Subscription — gunakan Xendit Recurring
    // FIX: Xendit Recurring Plan wajib punya customer_id (Xendit-generated)
    const xenditCustomerId = await getOrCreateXenditCustomer({
      userId: user.id,
      email: user.email!,
      name,
      supabase,
    });

    console.log("xenditCustomerId : ", xenditCustomerId);

    if (!xenditCustomerId) {
      return NextResponse.json(
        { error: "Gagal membuat customer Xendit" },
        { status: 500 },
      );
    }

    // const paymentMethods = await fetchPaymentMethods(xenditCustomerId);

    // console.log("paymentMethods : ", paymentMethods);

    // if (paymentMethods.length === 0 || !paymentMethods[0]?.id) {
    //   return NextResponse.json(
    //     { error: "Sambungkan payment method dahulu." },
    //     { status: 500 },
    //   );
    // }

    const recurringPlan = await createRecurringPlan({
      userId: user.id,
      plan,
      amount,
      // paymentMethodId: paymentMethods[0].id!, // Pass payment_method_id if exists (for card on file)
      email: user.email!,
      name,
      subscriptionId: subscription.id,
      customerId: xenditCustomerId, // FIX: pass customer_id
    });

    console.log("recurringPlan : ", recurringPlan);

    if (!recurringPlan?.id) {
      return NextResponse.json(
        { error: "Gagal membuat recurring plan Xendit" },
        { status: 500 },
      );
    }

    // Simpan xendit_subscription_id
    await supabase
      .from("subscriptions")
      .update({ xendit_subscription_id: recurringPlan.id })
      .eq("id", subscription.id);

    await supabase.from("payments").insert({
      user_id: user.id,
      xendit_invoice_id: recurringPlan.id,
      amount,
      currency: "IDR",
      plan,
      status: "pending",
      payment_type: "subscription",
      subscription_id: subscription.id,
    });

    // Xendit recurring mengembalikan URL checkout di actions[0].url atau immediate_action.url
    const checkoutUrl =
      recurringPlan?.actions?.find(
        (a: { action: string; url: string }) => a.action === "AUTH",
      )?.url ?? recurringPlan?.immediate_action?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Gagal mendapatkan URL pembayaran" },
        { status: 500 },
      );
    }

    return NextResponse.json({ invoiceUrl: checkoutUrl });
  } catch (error) {
    console.log("[payment/create]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
