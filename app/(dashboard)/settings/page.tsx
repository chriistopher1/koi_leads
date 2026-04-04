import { createClient } from "@/lib/supabase/server";
import { PricingSection } from "@/components/landing/PricingSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div className="space-y-8">
      <PageHeader title="Pengaturan & Langganan" description="Kelola akun dan paket berlangganan Anda." />
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paket Aktif</span>
            <Badge>{profile?.subscription_plan?.toUpperCase()}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status Langganan</span>
            <Badge variant={profile?.subscription_status === "active" ? "default" : "secondary"}>
              {profile?.subscription_status}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kuota Scraping</span>
            <span>{profile?.scrape_quota_used} / {profile?.scrape_quota_limit}</span>
          </div>
        </CardContent>
      </Card>
      <PricingSection />
    </div>
  );
}