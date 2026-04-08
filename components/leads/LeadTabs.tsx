// components/leads/LeadTabs.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { LeadTable } from "./LeadTable";
import type { Lead } from "@/types";
import { LeadFilters } from "./LeadFilter";

export function LeadTabs({ leads }: { leads: Lead[] }) {
  const [statusFilter, setStatusFilter] = useState<Lead["status"]>("new");
  const [scoreFilter, setScoreFilter] = useState<"all" | "70+" | "50-69" | "below-50">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [search, setSearch] = useState<string>("");

  const filtered = leads
    .filter((l) => l.status === statusFilter)
    .filter((l) => {
      if (!search) return true;
      return l.name.toLowerCase().includes(search.toLowerCase());
    })
    .filter((l) => {
      const s = l.score ?? 0;
      if (scoreFilter === "all") return true;
      if (scoreFilter === "70+") return s >= 70;
      if (scoreFilter === "50-69") return s >= 50 && s < 70;
      return s < 50;
    })
    .filter((l) => {
      if (categoryFilter === "all") return true;
      return l.category === categoryFilter;
    });

  const uniqueCategories = Array.from(new Set(leads.map(l => l.category).filter(Boolean) as string[]));

  return (
    <div className="space-y-4">
      <LeadFilters
        scoreFilter={scoreFilter}
        setScoreFilter={setScoreFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        uniqueCategories={uniqueCategories}
        search={search}
        setSearch={setSearch}
      />

      <Tabs value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as any)}>
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="qualified">Qualified</TabsTrigger>
          <TabsTrigger value="disqualified">Disqualified</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <LeadTable leads={filtered} status="new" />
        </TabsContent>

        <TabsContent value="qualified" className="mt-4">
          <LeadTable leads={filtered} status="qualified" />
        </TabsContent>

        <TabsContent value="disqualified" className="mt-4">
          <LeadTable leads={filtered} status="disqualified" />
        </TabsContent>
      </Tabs>
    </div>
  );
}