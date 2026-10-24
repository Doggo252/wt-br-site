import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/fira-sans-condensed/400.css";
import "@fontsource/fira-sans-condensed/500.css";
import "@fontsource/fira-sans-condensed/600.css";
import "@fontsource/fira-sans-condensed/700.css";
import "@fontsource/pt-sans/400.css";
import "@fontsource/pt-sans/700.css";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { SearchBox } from "@/components/SearchBox";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Uptier — War Thunder BR history", template: "%s · Uptier" },
  description: "Battle Rating history for every War Thunder vehicle, patch by patch.",
};

const NAV = [
  { href: "/ground/", label: "Ground", ready: true },
  { href: "/air/", label: "Air", ready: true },
  { href: "/helicopters/", label: "Helis", ready: true },
  { href: "/updates/", label: "Updates", ready: true },
  { href: "/announcements/", label: "Planned", ready: true },
  { href: "/records/", label: "Records", ready: true },
  { href: "/explore/", label: "Explore", ready: true },
  { href: "/about/", label: "About", ready: true },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <header className="border-b border-card-border bg-header">
          <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4">
            <Link href="/" className="font-display text-lg font-bold tracking-wide text-fg no-underline hover:text-fg">
              UPTIER
            </Link>
            <nav aria-label="Main" className="flex gap-4 overflow-x-auto">
              {NAV.map((item) =>
                item.ready ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="font-display text-sm font-medium text-fg-2 no-underline hover:text-fg"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.href}
                    title="Coming soon"
                    className="cursor-default font-display text-sm font-medium text-fg-3"
                  >
                    {item.label}
                  </span>
                ),
              )}
            </nav>
            <SearchBox className="ml-auto hidden w-56 sm:block" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-card-border bg-panel">
          <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-fg-3">
            Uptier is a fan site and is not affiliated with or endorsed by Gaijin Entertainment. War Thunder and
            related names are trademarks of Gaijin. Game data from the{" "}
            <a href="https://github.com/gszabi99/War-Thunder-Datamine">War Thunder Datamine</a>.{" "}
            <Link href="/about/">About</Link> · <Link href="/design/">Style guide</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
