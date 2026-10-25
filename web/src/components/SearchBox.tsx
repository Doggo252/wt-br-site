"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatBr } from "@/lib/br";
import { BRANCH_SHORT, type Branch } from "@/lib/branches";
import { Flag } from "./Flag";
import { nationName } from "@/lib/nations";

/** [id, name, nation, rb rank, removed (0/1), branch] from data/public/search.json */
export type SearchRow = [string, string, string, number, number, string];
type Row = SearchRow;

let index: Promise<Row[]> | null = null;
export function loadIndex(): Promise<Row[]> {
  index ??= fetch("/data/search.json").then((r) => r.json());
  return index;
}

/** Lower-case, strip the game's name glyphs and punctuation so "t-34" matches "T-34-85". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[␀-⓿▀-◿⋠-]/g, "")
    .replace(/[^a-z0-9а-я]+/g, "");
}

/** Words that pick a nation ("uk", "soviet") rather than match a name. */
const NATION_ALIASES: Record<string, string> = {
  usa: "usa", us: "usa", america: "usa", american: "usa",
  germany: "germany", german: "germany", ger: "germany",
  ussr: "ussr", soviet: "ussr", russia: "ussr", russian: "ussr",
  britain: "britain", uk: "britain", british: "britain", gb: "britain",
  japan: "japan", japanese: "japan", jp: "japan",
  china: "china", chinese: "china", prc: "china",
  italy: "italy", italian: "italy",
  france: "france", french: "france",
  sweden: "sweden", swedish: "sweden",
  israel: "israel", israeli: "israel",
};

/**
 * Free text plus optional filters: a nation word ("germany", "uk") and a BR with a
 * decimal point ("6.7", matched against Realistic BR). "germany 6.7" lists all such vehicles.
 */
export function parseQuery(q: string): { text: string; nation?: string; rank?: number } {
  let nation: string | undefined;
  let rank: number | undefined;
  const rest: string[] = [];
  for (const word of q.trim().split(/\s+/)) {
    const lower = word.toLowerCase();
    if (!nation && NATION_ALIASES[lower]) nation = NATION_ALIASES[lower];
    else if (rank === undefined && /^\d{1,2}\.\d$/.test(word)) rank = Math.round((Number(word) - 1) * 3);
    else rest.push(word);
  }
  return { text: rest.join(" "), nation, rank };
}

function search(rows: Row[], q: string, limit = 8): Row[] {
  const { text, nation, rank } = parseQuery(q);
  const nq = norm(text);
  if (!nq && nation === undefined && rank === undefined) return [];
  const scored: [number, Row][] = [];
  for (const r of rows) {
    if (nation && r[2] !== nation) continue;
    if (rank !== undefined && r[3] !== rank) continue;
    const n = norm(r[1]);
    let score = -1;
    if (!nq) score = 0;
    else if (n === nq) score = 0;
    else if (n.startsWith(nq)) score = 1;
    else if (n.includes(nq)) score = 2;
    else if (norm(r[0]).includes(nq)) score = 3;
    if (score >= 0) scored.push([score + r[4] * 0.5, r]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1][1].length - b[1][1].length);
  // Filter-only queries ("germany 6.7") can match many vehicles; show more of them.
  return scored.slice(0, nq ? limit : limit * 2).map((s) => s[1]);
}

export function SearchBox({
  className = "",
  onSelect,
  placeholder = "Search vehicles and aircraft",
  shortcut = false,
}: {
  className?: string;
  /** Focus this box when "/" is pressed outside a text field. */
  shortcut?: boolean;
  /** Called instead of navigating to the vehicle page. */
  onSelect?: (row: Row) => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<Row[]>([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      e.preventDefault();
      input.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  function update(value: string, data = rows) {
    setQ(value);
    setResults(search(data, value));
    setActive(0);
    setOpen(true);
  }

  function go(r: Row) {
    setOpen(false);
    setQ("");
    if (onSelect) return onSelect(r);
    input.current?.blur();
    router.push(`/vehicle/${r[0]}/`);
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={input}
        type="search"
        value={q}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        onFocus={() => loadIndex().then((data) => setRows(data))}
        onChange={(e) => {
          const value = e.target.value;
          if (rows.length) update(value);
          else loadIndex().then((data) => (setRows(data), update(value, data)));
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            go(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        aria-keyshortcuts={shortcut ? "/" : undefined}
        className={`peer w-full border border-card-border bg-bg px-3 py-1.5 text-sm text-fg placeholder:text-fg-3 focus:border-link focus:outline-none ${shortcut ? "pr-8" : ""}`}
      />
      {shortcut && !q && (
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 border border-card-border px-1.5 font-display text-[11px] leading-4 text-fg-3 peer-focus:hidden sm:block"
        >
          /
        </kbd>
      )}
      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-50 mt-1 max-h-[70vh] w-full min-w-72 overflow-y-auto panel shadow-xl"
        >
          {results.map((r, i) => (
            <li
              key={r[0]}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => (e.preventDefault(), go(r))}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-1.5 text-sm ${i === active ? "bg-header" : ""}`}
            >
              <span className={`flex min-w-0 items-center gap-2 font-display ${r[4] ? "text-fg-3" : "text-fg"}`}>
                <Flag nation={r[2]} className="h-3" />
                <span className="truncate">{r[1]}</span>
              </span>
              <span className="shrink-0 text-xs text-fg-3">
                {BRANCH_SHORT[r[5] as Branch] ?? r[5]} · {nationName(r[2])} ·{" "}
                <span className="tabular">{formatBr(r[3])}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
