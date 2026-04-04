import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftOutreach } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId, type } = await req.json();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).eq("user_id", user.id).single();
  if (!lead) return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });

  const draft = await draftOutreach(lead, type);

  await supabase.from("outreach_drafts").insert({
    user_id: user.id,
    lead_id: leadId,
    type,
    subject: draft.subject ?? null,
    body: draft.body,
  });

  return NextResponse.json(draft);
}