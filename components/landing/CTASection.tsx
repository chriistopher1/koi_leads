import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-primary text-primary-foreground">
      <div className="container mx-auto text-center max-w-2xl">
        <h2 className="text-3xl font-bold mb-4">Siap Mulai Berburu Leads?</h2>
        <p className="text-primary-foreground/80 mb-8">
          Bergabung dengan ratusan pebisnis yang sudah menemukan klien baru lewat LeadHunter.
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/register">Daftar Sekarang — Gratis</Link>
        </Button>
      </div>
    </section>
  );
}