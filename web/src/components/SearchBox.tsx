"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { formatBr } from "@/lib/br";
import { BRANCH_SHORT, type Branch } from "@/lib/branches";
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

function search(rows: Row[], q: string, limit = 8): Row[] {
  const nq = norm(q);
  if (!nq) return [];
  const scored: [number, Row][] = [];
  for (const r of rows) {
    const n = norm(r[1]);
    let score = -1;
    if (n === nq) score = 0;
    else if (n.startsWith(nq)) score = 1;
    else if (n.includes(nq)) score = 2;
    else if (norm(r[0]).includes(nq)) score = 3;
    if (score >= 0) scored.push([score + r[4] * 0.5, r]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1][1].length - b[1][1].length);
  return scored.slice(0, limit).map((s) => s[1]);
}

export function SearchBox({
  className = "",
  onSelect,
  placeholder = "Search vehicles and aircraft",
}: {
  className?: string;
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
        className="w-full border border-card-border bg-bg px-3 py-1.5 text-sm text-fg placeholder:text-fg-3 focus:border-link focus:outline-none"
      />
      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-full min-w-72 border border-card-border bg-panel shadow-xl"
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
              <span className={`truncate font-display ${r[4] ? "text-fg-3" : "text-fg"}`}>{r[1]}</span>
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
