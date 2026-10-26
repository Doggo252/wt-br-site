import Link from "@/components/Link";

const TABS = [
  { href: "/premiums/", label: "Premium vehicles" },
  { href: "/deals/", label: "Deals" },
  { href: "/market/", label: "Market prices" },
] as const;

/** Sub-navigation shared by the shop pages. */
export function ShopTabs({ current }: { current: (typeof TABS)[number]["href"] }) {
  return (
    <nav aria-label="Shop" className="flex flex-wrap gap-2 text-sm">
      {TABS.map((t) => (
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
