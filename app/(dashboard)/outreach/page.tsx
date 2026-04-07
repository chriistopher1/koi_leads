// app/outreach/page.tsx
import { createClient } from "@/lib/supabase/server";
// import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
// import { Button } from "@/components/ui/button";
// import { LeadViewDialog } from "@/components/leads/LeadViewDialog";
import { Mail, Telescope, Trash2, FileText } from "lucide-react";
import { LeadCard } from "@/components/outreach/LeadCard";

interface Lead {
  id: string;
  name: string;
  category?: string;
  city?: string;
  status: string;
}

interface Draft {
  id: string;
  type: "email" | "instagram_dm";
  subject?: string;
  body: string;
  leads: Lead;
}

export default async function OutreachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch leads that are qualified
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user!.id)
    .eq("status", "qualified")
    .order("created_at", { ascending: false });

  // Fetch drafts created by this user
  const { data: drafts } = await supabase
    .from("outreach_drafts")
    .select("*, leads(id, name, city, category)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Outreach" description="Kelola lead dan draft pesan Anda." />

      <Tabs defaultValue="leads">
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="drafts">Draft</TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4 mt-4">
          {leads?.length === 0 && (
            <p className="text-center text-muted-foreground text-sm">
              Belum ada lead yang dikualifikasi.
            </p>
          )}
          <div className="grid gap-4">
            {leads?.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-4 mt-4">
          {drafts?.length === 0 && (
            <p className="text-center text-muted-foreground text-sm">
              Belum ada draft yang dibuat.
            </p>
          )}
          <div className="grid gap-4">
            {drafts?.map((draft: Draft) => (
              <Card key={draft.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {draft.leads?.name}
                    </CardTitle>

                    <Badge variant="outline" className="flex items-center gap-1">
                      {draft.type === "email"
                        ? <Mail className="h-3 w-3" />
                        : <Telescope className="h-3 w-3" />}
                      {draft.type === "email" ? "Email" : "Instagram DM"}
                    </Badge>
                  </div>
                  {draft.subject && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Subjek: {draft.subject}
                    </p>
                  )}
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {draft.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
