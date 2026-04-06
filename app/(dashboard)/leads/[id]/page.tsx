import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const realParams = await params;

  const { data: lead } = await supabase.from("leads").select("*").eq("id", realParams.id).eq("user_id", user!.id).single();
  if (!lead) notFound();

  const { data: drafts } = await supabase.from("outreach_drafts").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false });

  return <LeadDetailPanel lead={lead} drafts={drafts ?? []} />;
}