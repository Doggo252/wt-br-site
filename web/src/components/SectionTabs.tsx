import Link from "@/components/Link";

export type Tab = { href: string; label: string };

/** Sub-navigation for pages grouped under one top-level nav item. */
export function SectionTabs({ label, tabs, current }: { label: string; tabs: readonly Tab[]; current: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2 text-sm">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.href === current ? "page" : undefined}
          className={`btn px-2.5 py-1 text-xs ${t.href === current ? "border-gold text-fg" : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export const SHOP_TABS = [
  { href: "/premiums/", label: "Premium vehicles" },
  { href: "/deals/", label: "Deals" },
  { href: "/market/", label: "Market prices" },
] as const;

export const RANKING_TABS = [
  { href: "/rankings/", label: "Rankings" },
  { href: "/shells/", label: "Shell penetration" },
  { href: "/records/", label: "Kill records" },
] as const;

export const TOOL_TABS = [
  { href: "/lineup/", label: "Lineup planner" },
  { href: "/research/", label: "Research planner" },
  { href: "/hangar/", label: "My hangar" },
  { href: "/economy/", label: "SL calculator" },
  { href: "/compare/", label: "Compare" },
  { href: "/watchlist/", label: "Watchlist" },
] as const;
