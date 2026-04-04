import { createClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { LeadTable } from "@/components/leads/LeadTable";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user!.id)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Daftar Leads" description={`${leads?.length ?? 0} lead ditemukan`}>
        <Button asChild>
          <Link href="/scraper">+ Scrape Baru</Link>
        </Button>
      </PageHeader>
      {leads && leads.length > 0 ? (
        <LeadTable leads={leads} />
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