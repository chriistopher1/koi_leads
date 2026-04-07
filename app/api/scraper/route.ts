import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeGoogleMaps, mapApifyLeadToLead } from "@/lib/rapidapi";
import { scoreLead } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchQuery, location, maxResults, campaignName } = await req.json();

  // --- 1. Check quota ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("scrape_quota_used, scrape_quota_limit, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.scrape_quota_used >= profile.scrape_quota_limit) {
    return NextResponse.json(
      { error: "Kuota scraping habis. Upgrade paket Anda." },
      { status: 403 },
    );
  }

  const effectiveMaxResults = Math.min(
    maxResults,
    profile.scrape_quota_limit - profile.scrape_quota_used,
  );

  // --- 2. Create campaign ---
  const { data: campaign } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      name: campaignName,
      search_query: searchQuery,
      location,
      max_results: effectiveMaxResults,
      status: "running",
    })
    .select()
    .single();

  try {
    const rawLeads = await scrapeGoogleMaps({
      searchQuery,
      location,
      maxResults: effectiveMaxResults,
    });

    const enrichedLeads = [];

    for (const item of rawLeads) {
      const basicLead = mapApifyLeadToLead(item as Record<string, unknown>);

      // --- 3. Dedupe logic (optional, bisa di-DB juga) ---
      // Jika kamu mau sangat strict, bisa cek di `leads` sebelum lanjut
      if (!basicLead.place_id && !basicLead.email) continue;

      // Upsert: prevent duplicate by (user_id, place_id) + email
      const { data: existing } = await supabase
        .from("leads")
        .select("id, score, score_reason")
        .or(
          `user_id.eq.${user.id},place_id.eq.${basicLead.place_id},email.eq.${basicLead.email}`,
        )
        .maybeSingle();

      if (existing) {
        enrichedLeads.push({
          id: existing.id,
          did_update: true,
          // reuse existing score, atau refresh jika kamu mau
          // bisa kamu tambahkan flag di env / config
        });
        continue;
      }

      // --- 4. Score the lead ---
      const scoring = await scoreLead(basicLead);

      enrichedLeads.push({
        user_id: user.id,
        campaign_id: campaign?.id,
        name: basicLead.name,
        category: basicLead.category,
        address: basicLead.address,
        city: basicLead.city,
        phone: basicLead.phone,
        website: basicLead.website,
        email: basicLead.email,
        instagram: basicLead.instagram,
        rating: basicLead.rating,
        review_count: basicLead.review_count,
        google_maps_url: basicLead.google_maps_url,
        place_id: basicLead.place_id,
        score: scoring.score,
        score_reason: scoring.reason,
        status: "new",
        raw_data: basicLead.raw_data,
      });
    }

    // --- 5. Upsert batch (dupes akan di-skip karena unique index tadi) ---
    const { error } = await supabase.from("leads").upsert(
      enrichedLeads.filter((l) => !("id" in l)),
      {
        onConflict: "user_id,place_id", // <-- ini harus match idx_leads_place_id_user
        ignoreDuplicates: false,
      },
    );

    if (error && !error?.message?.includes("on conflict")) {
      throw error;
    }

    const newCount = enrichedLeads.filter((l) => !("id" in l)).length;

    // --- 6. Update campaign & quota ---
    await supabase
      .from("campaigns")
      .update({ status: "completed", leads_count: newCount })
      .eq("id", campaign?.id);

    await supabase
      .from("profiles")
      .update({ scrape_quota_used: profile.scrape_quota_used + newCount })
      .eq("id", user.id);

    return NextResponse.json({ success: true, count: newCount });
  } catch (err) {
    console.error("Scraping error:", err);
    await supabase
      .from("campaigns")
      .update({ status: "failed" })
      .eq("id", campaign?.id);

    return NextResponse.json(
      { error: "Gagal melakukan scraping" },
      { status: 500 },
    );
  }
}
