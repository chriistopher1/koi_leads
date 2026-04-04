import { MapPin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/app_logo.png" alt="KoiLeads Logo" className="bg-white" width={62} height={62} />
          <span className="font-semibold text-foreground">KoiLeads</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} KoiLeads. Dibuat dengan ❤️ di Indonesia.
        </p>
      </div>
    </footer>
  );
}