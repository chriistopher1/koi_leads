import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto text-center max-w-4xl">
        <Badge variant="outline" className="mb-6 text-primary border-primary/30">
          <Sparkles className="h-3 w-3 mr-1" /> Didukung AI & Google Maps
        </Badge>
        <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
          Temukan Ribuan{" "}
          <span className="text-primary">Leads Potensial</span>{" "}
          di Google Maps
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          LeadHunter mengotomatiskan pencarian prospek bisnis dari Google Maps, menilai kualitas setiap lead, dan membuat pesan outreach yang dipersonalisasi — semua dalam satu platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Mulai Gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Lihat Fitur</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Tidak perlu kartu kredit • Gratis 50 leads/bulan
        </p>
      </div>
    </section>
  );
}