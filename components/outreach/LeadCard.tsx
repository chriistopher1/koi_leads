// components/outreach/LeadCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadViewDialog } from "@/components/leads/LeadViewDialog";
import { Mail, Telescope, Trash2, FileText } from "lucide-react";
import { Lead } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function LeadCard({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [isDrafting, setIsDrafting] = useState<"email" | "instagram_dm" | null>(
    null,
  );

  const supabase = createClient();

  const handleStatusUpdate = async (leadId: string) => {
    confirm("Apakah Anda yakin ingin membatalkan lead ini?") ||
      toast.error("Batal mengubah status.");

    const { error } = await supabase
      .from("leads")
      .update({ status: "new" })
      .eq("id", leadId);

    // delete all draft associated with this lead
    const { error: deleteError } = await supabase
      .from("outreach_drafts")
      .delete()
      .eq("lead_id", leadId);

    if (error || deleteError) {
      toast.error("Gagal mengubah status.");
      return;
    }

    toast.success("Lead di cancel");
  };

  async function handleDraft(type: "email" | "instagram_dm") {
    if (isDrafting) return; // Prevent double‑click / parallel drafts

    setIsDrafting(type);
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, type }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create draft");
      toast.success(
        `${type === "email" ? "Email" : "DM"} draft created successfully.`,
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDrafting(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-primary">
              {lead.name}
            </CardTitle>
            <Badge variant="secondary" className="capitalize">
              {lead.city ?? "–"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {lead.category ?? "Tanpa kategori"}
          </p>
        </CardHeader>

        <CardContent className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isDrafting !== null}
              onClick={() => handleDraft("email")}
            >
              {isDrafting === "email" && (
                <LoaderIcon className="h-4 w-4 mr-1 animate-spin" />
              )}
              Draft Email
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isDrafting !== null}
              onClick={() => handleDraft("instagram_dm")}
            >
              {isDrafting === "instagram_dm" && (
                <LoaderIcon className="h-4 w-4 mr-1 animate-spin" />
              )}
              Draft IG DM
            </Button>
          </div>

          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
              <FileText className="h-4 w-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleStatusUpdate(lead.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <LeadViewDialog lead={open ? lead : null} onOpenChange={setOpen} />
    </>
  );
}

function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      {...props}
    >
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path d="M12 2v4m0 12v4m0-16a4 4 0 00-4 4m8 0a4 4 0 00-4-4m-4 4h8" />
    </svg>
  );
}
