"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/ground/", label: "Ground" },
  { href: "/air/", label: "Air" },
  { href: "/helicopters/", label: "Helis" },
  { href: "/updates/", label: "Updates" },
  { href: "/announcements/", label: "Planned" },
  { href: "/records/", label: "Records" },
  { href: "/lineup/", label: "Lineup" },
  { href: "/explore/", label: "Explore" },
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
            className={`whitespace-nowrap border-b-2 px-2 py-3 font-display text-sm font-medium tracking-wide transition-colors ${
              active ? "border-gold text-fg" : "border-transparent text-fg-2 hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
