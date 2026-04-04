import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { createClient } from "@/lib/supabase/server";
import { Users, Target, TrendingUp, Send } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ count: totalLeads }, { count: newLeads }, { count: contacted }, { data: profile }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "new"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "contacted"),
    supabase.from("profiles").select("scrape_quota_used, scrape_quota_limit, subscription_plan").eq("id", user!.id).single(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Selamat datang kembali! Berikut ringkasan aktivitas Anda." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Leads" value={totalLeads ?? 0} icon={Users} />
        <StatsCard title="Lead Baru" value={newLeads ?? 0} icon={Target} />
        <StatsCard title="Sudah Dihubungi" value={contacted ?? 0} icon={Send} />
        <StatsCard
          title="Kuota Scraping"
          value={`${profile?.scrape_quota_used ?? 0}/${profile?.scrape_quota_limit ?? 0}`}
          icon={TrendingUp}
          description={`Paket: ${profile?.subscription_plan?.toUpperCase() ?? "FREE"}`}
        />
      </div>
    </div>
  );
}