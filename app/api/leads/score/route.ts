import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreLead } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await req.json();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).eq("user_id", user.id).single();
  if (!lead) return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });

  const { score, reason } = await scoreLead(lead);
  await supabase.from("leads").update({ score, score_reason: reason }).eq("id", leadId);

  return NextResponse.json({ score, reason });
}