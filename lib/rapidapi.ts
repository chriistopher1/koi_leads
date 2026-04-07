// lib/maps-apis/rapidapi-local-business.ts

export interface ScrapeParams {
  searchQuery: string;
  location: string;
  maxResults: number;
}

// Simplified shape of what RapidAPI returns (per business item)
export interface RapidApiBusiness {
  name: string;
  type?: string | null;
  subtypes?: string[] | null;
  full_address?: string | null;
  address?: string | null;
  city?: string | null;
  phone_number?: string | null;
  website?: string | null;
  emails_and_contacts?: {
    emails?: string[] | null;
    instagram?: string | null;
    facebook?: string | null;
    [extra: string]: unknown;
  } | null;
  rating?: number | null;
  review_count?: number | null;
  place_link?: string | null;
  place_id?: string | null;
  [extra: string]: unknown;
}

export async function scrapeGoogleMaps(
  params: ScrapeParams
): Promise<RapidApiBusiness[]> {
  const { searchQuery, location, maxResults } = params;

  const host = "local-business-data.p.rapidapi.com";
  const url = `https://${host}/search`;

  // You can swap `location` with lat/lon if you add a geocoding step later
  const search = `${searchQuery} in ${location}`;

  const query = new URLSearchParams({
    query: search,
    limit: String(maxResults),
    language : 'id',
    region: 'id',
    extract_emails_and_contacts : "true",
    // Example optional params; customize as needed:
    // language: "id",
    // zoom: "12",
  });

  const res = await fetch(`${url}?${query}`, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
      "X-RapidAPI-Host": host,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `RapidAPI search-in-area failed: ${res.status} ${res.statusText} — ${text}`
    );
  }

  const data = (await res.json()) as {
    data?: RapidApiBusiness[];
    request_id?: string;
    [extra: string]: unknown;
  };

  return data.data ?? [];
}

export function mapApifyLeadToLead(
  item: Record<string, unknown>
): Record<string, unknown> {
  const raw = item as RapidApiBusiness;

  // Pull the first email; you can tweak if you want multiple later
  const emails = raw.emails_and_contacts?.emails ?? [];
  const email = Array.isArray(emails) && emails.length > 0 ? emails[0] : null;

  const address = raw.full_address ?? raw.address ?? null;
  const city = raw.city ?? extractCityFromAddress(address);

  return {
    name: raw.name ?? "",
    category: raw.type ?? raw.subtypes?.join(", ") ?? null,
    address,
    city,
    phone: raw.phone_number ?? null,
    website: raw.website ?? null,
    email,
    instagram: raw.emails_and_contacts?.instagram ?? null,
    rating: raw.rating ?? null,
    review_count: raw.review_count ?? null,
    google_maps_url: raw.place_link ?? null,
    place_id: raw.place_id ?? null,
    raw_data: raw,
  };
}

/**
 * Naive helper to extract city from “Street, City, Province”‑style full_address.
 * You can swap this later with a real geocoder or NLP if needed.
 */
function extractCityFromAddress(addr: string | null): string | null {
  if (!addr) return null;
  const parts = addr.split(",").map((s) => s.trim());
  if (parts.length >= 2) return parts[parts.length - 2];
  if (parts.length === 1) return parts[0];
  return null;
}