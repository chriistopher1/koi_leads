export type SubscriptionPlan = "free" | "pro" | "business";
export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "trial"
  | "failed"
  | "cancelled";
export type LeadStatus = "new" | "contacted" | "qualified" | "disqualified";
export type OutreachType = "email" | "instagram_dm";
export type PaymentType = "none" | "lifetime" | "onetime";
export type BillingCycle = "1month" | "12month" | "lifetime";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  scrape_quota_used: number;
  scrape_quota_limit: number;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  campaign_id: string | null;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  instagram: string | null;
  rating: number | null;
  review_count: number | null;
  google_maps_url: string | null;
  place_id: string | null;
  score: number | null;
  score_reason: string | null;
  status: LeadStatus;
  notes: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  search_query: string;
  location: string;
  max_results: number;
  status: "pending" | "running" | "completed" | "failed";
  leads_count: number;
  created_at: string;
}

export interface OutreachDraft {
  id: string;
  user_id: string;
  lead_id: string;
  type: OutreachType;
  subject: string | null;
  body: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  xendit_invoice_id: string;
  amount: number;
  currency: string;
  plan: SubscriptionPlan;
  status: "pending" | "paid" | "failed" | "expired";
  created_at: string;
}

