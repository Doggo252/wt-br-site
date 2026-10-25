"use client";

import { useState } from "react";
import { nationName } from "@/lib/nations";
import { useWatchlist } from "@/lib/watchlist";

/**
 * Filters the server-rendered update page with a generated stylesheet: sections carry
 * data-branch, nation blocks data-nation and rows data-unit (added/removed cards carry both).
 */
export function UpdateFilter({ nations, ids }: { nations: string[]; ids: string[] }) {
  const [nation, setNation] = useState("");
  const [watchedOnly, setWatchedOnly] = useState(false);
  const [list, , ready] = useWatchlist();
  const watched = ids.filter((id) => list[id]);

  const rules: string[] = [];
  if (nation) {
    const sel = `[data-nation="${CSS.escape(nation)}"]`;
    rules.push(`[data-nation]:not(${sel}), [data-branch]:not(:has(${sel})) { display: none }`);
  }
  // Only while something on this page is watched (the list can empty from another tab).
  if (watchedOnly && watched.length) {
    const sel = watched.map((id) => `[data-unit="${CSS.escape(id)}"]`).join(",");
    rules.push(
      `[data-unit]:not(${sel}), [data-nation]:not(:has(${sel})):not(${sel}), [data-branch]:not(:has(${sel})) { display: none }`,
    );
  }

  return (
    <div className="panel flex flex-wrap items-center gap-x-5 gap-y-2 p-3 text-sm">
      {rules.length > 0 && <style>{rules.join("\n")}</style>}
      <label className="flex items-center gap-2 text-fg-2">
        Nation
        <select
          value={nation}
          onChange={(e) => setNation(e.target.value)}
          className="border border-card-border bg-bg px-2 py-1 text-sm text-fg focus:border-link focus:outline-none"
        >
          <option value="">All nations</option>
          {nations.map((n) => (
            <option key={n} value={n}>
              {nationName(n)}
            </option>
          ))}
        </select>
      </label>
      {ready && watched.length > 0 && (
        <label className="flex cursor-pointer items-center gap-2 text-fg-2">
          <input
            type="checkbox"
            checked={watchedOnly}
            onChange={(e) => setWatchedOnly(e.target.checked)}
            className="accent-link"
          />
          Only my watchlist ({watched.length})
        </label>
      )}
    </div>
  );
}
