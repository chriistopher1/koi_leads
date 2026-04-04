import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

export interface ScrapeParams {
  searchQuery: string;
  location: string;
  maxResults: number;
}

export async function scrapeGoogleMaps(params: ScrapeParams) {
  const run = await client.actor("compass/crawler-google-places").call({
    searchStringsArray: [`${params.searchQuery} in ${params.location}`],
    maxCrawledPlacesPerSearch: params.maxResults,
    language: "id",
    exportPlaceUrls: false,
    includeHistogram: false,
    includeOpeningHours: true,
    includePeopleAlsoSearch: false,
    maxImages: 0,
    maxReviews: 5,
    scrapeReviewerName: false,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
}

export function mapApifyLeadToLead(item: Record<string, unknown>) {
  return {
    name: (item.title as string) ?? "",
    category: (item.categoryName as string) ?? null,
    address: (item.address as string) ?? null,
    city: (item.city as string) ?? null,
    phone: (item.phone as string) ?? null,
    website: (item.website as string) ?? null,
    email: (item.email as string) ?? null,
    instagram: extractInstagram(item.socialMedia as Record<string, string>),
    rating: (item.totalScore as number) ?? null,
    review_count: (item.reviewsCount as number) ?? null,
    google_maps_url: (item.url as string) ?? null,
    place_id: (item.placeId as string) ?? null,
    raw_data: item,
  };
}

function extractInstagram(socialMedia?: Record<string, string>): string | null {
  if (!socialMedia) return null;
  return socialMedia.instagram ?? null;
}