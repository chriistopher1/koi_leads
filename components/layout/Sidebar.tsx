"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Send,
  Settings,
  LogOut,
} from "lucide-react";

import type { Profile } from "@/types";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scraper", label: "Scraper", icon: Map },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

function SidebarBrand({ profile }: { profile: Profile | null }) {
  const { state, openMobile, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isVisible = isMobile ? openMobile : !isCollapsed;

  return (
    <SidebarHeader className="border-b px-4 py-4">
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/app_logo.png"
          alt="KoiLeads Logo"
          width={isCollapsed && !isMobile ? 32 : 44}
          height={isCollapsed && !isMobile ? 32 : 44}
          className="rounded-md transition-all"
        />
        {isVisible && (
          <span className="font-bold text-lg text-foreground">KoiLeads</span>
        )}
      </Link>

      {isVisible && profile && (
        <Badge variant="outline" className="mt-3 w-fit text-xs">
          {profile.subscription_plan.toUpperCase()}
        </Badge>
      )}
    </SidebarHeader>
  );
}

function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <SidebarContent className=" py-4">
      <SidebarGroup className="">
        <SidebarGroupLabel className="text-muted-foreground">
          Navigation
        </SidebarGroupLabel>

        <SidebarMenu className="">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href} className=" text-center">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "text-muted-foreground",
                    isActive && "text-primary",
                  )}
                >
                  <Link href={item.href} className=" ">
                    <Icon className="h-4 w-4  text-center" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}

function SidebarLogout() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <SidebarFooter className="border-t p-4">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground hover:text-primary"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </Button>
    </SidebarFooter>
  );
}

export function Sidebar({ profile }: { profile: Profile | null }) {
  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarBrand profile={profile} />
      <SidebarNavigation />
      <SidebarLogout />
      <SidebarRail />
    </ShadcnSidebar>
  );
}
