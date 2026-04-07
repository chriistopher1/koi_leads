// app/leads/LeadsPage.tsx
import { createClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LeadTabs } from "@/components/leads/LeadTabs";
import type { Lead } from "@/types";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user!.id)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const enrichedLeads =
    leads?.map((lead) => ({ ...lead, status: lead.status as Lead["status"] })) ??
    [];

  return (
    <div className="space-y-6">
      <PageHeader title="Daftar Leads" description={`${enrichedLeads.length} lead ditemukan`}>
        <Button asChild>
          <Link href="/scraper">+ Scrape Baru</Link>
        </Button>
      </PageHeader>

      {enrichedLeads.length > 0 ? (
        <LeadTabs leads={enrichedLeads} />
      ) : (
        <EmptyState
          icon={MapPin}
          title="Belum ada lead"
          description="Mulai scraping Google Maps untuk menemukan leads potensial Anda."
          action={{ label: "Mulai Scraping", href: "/scraper" }}
        />
      )}
    </div>
  );
}