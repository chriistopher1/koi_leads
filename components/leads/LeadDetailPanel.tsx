"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import type { Lead, OutreachDraft } from "@/types";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Telescope,
  Phone,
  Globe,
  Star,
  MapPin,
  Loader2,
} from "lucide-react";
import { DraftMessageModal } from "../outreach/DraftMessageModal";
import Image from "next/image";

export function LeadDetailPanel({
  lead,
  drafts,
}: {
  lead: Lead;
  drafts: OutreachDraft[];
}) {
  const [scoring, setScoring] = useState(false);
  const [draftType, setDraftType] = useState<"email" | "instagram_dm" | null>(
    null,
  );
  const [currentLead, setCurrentLead] = useState(lead);

  async function handleScore() {
    setScoring(true);
    const res = await fetch("/api/leads/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentLead((prev) => ({
        ...prev,
        score: data.score,
        score_reason: data.reason,
      }));
      toast.success("Skor berhasil diperbarui");
    }
    setScoring(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentLead.name}
        description={currentLead.category ?? ""}
      >
        <div className="flex gap-2">
          {/* <Button variant="outline" onClick={handleScore} disabled={scoring}>
            {scoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Skor Ulang
          </Button> */}
          <Button variant="outline" onClick={() => setDraftType("email")}>
            <Mail className="h-4 w-4 mr-2" /> Draft Email
          </Button>
          <Button onClick={() => setDraftType("instagram_dm")}>
            <Telescope className="h-4 w-4 mr-2" /> Draft DM
          </Button>
        </div>
      </PageHeader>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Bisnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Image
                src="/app_logo.png"
                alt="KoiLeads Logo"
                width={62}
                height={62}
              />
            </div>
            {currentLead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${currentLead.phone}`}
                  className="text-primary hover:underline"
                >
                  {currentLead.phone}
                </a>
              </div>
            )}
            {currentLead.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={currentLead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {currentLead.website}
                </a>
              </div>
            )}
            {currentLead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${currentLead.email}`}
                  className="text-primary hover:underline"
                >
                  {currentLead.email}
                </a>
              </div>
            )}
            {currentLead.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>
                  {currentLead.rating}/5 ({currentLead.review_count} ulasan)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skor AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <LeadScoreBadge score={currentLead.score} />
            {lead.score_reason && (
              <div className="mt-2 space-y-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {lead.score_reason
                  .split("•")
                  .filter(Boolean)
                  .map((line, i) => (
                    <Fragment key={i}>
                      • {line.trim()}
                      <br />
                    </Fragment>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {drafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Draft Pesan Sebelumnya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {drafts.map((d) => (
              <div key={d.id} className="border rounded-md p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {d.type === "email" ? "Email" : "Instagram DM"}
                  </Badge>
                  {d.subject && (
                    <span className="text-sm font-medium">{d.subject}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {d.body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {draftType && (
        <DraftMessageModal
          leadId={lead.id}
          type={draftType}
          onClose={() => setDraftType(null)}
        />
      )}
    </div>
  );
}
