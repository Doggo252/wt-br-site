"use client";

import Link from "@/components/Link";
import { useEffect, useState } from "react";
import { plural } from "@/lib/format";

const KEY = "uptier.lastSeen";

/** [version, BR changes, vehicles added] for recent versions, oldest first. */
type Recent = [string, number, number][];

/**
 * "2 updates since your last visit": compares the newest version with the one stored on the
 * previous visit, then stores the newest. Shows nothing on a first visit.
 */
export function SinceLastVisit({ recent }: { recent: Recent }) {
  const [missed, setMissed] = useState<Recent | null>(null);

  useEffect(() => {
    const latest = recent[recent.length - 1]?.[0];
    if (!latest) return;
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(KEY);
      localStorage.setItem(KEY, latest);
    } catch {}
    if (!seen || seen === latest) return;
    const i = recent.findIndex((r) => r[0] === seen);
    // Older than the window we were given: everything in it is new.
    const after = (i >= 0 ? recent.slice(i + 1) : recent).filter((r) => r[1] || r[2]);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists on the client
    if (after.length) setMissed(after);
  }, [recent]);

  if (!missed) return null;
  const changes = missed.reduce((n, r) => n + r[1], 0);
  const added = missed.reduce((n, r) => n + r[2], 0);
  const first = missed[0][0];
  return (
    <Link
      href={`/updates/${missed[missed.length - 1][0]}/`}
      className="panel block px-4 py-3 text-sm hover:brightness-110"
    >
      <span className="eyebrow">Since your last visit</span>{" "}
      <span className="text-fg">
        {plural(missed.length, "update")} ({first}
        {missed.length > 1 ? ` to ${missed[missed.length - 1][0]}` : ""}): {plural(changes, "BR change")}
        {added ? `, ${plural(added, "vehicle")} added` : ""}.
      </span>
    </Link>
  );
}
