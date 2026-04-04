"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function ScraperForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ campaignName: "", searchQuery: "", location: "", maxResults: 20 });
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "maxResults" ? Number(value) : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/scraper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Berhasil! ${data.count} leads ditemukan.`);
      router.push("/leads");
    } else {
      toast.error(data.error ?? "Scraping gagal");
    }
    setLoading(false);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Konfigurasi Scraping</CardTitle>
        <CardDescription>Data akan diambil dari Google Maps menggunakan Apify</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaignName">Nama Kampanye</Label>
            <Input id="campaignName" name="campaignName" placeholder="Misal: Restoran Jakarta Pusat" value={form.campaignName} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="searchQuery">Kata Kunci Bisnis</Label>
            <Input id="searchQuery" name="searchQuery" placeholder="Misal: salon kecantikan, bengkel motor, toko baju" value={form.searchQuery} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Lokasi</Label>
            <Input id="location" name="location" placeholder="Misal: Jakarta Selatan, Surabaya, Bandung" value={form.location} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxResults">Maksimal Hasil (maks. 100)</Label>
            <Input id="maxResults" name="maxResults" type="number" min={1} max={100} value={form.maxResults} onChange={handleChange} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sedang Scraping...</> : "Mulai Scraping"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}