import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Heading font (optional, keep if you want different headings)
const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

// Main font (used everywhere)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "KoiLeads - B2B Lead Generation Platform",
  description:
    "KoiLeads adalah platform generasi prospek B2B yang membantu bisnis menemukan dan mengelola prospek berkualitas tinggi dengan mudah. Dengan fitur pencarian prospek yang canggih, manajemen kontak, dan integrasi CRM, KoiLeads memudahkan tim penjualan untuk fokus pada closing deal daripada mencari data. Tingkatkan efisiensi penjualan Anda dengan KoiLeads hari ini!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        outfitHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col dark">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
