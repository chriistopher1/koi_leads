import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LeadScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="outline">Belum diskor</Badge>;

  const color =
    score >= 80 ? "bg-green-100 text-green-800 border-green-200"
    : score >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200"
    : "bg-red-100 text-red-800 border-red-200";

  return (
    <Badge variant="outline" className={cn("font-semibold", color)}>
      {score}/100
    </Badge>
  );
}