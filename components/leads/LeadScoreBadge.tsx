// components/leads/LeadScoreBadge.tsx
import { cn } from "@/lib/utils";

export function LeadScoreBadge({
  score,
  showLabel = false,
}: {
  score: number | null;
  showLabel?: boolean;
}) {
  if (score == null) {
    return <span className="text-muted-foreground text-sm">–</span>;
  }

  const colorClass =
    score >= 70
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 50
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-destructive/15 text-destructive border-destructive/20";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        colorClass
      )}
    >
      {score}/100
      {showLabel && score >= 70 && <span className="text-green-700">• Potensial</span>}
      {showLabel && score >= 50 && score < 70 && <span className="text-yellow-700">• Menjanjikan</span>}
      {showLabel && score < 50 && <span className="text-destructive">• Rendah</span>}
    </span>
  );
}