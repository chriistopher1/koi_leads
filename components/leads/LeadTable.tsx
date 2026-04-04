"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Lead } from "@/types";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Phone, Globe, Loader2 } from "lucide-react";

export function LeadTable({ leads }: { leads: Lead[] }) {
  const [scoring, setScoring] = useState<string | null>(null);

  async function handleScore(leadId: string) {
    setScoring(leadId);
    try {
      const res = await fetch("/api/leads/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Skor: ${data.score}/100 — ${data.reason}`);
        window.location.reload();
      } else {
        toast.error(data.error);
      }
    } finally {
      setScoring(null);
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Bisnis</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Kota</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Skor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <Link href={`/leads/${lead.id}`} className="text-primary hover:underline">
                  {lead.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{lead.category ?? "-"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{lead.city ?? "-"}</TableCell>
              <TableCell>
                {lead.rating ? (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {lead.rating} ({lead.review_count})
                  </span>
                ) : "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {lead.phone && <Phone className="h-3.5 w-3.5 text-green-600" />}
                  {lead.website && <Globe className="h-3.5 w-3.5 text-blue-600" />}
                </div>
              </TableCell>
              <TableCell><LeadScoreBadge score={lead.score} /></TableCell>
              <TableCell>
                <Badge variant="outline">{lead.status}</Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScore(lead.id)}
                  disabled={scoring === lead.id}
                >
                  {scoring === lead.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Skor AI"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}