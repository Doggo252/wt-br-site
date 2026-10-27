import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";

/**
 * The Guide: general game pages written for this site (content/guide/<category>/<slug>.md, each
 * with title / summary / source front matter). Facts follow the official wiki's pages, which are
 * linked as sources; the text is our own.
 */
export const GUIDE_CATEGORIES = [
  { id: "game-modes", label: "Game modes", blurb: "Arcade, Realistic and Simulator battles and the other ways to play." },
  { id: "mechanics", label: "Game mechanics", blurb: "Matchmaking, armour, crews, sensors and everything else under the hood." },
  { id: "economy", label: "Economy and trading", blurb: "Silver Lions, Warbonds, the Gaijin Market and making money from your work." },
  { id: "awards", label: "Awards and profile", blurb: "Achievements, titles, decorations, boosters and profile customisation." },
  { id: "controls", label: "Controls", blurb: "Setting up controls and flying and driving techniques." },
  { id: "battle-pass", label: "Battle Pass", blurb: "How the Battle Pass works, and every season so far." },
  { id: "world-war", label: "World War", blurb: "The World War mode and its seasons." },
  { id: "reference", label: "Designations", blurb: "What the letters and numbers in vehicle names mean, by nation." },
  { id: "technical", label: "Technical help", blurb: "Logs, replays, screenshots and fixing the game client." },
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number]["id"];

export type GuidePage = {
  category: GuideCategory;
  slug: string;
  title: string;
  summary: string;
  sources: string[];
  html: string;
  words: number;
};

const ROOT = path.join(process.cwd(), "content", "guide");

const md = new Marked({ gfm: true });
md.use({
  renderer: {
    // Tables scroll on narrow screens and use the site's table style.
    table(token) {
      const head = token.header.map((c) => `<th scope="col">${this.parser.parseInline(c.tokens)}</th>`).join("");
      const rows = token.rows
        .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`)
        .join("");
      return `<div class="panel my-4 overflow-x-auto"><table class="data-table w-full text-sm"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
    },
  },
});

function frontMatter(text: string): [Record<string, string>, string] {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return [{}, text];
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return [meta, text.slice(m[0].length)];
}

let cache: GuidePage[] | null = null;

export function getGuide(): GuidePage[] {
  if (cache) return cache;
  const pages: GuidePage[] = [];
  for (const { id } of GUIDE_CATEGORIES) {
    const dir = path.join(ROOT, id);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const [meta, body] = frontMatter(fs.readFileSync(path.join(dir, file), "utf-8"));
      pages.push({
        category: id,
        slug: file.replace(/\.md$/, ""),
        title: meta.title ?? file,
        summary: meta.summary ?? "",
        sources: (meta.source ?? "").split(/,\s*/).filter(Boolean),
        html: md.parse(body.replace(/^#\s+.*\n/, "")) as string,
        words: body.split(/\s+/).filter(Boolean).length,
      });
    }
  }
  pages.sort((a, b) => a.title.localeCompare(b.title));
  cache = pages;
  return pages;
}

export function getGuidePage(category: string, slug: string): GuidePage | undefined {
  return getGuide().find((p) => p.category === category && p.slug === slug);
}

export function guideHref(p: { category: string; slug: string }): string {
  return `/guide/${p.category}/${p.slug}/`;
}
