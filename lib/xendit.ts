const XENDIT_BASE = "https://api.xendit.co";

function xenditHeaders() {
  const encoded = Buffer.from(`${process.env.XENDIT_API_KEY}:`).toString("base64");
  return {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
  };
}

export interface CreateInvoiceParams {
  userId: string;
  plan: string;
  amount: number;
  email: string;
  name: string;
  paymentType: "lifetime" | "subscription";
  subscriptionId?: string;
}

export interface CreateRecurringPlanParams {
  userId: string;
  plan: string;
  amount: number;
  email: string;
  name: string;
  subscriptionId: string;
}

/** One-time invoice — dipakai untuk Lifetime Deal */
export async function createInvoice(params: CreateInvoiceParams) {
  const res = await fetch(`${XENDIT_BASE}/v2/invoices`, {
    method: "POST",
    headers: xenditHeaders(),
    body: JSON.stringify({
      external_id: `koileads_${params.userId}_${Date.now()}`,
      amount: params.amount,
      currency: "IDR",
      payer_email: params.email,
      description: `KoiLeads - Paket ${params.plan} (Lifetime)`,
      success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment=failed`,
      customer: { given_names: params.name, email: params.email },
      items: [{ name: `Paket ${params.plan} Lifetime`, quantity: 1, price: params.amount }],
      metadata: {
        user_id: params.userId,
        plan: params.plan,
        payment_type: "lifetime",
        subscription_id: params.subscriptionId,
      },
    }),
  });
  return res.json();
}

/**
 * Xendit Recurring Plan — dipakai untuk Normal Subscription.
 * Menggunakan endpoint /recurring/plans dengan immediate_action_type FULL_AMOUNT
 * agar tagihan pertama langsung diproses.
 */
export async function createRecurringPlan(params: CreateRecurringPlanParams) {
  const res = await fetch(`${XENDIT_BASE}/recurring/plans`, {
    method: "POST",
    headers: xenditHeaders(),
    body: JSON.stringify({
      reference_id: `koileads_sub_${params.subscriptionId}`,
      customer_id: null,
      recurring_action: "PAYMENT",
      currency: "IDR",
      amount: params.amount,
      payment_methods: [],
      schedule: {
        reference_id: `schedule_${params.subscriptionId}`,
        interval: "MONTH",
        interval_count: 1,
        anchor_date: new Date().toISOString(),
        retry_interval: "DAY",
        retry_count: 3,
        total_recurrence: null,
        failed_attempt_notifications: [1, 3],
      },
      immediate_action_type: "FULL_AMOUNT",
      notification_config: {
        locale: "id",
        payment_notification: ["EMAIL"],
      },
      failed_cycle_action: "STOP",
      metadata: {
        user_id: params.userId,
        plan: params.plan,
        payment_type: "subscription",
        subscription_id: params.subscriptionId,
      },
      description: `KoiLeads - Paket ${params.plan} Bulanan`,
      success_return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      failure_return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment=failed`,
      customer: {
        reference_id: params.userId,
        given_names: params.name,
        email: params.email,
      },
    }),
  });
  return res.json();
}

/** Cancel recurring plan di Xendit */
export async function cancelRecurringPlan(xenditSubscriptionId: string) {
  const res = await fetch(`${XENDIT_BASE}/recurring/plans/${xenditSubscriptionId}/deactivate`, {
    method: "POST",
    headers: xenditHeaders(),
  });
  return res.json();
}

export function verifyWebhookToken(token: string): boolean {
  return token === process.env.XENDIT_WEBHOOK_TOKEN;
}