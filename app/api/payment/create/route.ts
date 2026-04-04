import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/xendit";

const PLANS: Record<string, number> = {
  pro: 299000,
  business: 799000,
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  const amount = PLANS[plan];
  if (!amount) return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();

  const invoice = await createInvoice({
    userId: user.id,
    plan,
    amount,
    email: user.email!,
    name: profile?.full_name ?? "User",
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    xendit_invoice_id: invoice.id,
    amount,
    currency: "IDR",
    plan,
    status: "pending",
  });

  return NextResponse.json({ invoiceUrl: invoice.invoice_url });
}