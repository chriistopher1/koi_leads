// components/leads/LeadViewDialog.tsx
"use client";

import { Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, Mail, Phone, Globe, BadgeCheck } from "lucide-react";
import type { Lead } from "@/types";
import { LeadScoreBadge } from "./LeadScoreBadge";

export function LeadViewDialog({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!lead) return null;

  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-lg">
        <div className="flex h-[85vh] max-h-[85vh] flex-col">
          <DialogHeader>
            <DialogTitle className="text-primary text-2xl">{lead.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Rincian skor dan kontak untuk lead ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-6">
              {/* Lead score */}
              <div className="">
                <h4 className="text-sm font-medium mb-2">Skor Lead</h4>
                <LeadScoreBadge score={lead.score} showLabel />
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
              </div>

              {/* Contact info */}
              <div>
                <h4 className="text-sm font-medium mb-2">Kontak & Info</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Address:</span>{" "}
                    {lead.address ?? "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kota:</span>{" "}
                    {lead.city ?? "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rating:</span>{" "}
                    {lead.rating ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        {lead.rating} ({lead.review_count})
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {lead.email && (
                      <Badge variant="secondary" className="gap-1">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </Badge>
                    )}
                    {lead.phone && (
                      <Badge variant="secondary" className="gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </Badge>
                    )}
                    {lead.website && (
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="h-3 w-3" />
                        {new URL(lead.website).hostname}
                      </Badge>
                    )}
                    {lead.instagram && (
                      <Badge variant="secondary" className="gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        {lead.instagram.replace(
                          /^https?:\/\/(?:www\.)?instagram\.com\//,
                          "",
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
