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

  // --- Contact completeness score pre-calculated to guide the model ---
  const contactScore =
    (lead.phone ? 25 : 0) +
    (lead.website ? 25 : 0) +
    (lead.email ? 30 : 0) +
    (lead.instagram ? 20 : 0);

  const systemPrompt = `Kamu adalah analis lead generation B2B profesional yang membantu tim sales digital marketing agency menemukan calon klien terbaik di Indonesia.
  
Tugas kamu: Berikan skor kualitas lead (0–100) berdasarkan data bisnis dari Google Maps.

Kriteria penilaian WAJIB mengikuti bobot berikut:
1. Kelengkapan kontak (35 poin maks):
   - Email: 30 poin
   - Telepon: 25 poin
   - Website: 25 poin
   - Instagram: 20 poin
   (Gunakan total poin lalu normalisasi ke 35%)

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

Balas HANYA dalam format JSON:
{"score": 0-100, "reason": "bullet points singkat dalam Bahasa Indonesia"}`;

  const userPrompt = `Lead Data:
- Nama: ${name}
- Kategori: ${category}
- Alamat: ${address}
- Rating Google: ${rating}
- Jumlah Ulasan: ${reviewCount}
- Telepon: ${hasPhone}
- Website: ${hasWebsite}
- Email: ${hasEmail}
- Instagram: ${hasInstagram}
- Skor Kontak Awal (kalkulasi): ${contactScore}/100

Berikan skor final 0–100 sesuai bobot di atas. 
Format reason sebagai bullet point ringkas, contoh:
•  Email tersedia — bisa dihubungi langsung
•  Rating 3.8 — reputasi rata-rata
•  142 ulasan — bisnis cukup establish
•  Kategori salon kecantikan — target ideal digital marketing
•  Tidak ada website — peluang jual jasa web
•  Tidak ada Instagram — peluang upsell social media management`;

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
