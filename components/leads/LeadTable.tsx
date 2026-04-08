// components/leads/LeadTable.tsx
"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Lead } from "@/types";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { Button } from "@/components/ui/button";
import { Command } from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Globe,
  Mail,
  SquareStop,
  Loader2,
  Eye,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { LeadViewDialog } from "./LeadViewDialog";
import { createClient } from "@/lib/supabase/client";

type LeadTableStatus = "new" | "qualified" | "disqualified";

export function LeadTable({
  leads,
  status,
}: {
  leads: Lead[];
  status: LeadTableStatus;
}) {
  const router = useRouter();
  const [scoring, setScoring] = useState<string | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  const supabase = createClient();

  const handleStatusUpdate = async (
    leadId: string,
    newStatus: "new" | "qualified" | "disqualified",
  ) => {
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast.error("Gagal mengubah status.");
      return;
    }

    toast.success(
      newStatus === "qualified"
        ? "Lead telah disetujui."
        : newStatus === "new"
          ? "Lead direstore."
          : "Lead telah diberi status disqualified.",
    );
    router.refresh();
  };

  // async function handleScore(leadId: string) {
  //   setScoring(leadId);
  //   try {
  //     const res = await fetch("/api/leads/score", {
  //       method: "POST",
  //       headers: { "Content-Type": application/json" },
  //       body: JSON.stringify({ leadId }),
  //     });
  //     const data = await res.json();
  //     if (res.ok) {
  //       toast.success(`Skor: ${data.score}/100 — ${data.reason}`);
  //       router.refresh();
  //     } else {
  //       toast.error(data.error);
  //     }
  //   } finally {
  //     setScoring(null);
  //   }
  // }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bisnis</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>Kota</TableHead>
            <TableHead>Skor</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                Tidak ada lead pada tab ini.
              </TableCell>
            </TableRow>
          )}

          {leads.map((lead) => (
            <TableRow key={lead.id}>
              {/* Business name */}
              <TableCell className="font-medium">
                {/* <Link
                  href={`/leads/${lead.id}`}
                  className="text-primary hover:underline"
                >
                  {lead.name}
                </Link> */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewLead(lead)}
                  className="text-xs"
                >
                  {lead.name}
                </Button>
              </TableCell>
              {/* Niche */}
              <TableCell className="text-sm text-muted-foreground">
                {lead.category ?? "-"}
              </TableCell>
              {/* City */}
              <TableCell className="text-sm text-muted-foreground">
                {lead.city ?? "-"}
              </TableCell>
              {/* Score badge */}
              <TableCell>
                <LeadScoreBadge score={lead.score} />
              </TableCell>
              {/* Contact icons */}
            
              <TableCell>
                <div className="flex gap-1">
                  {lead.email ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex hover:no-underline focus-visible:no-underline"
                        >
                          <Mail
                            className="text-primary hover:text-primary/80 h-3.5 w-3.5 transition cursor-pointer"
                            aria-label="Email"
                          />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lead.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}

                  {lead.phone ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}
                          className="inline-flex hover:no-underline focus-visible:no-underline"
                        >
                          <Phone
                            className="text-primary hover:text-primary/80 h-3.5 w-3.5 transition cursor-pointer"
                            aria-label="Phone"
                          />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lead.phone}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}

                  {lead.website ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={
                            lead.website.startsWith("http")
                              ? lead.website
                              : `https://${lead.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex hover:no-underline focus-visible:no-underline"
                        >
                          <Globe
                            className="text-primary hover:text-primary/80 h-3.5 w-3.5 transition cursor-pointer"
                            aria-label="Website"
                          />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lead.website}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}

                  {lead.instagram ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`https://www.instagram.com/${lead.instagram.replace(
                            "@",
                            "",
                          )}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex hover:no-underline focus-visible:no-underline"
                        >
                          <SquareStop
                            className="text-primary hover:text-primary/80 h-3.5 w-3.5 transition cursor-pointer"
                            aria-label="Instagram"
                          />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lead.instagram}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SquareStop className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </div>
              </TableCell>
              {/* Status badge */}
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    lead.status === "new"
                      ? "text-muted-foreground"
                      : lead.status === "qualified"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-destructive/15 text-destructive border-destructive/20"
                  }
                >
                  {lead.status}
                </Badge>
              </TableCell>
              {/* Actions */}
              <TableCell>
                <div className="flex gap-1">
                  {status === "new" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await handleStatusUpdate(lead.id, "qualified");
                        }}
                        className="gap-1 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await handleStatusUpdate(lead.id, "disqualified");
                        }}
                        className="gap-1 text-xs"
                      >
                        <X className="h-3.5 w-3.5" />
                        Skip
                      </Button>
                    </>
                  )}

                  {status === "disqualified" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await handleStatusUpdate(lead.id, "new");
                      }}
                      className="gap-1 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewLead(lead)}
                    className="text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View dialog */}
      <LeadViewDialog
        lead={viewLead}
        onOpenChange={(open) => !open && setViewLead(null)}
      />
    </div>
  );
}
