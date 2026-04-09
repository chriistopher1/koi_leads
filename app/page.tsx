import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection, ProfileProp } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile : ProfileProp | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select(
        `
    subscription_plan,
    subscription_status,
    payment_type,
    subscription_ends_at
  `,
      )
      .eq("id", user.id)
      .single();

    profile = data;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection profile={profile} />
      <CTASection />
      <Footer />
    </div>
  );
}
