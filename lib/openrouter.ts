const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function chat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5",
      messages,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function chatScore(
  messages: ChatMessage[],
): Promise<{ score: number; reason: string }> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5",
      messages,
      // Optional: enable JSON mode jika model mendukung
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json();

  const raw = data.choices?.[0]?.message?.content ?? "{}";

  try {
    // Bersihkan jika ada ```json``` dll
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      score: parsed.score ?? 50,
      reason: parsed.reason ?? "Tidak dapat menganalisis lead ini.",
    };
  } catch {
    return { score: 50, reason: "Tidak dapat menganalisis lead ini." };
  }
}

// lib/openrouter.ts

// lib/openrouter.ts
export async function scoreLead(
  lead: Record<string, unknown>,
): Promise<{ score: number; reason: string }> {
  // --- Normalize fields to avoid "undefined" in prompt ---
  const name = (lead.name as string) ?? "Tidak diketahui";
  const category = (lead.category as string) ?? "Tidak diketahui";
  const rating = lead.rating != null ? `${lead.rating}/5` : "Tidak ada";
  const reviewCount =
    lead.review_count != null ? String(lead.review_count) : "Tidak ada";
  const hasPhone = lead.phone ? "✅ Ada" : "❌ Tidak ada";
  const hasWebsite = lead.website ? "✅ Ada" : "❌ Tidak ada";
  const hasEmail = lead.email ? "✅ Ada" : "❌ Tidak ada";
  const hasInstagram = lead.instagram ? "✅ Ada" : "❌ Tidak ada";
  const address = (lead.address as string) ?? "Tidak diketahui";
  const city = (lead.city as string) ?? "Tidak diketahui";

  // --- Enhanced social media analysis ---
  const instagram = lead.instagram as string | null;
  const website = lead.website as string | null;

  // Contact completeness score pre-calculated to guide the model
  const contactScore =
    (lead.phone ? 25 : 0) +
    (lead.website ? 25 : 0) +
    (lead.email ? 30 : 0) +
    (lead.instagram ? 20 : 0);

  const systemPrompt = `Kamu adalah analis lead generation B2B profesional yang membantu tim sales digital marketing agency menemukan calon klien terbaik di Indonesia.

Tugas kamu: Berikan skor kualitas lead (0–100) berdasarkan data bisnis dari Google Maps + analisis mendalam social media & website presence.

Kriteria penilaian WAJIB mengikuti bobot berikut:

1. Kelengkapan kontak (35 poin maks):
   - Email: 30 poin (website email +20 bonus)
   - Telepon: 25 poin
   - Website: 25 poin
   - Instagram: 20 poin

2. Reputasi bisnis / Google Rating (25 poin maks):
   - Rating 4.5–5.0 → 25 poin
   - Rating 4.0–4.4 → 20 poin
   - Rating 3.5–3.9 → 12 poin
   - Rating < 3.5 atau tidak ada → 5 poin

3. Jumlah ulasan / review count (20 poin maks):
   - > 200 ulasan → 20 poin
   - 100–200 → 16 poin
   - 50–99 → 12 poin
   - 20–49 → 8 poin
   - < 20 → 4 poin

4. Relevansi kategori bisnis untuk digital marketing (20 poin maks):
   - Tinggi (restoran, salon, klinik, properti, hotel, retail fashion) → 20 poin
   - Sedang (bengkel, toko elektronik, jasa konsultan) → 12 poin
   - Rendah (warung kecil, toko sembako, layanan pemerintah) → 4 poin

Berikan breakdown DETAIL seperti contoh:
Score Breakdown
• Email scraped from website
• Contact: [Nama Bisnis]
• 4 platforms - spread thin, needs strategy
• 0.13% IG engagement - content underperforming
• 1.3 posts/wk - inconsistent posting
• 4.9 stars - excellent business, prime candidate
• 76 reviews - established local business

Balas HANYA dalam format JSON:
{"score": 0-100, "reason": "bullet points detail dalam Bahasa Indonesia"}`;

  const userPrompt = `Lead Data Lengkap:
Nama: ${name}
Kategori: ${category}
Kota: ${city}
Alamat: ${address}
Rating Google: ${rating}
Jumlah Ulasan: ${reviewCount}
Telepon: ${hasPhone}
Website: ${hasWebsite}
Email: ${hasEmail}
Instagram: ${hasInstagram}
Kontak Score: ${contactScore}/100

INSTRUKSI KHUSUS - Buat breakdown detail seperti contoh:

1. Email source (website scraped / Google?)
2. Contact completeness: ${contactScore}/100 poin
3. Platform presence: ${hasPhone ? "phone" : ""} ${
    hasWebsite ? "website" : ""
  } ${hasEmail ? "email" : ""} ${hasInstagram ? "instagram" : ""}${
    [hasPhone, hasWebsite, hasEmail, hasInstagram].filter(Boolean).length > 3
      ? " - multi-platform, needs unified strategy"
      : ""
  }
4. Rating analysis: ${
    rating === "Tidak ada"
      ? "No reviews - new business opportunity"
      : `${rating} stars - ${
          Number(lead.rating)! >= 4.5
            ? "excellent"
            : Number(lead.rating)! >= 4.0
              ? "solid"
              : Number(lead.rating)! >= 3.5
                ? "average"
                : "needs reputation management"
        }`
  }
5. Review volume: ${
    reviewCount === "Tidak ada"
      ? "No reviews - fresh business"
      : Number(reviewCount) > 200
        ? "high volume - established"
        : Number(reviewCount) > 100
          ? "good volume"
          : Number(reviewCount) > 50
            ? "moderate"
            : Number(reviewCount) > 20
              ? "growing"
              : "low - growth potential"
  }
6. Instagram analysis (jika ada): ${
    instagram
      ? `Active IG presence - needs engagement audit, ${
          website && instagram ? "IG bio link consistency check" : ""
        }`
      : "No IG - social media opportunity"
  }
7. Website analysis (jika ada): ${
    website
      ? `Has website - check SEO/lead gen optimization`
      : "No website - complete digital transformation opportunity"
  }
8. Category fit: ${category} - digital marketing relevance assessment
9. Multi-platform consistency check
10. Business maturity signals

Berikan skor final 0–100 sesuai bobot. Format reason SEPERTI CONTOH dengan minimal 12-15 bullet points detail dalam Bahasa Indonesia.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  return chatScore(messages);
}

export async function draftOutreach(
  lead: Record<string, unknown>,
  type: "email" | "instagram_dm",
): Promise<{ subject?: string; body: string }> {
  const isEmail = type === "email";

  const prompt = `Kamu adalah copywriter profesional untuk outreach B2B. Buat pesan ${
    isEmail ? "email" : "Instagram DM"
  } yang personal, persuasif, dan profesional dalam Bahasa Indonesia untuk bisnis berikut:

- Nama Bisnis: ${lead.name}
- Kategori: ${lead.category}
- Kota: ${lead.city}
- Rating: ${lead.rating}/5 (${lead.review_count} ulasan)
- Website: ${lead.website ?? "Tidak ada"}

${
  isEmail
    ? 'Balas dalam format JSON: {"subject": "judul email", "body": "isi email lengkap"}'
    : 'Balas dalam format JSON: {"body": "pesan DM singkat dan personal, maksimal 200 kata"}'
}

Jangan gunakan placeholder seperti [nama perusahaan kamu]. Tulis seolah-olah dari konsultan digital marketing.`;

  const response = await chat([{ role: "user", content: prompt }]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { body: response };
  }
}
