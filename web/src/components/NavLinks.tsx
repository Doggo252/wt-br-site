"use client";

import Link from "@/components/Link";
import { Compass, History, Megaphone, Store, Swords, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { BranchIcon } from "./BranchIcon";

const NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/ground/", label: "Ground", icon: <BranchIcon branch="ground" className="h-4 w-4" /> },
  { href: "/air/", label: "Air", icon: <BranchIcon branch="air" className="h-4 w-4" /> },
  { href: "/helicopters/", label: "Helis", icon: <BranchIcon branch="heli" className="h-4 w-4" /> },
  { href: "/updates/", label: "Updates", icon: <History className="h-4 w-4" /> },
  { href: "/announcements/", label: "Planned", icon: <Megaphone className="h-4 w-4" /> },
  { href: "/records/", label: "Records", icon: <Trophy className="h-4 w-4" /> },
  { href: "/lineup/", label: "Lineup", icon: <Swords className="h-4 w-4" /> },
  { href: "/market/", label: "Market", icon: <Store className="h-4 w-4" /> },
  { href: "/explore/", label: "Explore", icon: <Compass className="h-4 w-4" /> },
];

export function NavLinks() {
  const path = usePathname() ?? "/";
  return (
    <nav aria-label="Main" className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(90deg,#000_85%,transparent)] sm:flex-none sm:[mask-image:none]">
      {NAV.map((item) => {
        const active = path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 font-display text-sm font-medium tracking-wide transition-colors ${
              active ? "border-gold text-fg" : "border-transparent text-fg-2 hover:text-fg"
            }`}
          >
            {/* Icons from lg up; on smaller screens the row already scrolls. */}
            <span aria-hidden className={`hidden lg:inline ${active ? "text-gold" : "text-fg-3 group-hover:text-fg-2"}`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
