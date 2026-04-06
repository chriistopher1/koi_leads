const XENDIT_BASE = "https://api.xendit.co";

function xenditHeaders() {
  const encoded = Buffer.from(`${process.env.XENDIT_API_KEY}:`).toString(
    "base64",
  );
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
  customerId: string;// Optional, only if you want to set a default payment method for the recurring plan
}

export interface CreateCustomerParams {
  userId: string;
  email: string;
  name: string;
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
      items: [
        {
          name: `Paket ${params.plan} Lifetime`,
          quantity: 1,
          price: params.amount,
        },
      ],
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
 * Membuat Xendit Customer dan mengembalikan customer_id (cust-xxx).
 * customer_id ini wajib disertakan saat membuat Recurring Plan.
 */
export async function createXenditCustomer(params: CreateCustomerParams) {
  const res = await fetch(`${XENDIT_BASE}/customers`, {
    method: "POST",
    headers: xenditHeaders(),
    body: JSON.stringify({
      reference_id: params.userId,
      type: "INDIVIDUAL",
      individual_detail: {
        given_names: params.name,
      },
      email: params.email,
    }),
  });
  return res.json();
}

export async function getOrCreateXenditCustomer({
  userId,
  email,
  name,
  supabase,
}: {
  userId: string;
  email: string;
  name: string;
  supabase: any;
}) {
  // 1. Check DB first
  const { data: profile } = await supabase
    .from("profiles")
    .select("xendit_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.xendit_customer_id) {
    return profile.xendit_customer_id;
  }

  // 2. Create new customer
  const customer = await createXenditCustomer({
    userId,
    email,
    name,
  });

  // 🔥 Handle duplicate error gracefully
  if (customer?.error_code === "DUPLICATE_ERROR") {
    // fallback (optional approach below)
    throw new Error("Customer already exists but not stored in DB");
  }

  if (!customer?.id) {
    throw new Error("Failed to create Xendit customer");
  }

  // 3. Save to DB
  await supabase
    .from("profiles")
    .update({ xendit_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function fetchPaymentMethods(customerId: string) {
  const res = await fetch(`${XENDIT_BASE}/customers/${customerId}/payment_methods`, {
    headers: xenditHeaders(),
  });
  
  const data = await res.json();
  return data.data || []; // Array of {id: "pm_xxx", type: "CARD", ...}
}

/**
 * Xendit Recurring Plan — dipakai untuk Normal Subscription.
 * FIX:
 * 1. Hapus customer_id (null tidak valid — harus string atau tidak ada)
 * 2. Hapus customer object (tidak ada di Recurring Plan API)
 * 3. Ganti retry_count → total_retry, tambah retry_interval_count
 */

export async function createRecurringPlan(params: CreateRecurringPlanParams) {


  const res = await fetch(`${XENDIT_BASE}/recurring/plans`, {
    method: "POST",
    headers: xenditHeaders(),
    body: JSON.stringify({
      reference_id: `koileads_sub_${params.subscriptionId}`,
      customer_id: params.customerId, // FIX: pakai Xendit customer ID
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
        retry_interval_count: 1,
        total_retry: 3,
        failed_attempt_notifications: [1, 3],
      },
      immediate_action_type: "FULL_AMOUNT",
      notification_config: {
        locale: "id",
        recurring_succeeded: ["EMAIL"],
        recurring_failed: ["EMAIL"],
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
    }),
  });
  return res.json();
}

/** Cancel recurring plan di Xendit */
export async function cancelRecurringPlan(xenditSubscriptionId: string) {
  const res = await fetch(
    `${XENDIT_BASE}/recurring/plans/${xenditSubscriptionId}/deactivate`,
    {
      method: "POST",
      headers: xenditHeaders(),
    },
  );
  return res.json();
}

export function verifyWebhookToken(token: string): boolean {
  return token === process.env.XENDIT_WEBHOOK_TOKEN;
}
