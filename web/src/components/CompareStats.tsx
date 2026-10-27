"use client";

import { useEffect, useState } from "react";
import Link from "@/components/Link";
import { METRICS } from "@/lib/rankings";

/** app/data/rankings.json/route.ts: [id, name, nation, branch, ab, rb, sb, image, status, ...metric values] */
type Row = [
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  0 | 1,
  number,
  ...(number | null)[],
];
const FIRST_METRIC = 9;

type Data = { metrics: string[]; rows: Row[] };
let cache: Promise<Data> | null = null;
const load = (): Promise<Data> =>
  (cache ??= fetch("/data/rankings.json").then((r) => r.json()));

/** The stats from the rankings, one column per vehicle, best value in each row picked out. */
export function CompareStats({
  ids,
  names,
}: {
  ids: string[];
  names: Record<string, string>;
}) {
  const [data, setData] = useState<{
    metrics: string[];
    byId: Map<string, Row>;
  } | null>(null);

  useEffect(() => {
    load().then((d) =>
      setData({
        metrics: d.metrics,
        byId: new Map(d.rows.map((r: Row) => [r[0], r])),
      }),
    );
  }, []);

  if (!data || !ids.length) return null;
  const rows = METRICS.filter((m) => !m.noCompare)
    .map((m) => {
      const i = FIRST_METRIC + data.metrics.indexOf(m.key);
      const values = ids.map(
        (id) => (data.byId.get(id)?.[i] as number | null | undefined) ?? null,
      );
      const known = values.filter((v): v is number => v != null);
      const better =
        m.better === undefined ? (m.dir === "desc" ? "high" : "low") : m.better;
      const best =
        known.length > 1 && better && new Set(known).size > 1
          ? better === "high"
            ? Math.max(...known)
            : Math.min(...known)
          : null;
      return { m, values, best };
    })
    .filter((r) => r.values.some((v) => v != null));
  if (!rows.length) return null;

  return (
    <div className="panel overflow-x-auto">
      <table className="data-table w-full min-w-[480px] text-sm">
        <caption className="sr-only">Stats side by side</caption>
        <thead>
          <tr>
            <th scope="col" className="text-left">
              Stat
            </th>
            {ids.map((id) => (
              <th key={id} scope="col" className="text-right">
                <Link
                  href={`/vehicle/${id}/`}
                  className="normal-case tracking-normal"
                >
                  {names[id] ?? id}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ m, values, best }) => (
            <tr key={m.key}>
              <th scope="row" className="text-left font-normal text-fg-2">
                {m.label}
              </th>
              {values.map((v, i) => (
                <td
                  key={ids[i]}
                  className={`text-right tabular ${v != null && v === best ? "font-semibold text-gold" : "text-fg"}`}
                >
                  {v == null ? (
                    <span className="text-fg-3">–</span>
                  ) : (
                    <>
                      {v.toLocaleString("en", {
                        maximumFractionDigits: m.digits ?? 0,
                      })}
                      <span className="ml-0.5 text-xs text-fg-3">{m.unit}</span>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
