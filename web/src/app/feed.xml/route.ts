import { MODES, MODE_LABEL, formatBr } from "@/lib/br";
import { getUnitMap, getUpdate, getVersions } from "@/lib/data";
import { plainName, plural } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const ENTRIES = 30;
const LISTED = 25;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Atom feed of game updates that changed BRs or added vehicles, newest first. */
export function GET() {
  const units = getUnitMap();
  const name = (id: string) => plainName(units.get(id)?.name ?? id);
  const versions = getVersions()
    .filter((v) => v.changes > 0 || v.added > 0)
    .slice(-ENTRIES)
    .reverse();

  const entries = versions.map((v) => {
    const u = getUpdate(v.v);
    const url = `${SITE_URL}/updates/${v.v}/`;
    const parts = [];
    if (v.changes) parts.push(plural(v.changes, "BR change"));
    if (v.added) parts.push(`${plural(v.added, "vehicle")} added`);
    const rows = u.changes.slice(0, LISTED).map((c) => {
      // Every mode that moved: an AB-only change must not read as "no change".
      const moves = MODES.filter((m) => c.before[m] !== c.after[m])
        .map((m) => `${MODE_LABEL[m]} ${formatBr(c.before[m])} → ${formatBr(c.after[m])}`)
        .join(", ");
      return `<li>${esc(name(c.id))}: ${moves}</li>`;
    });
    if (u.changes.length > LISTED) rows.push(`<li>…and ${u.changes.length - LISTED} more</li>`);
    if (u.added.length) rows.push(`<li>Added: ${esc(u.added.slice(0, LISTED).map(name).join(", "))}</li>`);
    return `  <entry>
    <id>${url}</id>
    <title>${esc(`Update ${v.v}: ${parts.join(", ")}`)}</title>
    <link href="${url}"/>
    <updated>${v.d}T00:00:00Z</updated>
    <content type="html">${esc(`<ul>${rows.join("")}</ul>`)}</content>
  </entry>`;
  });

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE_URL}/</id>
  <title>Uptier: War Thunder BR changes</title>
  <subtitle>Every Battle Rating change, patch by patch.</subtitle>
  <link href="${SITE_URL}/feed.xml" rel="self"/>
  <link href="${SITE_URL}/updates/"/>
  <updated>${(versions[0]?.d ?? "2020-01-01")}T00:00:00Z</updated>
  <author><name>Uptier</name></author>
${entries.join("\n")}
</feed>
`;
  return new Response(xml, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
}
