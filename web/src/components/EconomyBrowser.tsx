"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { BranchIcon } from "./BranchIcon";
import { Flag } from "./Flag";
import { ModeToggle } from "./ModeToggle";
import { Thumb } from "./Thumb";
import { formatBr } from "@/lib/br";
import { BRANCHES, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { nationName } from "@/lib/nations";
import { useMode } from "@/lib/useMode";

/** app/data/economy.json/route.ts */
type Row = [
  string, string, string, Branch, number, number, number, 0 | 1, number,
  number, number, number, number, number, number, number, number, number, number,
]; // prettier-ignore
const MODE_I = { ab: 0, rb: 1, sb: 2 } as const;
const BR_COL = { ab: 4, rb: 5, sb: 6 } as const;
const PAGE = 100;
const fmt = (n: number) => Math.round(n).toLocaleString("en");
const brToRank = (br: string) => Math.round((Number(br) - 1) * 3);
/** A numeric column picked by computed index. */
const num = (r: Row, i: number) => r[i] as number;

type Sort = "net" | "mult" | "repair" | "breakeven";

/**
 * Silver Lion economy by vehicle: reward multiplier, repair cost, the earnings that break even on
 * a death, and an estimate of net SL per battle from the player's own numbers.
 */
export function EconomyBrowser() {
  const [mode, setMode] = useMode();
  const [rows, setRows] = useState<Row[]>([]);
  const [branch, setBranch] = useState<Branch>("ground");
  const [rank, setRank] = useState<number | null>(null);
  const [nation, setNation] = useState("");
  const [status, setStatus] = useState(-1); // index into tree, premium, squadron, event; -1 = all
  const [earn, setEarn] = useState(8000);
  const [deaths, setDeaths] = useState(1);
  const [premium, setPremium] = useState(false);
  const [upgraded, setUpgraded] = useState(true);
  const [sort, setSort] = useState<Sort>("net");
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- the URL only exists on the client */
    const b = p.get("b") as Branch | null;
    if (b && BRANCHES.includes(b)) setBranch(b);
    if (p.get("br")) setRank(brToRank(p.get("br")!));
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/data/economy.json")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  const m = MODE_I[mode];
  const col = BR_COL[mode];
  const nations = useMemo(() => [...new Set(rows.filter((r) => r[3] === branch).map((r) => r[2]))].sort(), [rows, branch]);
  const shown = useMemo(() => {
    const mul = (r: Row) => num(r, 9 + m) / 100;
    const repair = (r: Row) => num(r, upgraded ? 15 + m : 12 + m);
    const net = (r: Row) => earn * mul(r) * (premium ? 2 : 1) - repair(r) * deaths;
    const breakeven = (r: Row) => (mul(r) ? repair(r) / (mul(r) * (premium ? 2 : 1)) : Infinity);
    return rows
      .filter(
        (r) =>
          r[3] === branch &&
          (!nation || r[2] === nation) &&
          (status < 0 || r[8] === status) &&
          (rank === null || Math.abs(num(r, col) - rank) <= 3) &&
          num(r, 9 + m) > 0,
      )
      .map((r) => ({ r, mul: mul(r), repair: repair(r), net: net(r), breakeven: breakeven(r) }))
      .sort((a, b) =>
        sort === "net"
          ? b.net - a.net
          : sort === "mult"
            ? b.mul - a.mul
            : sort === "repair"
              ? a.repair - b.repair
              : a.breakeven - b.breakeven,
      );
  }, [rows, branch, nation, status, rank, col, m, earn, deaths, premium, upgraded, sort]);

  if (!rows.length) return <p className="text-sm text-fg-3">Loading the economy…</p>;

  return (
    <div className="space-y-4">
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
                onClick={() => setBranch(b)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 font-display text-sm ${branch === b ? "bg-white/10 text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                <BranchIcon branch={b} className="h-3.5 w-3.5" />
                {BRANCH_SHORT[b]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Mode
          <ModeToggle value={mode} onChange={setMode} />
        </div>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Battle Rating (± 1.0)
          <select
            value={rank ?? ""}
            onChange={(e) => setRank(e.target.value === "" ? null : Number(e.target.value))}
            className={INPUT}
          >
            <option value="">Any</option>
            {Array.from({ length: 40 }, (_, r) => (
              <option key={r} value={r}>
                {formatBr(r)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Vehicles
          <select value={status} onChange={(e) => setStatus(Number(e.target.value))} className={INPUT}>
            <option value={-1}>All</option>
            <option value={0}>Tech tree</option>
            <option value={1}>Premium</option>
            <option value={2}>Squadron</option>
            <option value={3}>Event</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Nation
          <select value={nation} onChange={(e) => setNation(e.target.value)} className={INPUT}>
            <option value="">All</option>
            {nations.map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="panel flex flex-wrap items-end gap-4 p-3">
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          SL you earn a battle, before multipliers
          <input
            type="number"
            min={0}
            step={500}
            value={earn}
            onChange={(e) => setEarn(Math.max(0, Number(e.target.value) || 0))}
            className={`${INPUT} w-36 text-right tabular`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Deaths a battle
          <input
            type="number"
            min={0}
            step={0.1}
            value={deaths}
            onChange={(e) => setDeaths(Math.max(0, Number(e.target.value) || 0))}
            className={`${INPUT} w-24 text-right tabular`}
          />
        </label>
        <label className="flex items-center gap-2 self-center text-sm text-fg-2">
          <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
          Premium account (double SL)
        </label>
        <label className="flex items-center gap-2 self-center text-sm text-fg-2">
          <input type="checkbox" checked={upgraded} onChange={(e) => setUpgraded(e.target.checked)} />
          Fully upgraded repair cost
        </label>
        <label className="ml-auto flex flex-col gap-1 text-xs text-fg-3">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={INPUT}>
            <option value="net">Estimated net SL</option>
            <option value="mult">SL multiplier</option>
            <option value="repair">Cheapest repair</option>
            <option value="breakeven">Lowest break-even</option>
          </select>
        </label>
      </div>

      <div className="panel overflow-x-auto">
        <table className="data-table w-full min-w-[720px] whitespace-nowrap text-sm">
          <thead>
            <tr>
              <th scope="col">Vehicle</th>
              <th scope="col" className="text-right">
                BR
              </th>
              <th scope="col" className="text-right">
                SL ×
              </th>
              <th scope="col" className="text-right">
                Repair
              </th>
              <th scope="col" className="text-right" title="SL to earn before multipliers to pay for one death">
                Break-even
              </th>
              <th scope="col" className="text-right">
                Net a battle
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, limit).map(({ r, mul, repair, net, breakeven }) => (
              <tr key={r[0]}>
                <td>
                  <Link href={`/vehicle/${r[0]}/`} className="flex items-center gap-2 font-display">
                    <Thumb id={r[0]} image={!!r[7]} />
                    <Flag nation={r[2]} labelled className="h-3" />
                    <span className={r[8] === 0 ? "" : r[8] === 2 ? "text-squadron" : "text-premium"}>{r[1]}</span>
                  </Link>
                </td>
                <td className="text-right tabular">{formatBr(num(r, col))}</td>
                <td className="text-right tabular">{Math.round(mul * 100)}%</td>
                <td className="text-right tabular text-fg-2">{fmt(repair)}</td>
                <td className="text-right tabular text-fg-2">{Number.isFinite(breakeven) ? fmt(breakeven) : "–"}</td>
                <td className={`text-right font-semibold tabular ${net >= 0 ? "text-good" : "text-bad"}`}>
                  {net >= 0 ? "+" : "−"}
                  {fmt(Math.abs(net))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length > limit && (
        <div className="text-center">
          <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE * 2)}>
            Show more ({shown.length - limit} left)
          </button>
        </div>
      )}
      <p className="text-xs text-fg-3">
        Multipliers and repair costs are the game&rsquo;s. Net = your earnings × the vehicle&rsquo;s SL multiplier (× 2
        with premium) − repair × deaths; it leaves out ammunition, boosters and the first-win bonus. Break-even is
        how much you must earn before multipliers to pay for one death. Your own earnings per battle are on the
        battle results screen.
      </p>
    </div>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
