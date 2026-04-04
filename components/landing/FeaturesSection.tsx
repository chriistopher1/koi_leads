import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Target, BarChart3, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Lead Discovery",
    description: "Scrape ribuan bisnis dari Google Maps berdasarkan kategori dan lokasi yang kamu tentukan secara otomatis.",
  },
  {
    icon: Target,
    title: "Lead Enrichment",
    description: "Dapatkan data lengkap: nomor telepon, website, email, Instagram, rating, dan ulasan bisnis.",
  },
  {
    icon: BarChart3,
    title: "Lead Scoring AI",
    description: "AI menilai setiap lead dengan skor 1–100 agar kamu tahu siapa yang paling worth dihubungi duluan.",
  },
  {
    icon: MessageSquare,
    title: "AI Message Drafting",
    description: "Generate pesan email atau Instagram DM yang personal dan persuasif untuk setiap lead dalam hitungan detik.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Semua yang Kamu Butuhkan</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Dari penemuan lead hingga pengiriman pesan — semuanya terotomatisasi.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}