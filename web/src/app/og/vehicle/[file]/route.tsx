import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatBr } from "@/lib/br";
import { getIndex, getUnit } from "@/lib/data";
import { plainName } from "@/lib/format";
import { TYPE_NAME, nationName, roman } from "@/lib/nations";
import { SITE_URL } from "@/lib/site";

/**
 * Share card for a vehicle, /og/vehicle/<id>.png: what Discord, Reddit and friends show when the
 * page is linked. A route handler rather than opengraph-image so the file has an extension.
 */
export const dynamic = "force-static";
const size = { width: 1200, height: 630 };

export function generateStaticParams() {
  return getIndex().map((u) => ({ file: `${u.id}.png` }));
}

const FONT_DIR = join(process.cwd(), "node_modules/@fontsource/fira-sans-condensed/files");
const fonts = [400, 600, 700].map((weight) => ({
  name: "Fira Sans Condensed",
  data: readFileSync(join(FONT_DIR, `fira-sans-condensed-latin-${weight}-normal.woff`)),
  weight: weight as 400 | 600 | 700,
  style: "normal" as const,
}));

const C = { bg: "#11141a", panel: "#1b2226", border: "#2f3a42", fg: "#ffffff", fg2: "#c3ccd3", fg3: "#8a96a0", gold: "#f9db78" };
const MODES = [
  { key: "ab", label: "Arcade", color: "#d55181" },
  { key: "rb", label: "Realistic", color: "#3b8fd9" },
  { key: "sb", label: "Simulator", color: "#c98500" },
] as const;

/** RB history as an SVG step path inside w×h. */
function sparkline(points: { t: number; v: number }[], w: number, h: number): string | null {
  if (points.length < 2) return null;
  const t0 = points[0].t;
  const t1 = Math.max(points[points.length - 1].t, t0 + 1);
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs) - 1;
  const hi = Math.max(...vs) + 1;
  const x = (t: number) => ((t - t0) / (t1 - t0)) * w;
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  let d = `M0 ${y(points[0].v).toFixed(1)}`;
  for (const p of points.slice(1)) d += ` H${x(p.t).toFixed(1)} V${y(p.v).toFixed(1)}`;
  return d + ` H${w}`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const u = getUnit(file.replace(/\.png$/, ""));
  const name = plainName(u.name);
  const history = (u.history ?? []).map((h) => ({ t: Date.parse(h.d), v: h.rb }));
  const now = Date.parse(u.history?.[u.history.length - 1]?.d ?? "2020-03-01");
  if (history.length) history.push({ t: Math.max(now, Date.parse("2026-01-01")), v: history[history.length - 1].v });
  const path = sparkline(history, 1040, 120);
  const changes = (u.history ?? []).slice(1).filter((h, i) => h.rb !== u.history![i].rb).length;
  const first = u.history?.[0];
  const last = u.history?.[u.history.length - 1];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          padding: "48px 80px",
          fontFamily: "Fira Sans Condensed",
          color: C.fg,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: C.fg3 }}>
          <span style={{ color: C.gold, fontWeight: 700, letterSpacing: 4 }}>UPTIER</span>
          <span>
            {nationName(u.nation)} · Rank {roman(u.rank)} · {TYPE_NAME[u.type] ?? u.type}
            {u.status !== "tree" ? ` · ${u.status[0].toUpperCase()}${u.status.slice(1)}` : ""}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: name.length > 22 ? 72 : 96,
            fontWeight: 700,
            lineHeight: 1,
            color: u.status === "premium" || u.status === "event" ? C.gold : C.fg,
          }}
        >
          {name}
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 36 }}>
          {MODES.map((m) => (
            <div
              key={m.key}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 220,
                padding: "14px 22px",
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderTop: `4px solid ${m.color}`,
              }}
            >
              <span style={{ fontSize: 22, color: C.fg3, letterSpacing: 2 }}>{m.label.toUpperCase()}</span>
              <span style={{ fontSize: 64, fontWeight: 700 }}>{formatBr(u.br[m.key])}</span>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", marginLeft: 12, fontSize: 26, color: C.fg2 }}>
            {u.removedIn ? <span>Removed in {u.removedIn}</span> : null}
            {first ? (
              <span>
                {changes} RB {changes === 1 ? "change" : "changes"} since {first.d.slice(0, 4)}
              </span>
            ) : null}
          </div>
        </div>
        {path ? (
          <svg width="1040" height="130" viewBox="-2 -5 1044 130" style={{ marginTop: 34 }}>
            <path d={path} stroke="#3b8fd9" strokeWidth="5" fill="none" />
          </svg>
        ) : (
          <div style={{ display: "flex", height: 130, marginTop: 34 }} />
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 24, color: C.fg3 }}>
          <span>
            {first && last
              ? `Realistic BR since ${first.d.slice(0, 4)}: ${formatBr(first.rb)} → ${formatBr(last.rb)}`
              : "Realistic BR over time"}
          </span>
          <span>{SITE_URL.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
