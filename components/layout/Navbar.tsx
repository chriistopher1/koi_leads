import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center ">
          <Image src="/app_logo.png" alt="KoiLeads Logo" width={62} height={62} />
          <span className="font-bold text-lg text-foreground">KoiLeads</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fitur</Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Harga</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link href="/login">Masuk</Link></Button>
          <Button asChild><Link href="/register">Coba Gratis</Link></Button>
        </div>
      </div>
    </header>
  );
}