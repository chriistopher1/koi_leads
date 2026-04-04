"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy } from "lucide-react";

interface Props {
  leadId: string;
  type: "email" | "instagram_dm";
  onClose: () => void;
}

export function DraftMessageModal({ leadId, type, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ subject?: string; body: string } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    const res = await fetch("/api/leads/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, type }),
    });
    const data = await res.json();
    if (res.ok) {
      setDraft(data);
    } else {
      toast.error(data.error ?? "Gagal membuat draft");
    }
    setLoading(false);
  }

  function handleCopy() {
    const text = draft?.subject ? `Subjek: ${draft.subject}\n\n${draft.body}` : draft?.body ?? "";
    navigator.clipboard.writeText(text);
    toast.success("Pesan disalin ke clipboard!");
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Draft {type === "email" ? "Email" : "Instagram DM"} — AI
          </DialogTitle>
        </DialogHeader>

        {!draft ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Klik tombol di bawah untuk membuat pesan outreach yang dipersonalisasi menggunakan AI.
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Buat Pesan dengan AI
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {draft.subject && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Subjek</p>
                <p className="text-sm border rounded-md p-2 bg-muted">{draft.subject}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Isi Pesan</p>
              <Textarea className="min-h-[200px] text-sm" value={draft.body} onChange={(e) => setDraft((prev) => prev ? { ...prev, body: e.target.value } : null)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          {draft && (
            <Button onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" /> Salin Pesan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}