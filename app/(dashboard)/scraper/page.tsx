import { ScraperForm } from "@/components/scraper/ScraperForm";
import { PageHeader } from "@/components/shared/PageHeader";


export default function ScraperPage() {
  return (
    <div className="space-y-6 flex flex-col items-center">
      <PageHeader
        title="Scraper Google Maps"
        description="Temukan leads bisnis potensial dari Google Maps. Masukkan kata kunci dan lokasi untuk mulai."
      />
      <ScraperForm />
    </div>
  );
}