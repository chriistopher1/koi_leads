// app/api/outreach/draft/route.ts
import { NextResponse } from "next/server";
import { draftOutreach } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead_id, type } = body;

    if (!lead_id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get lead data
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Generate draft using OpenRouter
    const result = await draftOutreach(lead, type);

    // Insert into outreach_drafts
    const { data: inserted, error } = await supabase
      .from("outreach_drafts")
      .insert({
        user_id: user.id,
        lead_id,
        type,
        subject: result.subject ?? null,
        body: result.body,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, draft: inserted });
  } catch (err: any) {
    console.error("Draft API error:", err);
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}