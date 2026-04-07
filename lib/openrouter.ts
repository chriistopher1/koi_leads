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

export async function scoreLead(
  lead: Record<string, unknown>,
): Promise<{ score: number; reason: string }> {
  const prompt = `Kamu adalah analis lead generation profesional. Berikan skor 1-100 untuk lead bisnis berikut berdasarkan potensinya sebagai klien potensial. Pertimbangkan: rating, jumlah ulasan, kelengkapan data kontak, dan kategori bisnis.

Lead Data:
- Nama: ${lead.name}
- Kategori: ${lead.category}
- Rating: ${lead.rating}/5
- Jumlah Ulasan: ${lead.review_count}
- Telepon: ${lead.phone ? "Ada" : "Tidak ada"}
- Website: ${lead.website ? "Ada" : "Tidak ada"}
- Email: ${lead.email ? "Ada" : "Tidak ada"}
- Instagram: ${lead.instagram ? "Ada" : "Tidak ada"}

Berikan skor antara 0 - 100 (0 = sangat buruk, 100 = sangat bagus).

Susun penjelasan dalam format bullet point seperti contoh:
• Email scraped from website
• 3 platforms - spread thin, needs strategy
• 0.28% IG engagement - content underperforming
• 1.1 posts/wk - inconsistent posting
• 5 stars - excellent business, prime candidate
• 59 reviews - established local business
• Never responds to reviews - reputation management opportunity
• Services identified - can personalize pitch
• Last post 1d ago - active poster
• 1.1 posts/wk - below optimal frequency
• 0.28% engagement - content completely flat
• 5,259 followers - established, ready for strategy
• Follow ratio 8.6:1 - strong organic following

Balas HANYA dalam format JSON sederhana:
{"score": 0-100, "reason": "bullet point list seperti contoh di atas dalam Bahasa Indonesia"}`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: prompt,
    },
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
