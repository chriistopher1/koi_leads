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
}

export async function createInvoice(params: CreateInvoiceParams) {
  const res = await fetch(`${XENDIT_BASE}/v2/invoices`, {
    method: "POST",
    headers: xenditHeaders(),
    body: JSON.stringify({
      external_id: `koileads_${params.userId}_${Date.now()}`,
      amount: params.amount,
      currency: "IDR",
      payer_email: params.email,
      description: `KoiLeads - Paket ${params.plan}`,
      success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment=failed`,
      customer: { given_names: params.name, email: params.email },
      items: [
        { name: `Paket ${params.plan}`, quantity: 1, price: params.amount },
      ],
      metadata: { user_id: params.userId, plan: params.plan },
    }),
  });

  return res.json();
}

export function verifyWebhookToken(token: string): boolean {
  return token === process.env.XENDIT_WEBHOOK_TOKEN;
}
