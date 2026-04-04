import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Telescope } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function OutreachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: drafts } = await supabase
    .from("outreach_drafts")
    .select("*, leads(name, city, category)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Pesan Outreach" description="Semua draft pesan yang telah dibuat oleh AI." />
      <div className="grid gap-4">
        {drafts?.map((draft) => (
          <Card key={draft.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {(draft.leads as { name: string })?.name}
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  {draft.type === "email" ? <Mail className="h-3 w-3" /> : <Telescope className="h-3 w-3" />}
                  {draft.type === "email" ? "Email" : "Instagram DM"}
                </Badge>
              </div>
              {draft.subject && <p className="text-sm text-muted-foreground">Subjek: {draft.subject}</p>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{draft.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}