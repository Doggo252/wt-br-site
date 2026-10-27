"use client";

import { Check, Coins, FlaskConical, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { BranchIcon } from "./BranchIcon";
import { Flag } from "./Flag";
import { ModeToggle } from "./ModeToggle";
import { Thumb } from "./Thumb";
import { formatBr } from "@/lib/br";
import { BRANCHES, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { useHangar } from "@/lib/hangar";
import { nationName, roman } from "@/lib/nations";
import { plan, type PlanRow } from "@/lib/research";
import { useMode } from "@/lib/useMode";

type Data = { unlocks: Record<string, Record<string, Record<string, number>>>; rows: PlanRow[] };
const MODE_COL = { ab: 5, rb: 6, sb: 7 } as const;
const fmt = (n: number) => Math.round(n).toLocaleString("en");

export function ResearchPlanner() {
  const [mode, setMode] = useMode();
  const [owned, setOwned, ready] = useHangar();
  const [data, setData] = useState<Data | null>(null);
  const [branch, setBranch] = useState<Branch>("ground");
  const [nation, setNation] = useState("germany");
  const [target, setTarget] = useState<string>("");
  const [rpPerBattle, setRpPerBattle] = useState(1500);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    // Read before the URL effect below rewrites it.
    const id = new URLSearchParams(window.location.search).get("id");
    fetch("/data/planner.json")
      .then((r) => r.json())
      .then((d: Data) => {
        setData(d);
        const row = d.rows.find((r) => r[0] === id);
        if (row) {
          setBranch(row[3] as Branch);
          setNation(row[2]);
          setTarget(row[0]);
        }
      });
  }, []);

  useEffect(() => {
    if (!data) return;
    const url = new URL(window.location.href);
    if (target) url.searchParams.set("id", target);
    else url.searchParams.delete("id");
    window.history.replaceState(null, "", url);
  }, [data, target]);

  const rows = useMemo(() => new Map((data?.rows ?? []).map((r) => [r[0], r])), [data]);
  const nations = useMemo(
    () => [...new Set((data?.rows ?? []).filter((r) => r[3] === branch).map((r) => r[2]))].sort(),
    [data, branch],
  );
  const tree = useMemo(
    () =>
      (data?.rows ?? [])
        .filter((r) => r[3] === branch && r[2] === nation && r[9] === 0)
        .sort((a, b) => a[4] - b[4] || a[6] - b[6] || a[1].localeCompare(b[1])),
    [data, branch, nation],
  );
  const steps = useMemo(
    () => (target && data ? plan(rows, data.unlocks[branch]?.[nation] ?? {}, target, owned) : []),
    [rows, data, branch, nation, target, owned],
  );

  if (!data) return <p className="text-sm text-fg-3">Loading the tech trees…</p>;

  const col = MODE_COL[mode];
  const rp = steps.reduce((n, s) => n + rows.get(s.id)![11], 0);
  const sl = steps.reduce((n, s) => n + rows.get(s.id)![12], 0);
  const crew = steps.reduce((n, s) => n + rows.get(s.id)![13], 0);
  const battles = rp / Math.max(1, rpPerBattle * (premium ? 2 : 1));
  const ranks = [...new Set(steps.map((s) => rows.get(s.id)![4]))];
  const ownedHere = tree.filter((r) => owned.has(r[0])).length;
  const t = rows.get(target);

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-end gap-4 p-3">
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Branch
          <div className="inline-flex panel p-0.5" role="radiogroup" aria-label="Branch">
            {BRANCHES.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={branch === b}
                onClick={() => {
                  setBranch(b);
                  setTarget("");
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 font-display text-sm ${branch === b ? "bg-white/10 text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                <BranchIcon branch={b} className="h-3.5 w-3.5" />
                {BRANCH_SHORT[b]}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Nation
          <select
            value={nations.includes(nation) ? nation : ""}
            onChange={(e) => {
              setNation(e.target.value);
              setTarget("");
            }}
            className={INPUT}
          >
            {!nations.includes(nation) && <option value="">Pick a nation</option>}
            {nations.map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-fg-3">
          I want to research
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${INPUT} max-w-full`}>
            <option value="">Pick a vehicle</option>
            {[...new Set(tree.map((r) => r[4]))].map((rank) => (
              <optgroup key={rank} label={`Rank ${roman(rank)}`}>
                {tree
                  .filter((r) => r[4] === rank)
                  .map((r) => (
                    <option key={r[0]} value={r[0]}>
                      {r[1]} ({formatBr(r[col])})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Mode
          <ModeToggle value={mode} onChange={setMode} />
        </div>
      </div>

      {!t ? (
        <p className="panel p-4 text-sm text-fg-2">
          Pick the vehicle you&rsquo;re aiming for. The plan lists every vehicle you need to research on the way, including
          extra ones when a rank needs more vehicles of the rank before it, and leaves out the ones you tick as owned.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile icon={FlaskConical} label="Research points" value={fmt(rp)} note={`${steps.length} vehicles`} />
            <Tile icon={Coins} label="Silver Lions to buy them" value={fmt(sl)} note={`plus ${fmt(crew)} SL crew training`} />
            <Tile
              icon={Swords}
              label="Battles, roughly"
              value={fmt(Math.ceil(battles))}
              note={`at ${fmt(rpPerBattle * (premium ? 2 : 1))} RP a battle`}
            />
            <div className="panel space-y-2 p-3 text-sm">
              <label className="flex items-center justify-between gap-2 text-fg-2">
                RP per battle
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={rpPerBattle}
                  onChange={(e) => setRpPerBattle(Math.max(100, Number(e.target.value) || 0))}
                  className={`${INPUT} w-24 text-right tabular`}
                />
              </label>
              <label className="flex items-center gap-2 text-fg-2">
                <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
                Premium account (double RP)
              </label>
            </div>
          </div>

          {steps.length === 0 ? (
            <p className="panel p-4 text-sm text-fg-2">
              Nothing left to research: you own everything on the way to {t[1]}.
            </p>
          ) : (
            <ol className="space-y-4">
              {ranks.map((rank) => (
                <li key={rank} className="panel">
                  <h2 className="border-b border-card-border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-fg-3">
                    Rank {roman(rank)}
                  </h2>
                  <ul className="divide-y divide-card-border text-sm">
                    {steps
                      .filter((s) => rows.get(s.id)![4] === rank)
                      .map((s) => {
                        const r = rows.get(s.id)!;
                        return (
                          <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                            <span className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1">
                              <Thumb id={r[0]} image={!!r[8]} />
                              <Flag nation={r[2]} labelled className="h-3 shrink-0" />
                              <Link href={`/vehicle/${r[0]}/`} className="min-w-0 truncate font-display">
                                {r[1]}
                              </Link>
                              <span className="shrink-0 tabular text-xs text-fg-3">{formatBr(r[col])}</span>
                              {s.id === target && (
                                <span className="shrink-0 border border-gold/60 px-1 font-display text-[10px] uppercase tracking-wider text-gold">
                                  Goal
                                </span>
                              )}
                              {s.forRank && (
                                <span className="shrink-0 text-xs text-fg-3">to open rank {roman(s.forRank)}</span>
                              )}
                              {s.via && (
                                <span className="min-w-0 truncate text-xs text-fg-3">
                                  on the way to {rows.get(s.via)![1]}
                                </span>
                              )}
                            </span>
                            <span className="tabular text-fg-2 sm:w-28 sm:text-right">{fmt(r[11])} RP</span>
                            <span className="tabular text-fg-2 sm:w-28 sm:text-right">{fmt(r[12])} SL</span>
                            <button
                              type="button"
                              className="btn gap-1 px-2 py-0.5 text-xs"
                              onClick={() => setOwned([r[0]], true)}
                              title="Mark as owned: it drops out of the plan"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden />I have it
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <p className="text-xs text-fg-3">
        {ready && ownedHere > 0 ? (
          <>
            You&rsquo;ve marked {ownedHere} {nationName(nation)} {BRANCH_SHORT[branch].toLowerCase()} vehicles as owned.{" "}
            <button
              type="button"
              className="text-link underline"
              onClick={() =>
                setOwned(
                  tree.map((r) => r[0]),
                  false,
                )
              }
            >
              Clear them
            </button>
            .{" "}
          </>
        ) : null}
        Costs are from the game files (research points and Silver Lions, before discounts). Rank requirements come from
        the game: you need a set number of vehicles of one rank to open the next, and premiums you own count too. RP per
        battle varies a lot with your play; set your own.
      </p>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="panel p-3">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-fg-3">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1 font-display text-2xl tabular text-fg">{value}</p>
      <p className="text-xs text-fg-3">{note}</p>
    </div>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
