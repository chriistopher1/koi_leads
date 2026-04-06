import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeGoogleMaps, mapApifyLeadToLead } from "@/lib/apify";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchQuery, location, maxResults, campaignName } = await req.json();

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

  // if quote_limit - quote_used < maxResults, set maxResults to the remaining quota
  const effectiveMaxResults = Math.min(
    maxResults,
    profile.scrape_quota_limit - profile.scrape_quota_used,
  );

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
    const leads = rawLeads.map((item) => ({
      ...mapApifyLeadToLead(item as Record<string, unknown>),
      user_id: user.id,
      campaign_id: campaign?.id,
    }));

    await supabase.from("leads").insert(leads);
    await supabase
      .from("campaigns")
      .update({ status: "completed", leads_count: leads.length })
      .eq("id", campaign?.id);
    await supabase
      .from("profiles")
      .update({ scrape_quota_used: profile.scrape_quota_used + leads.length })
      .eq("id", user.id);

    return NextResponse.json({ success: true, count: leads.length });
  } catch (err) {
    console.log("Scraping error:", err);
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
