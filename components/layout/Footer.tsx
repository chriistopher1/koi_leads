import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">LeadHunter</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} LeadHunter. Dibuat dengan ❤️ di Indonesia.
        </p>
      </div>
    </footer>
  );
}