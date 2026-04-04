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

export async function scoreLead(lead: Record<string, unknown>): Promise<{ score: number; reason: string }> {
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

Balas HANYA dalam format JSON: {"score": number, "reason": "penjelasan singkat dalam Bahasa Indonesia"}`;

  const response = await chat([{ role: "user", content: prompt }]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 50, reason: "Tidak dapat menganalisis lead ini." };
  }
}

export async function draftOutreach(
  lead: Record<string, unknown>,
  type: "email" | "instagram_dm"
): Promise<{ subject?: string; body: string }> {
  const isEmail = type === "email";

  const prompt = `Kamu adalah copywriter profesional untuk outreach B2B. Buat pesan ${isEmail ? "email" : "Instagram DM"} yang personal, persuasif, dan profesional dalam Bahasa Indonesia untuk bisnis berikut:

- Nama Bisnis: ${lead.name}
- Kategori: ${lead.category}
- Kota: ${lead.city}
- Rating: ${lead.rating}/5 (${lead.review_count} ulasan)
- Website: ${lead.website ?? "Tidak ada"}

${isEmail ? 'Balas dalam format JSON: {"subject": "judul email", "body": "isi email lengkap"}' : 'Balas dalam format JSON: {"body": "pesan DM singkat dan personal, maksimal 200 kata"}'}

Jangan gunakan placeholder seperti [nama perusahaan kamu]. Tulis seolah-olah dari konsultan digital marketing.`;

  const response = await chat([{ role: "user", content: prompt }]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { body: response };
  }
}