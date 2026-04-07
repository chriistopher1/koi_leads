// components/leads/LeadFilters.tsx
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ScoreFilter = "all" | "70+" | "50-69" | "below-50";

export function LeadFilters({
  scoreFilter,
  setScoreFilter,
  search,
  setSearch,
}: {
  scoreFilter: ScoreFilter;
  setScoreFilter: (v: ScoreFilter) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama bisnis…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-sm"
        />
      </div>

      <Select value={scoreFilter} onValueChange={(v) => setScoreFilter(v as any)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Skor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua skor</SelectItem>
          <SelectItem value="70+">70+</SelectItem>
          <SelectItem value="50-69">50–69</SelectItem>
          <SelectItem value="below-50">Di bawah 50</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}