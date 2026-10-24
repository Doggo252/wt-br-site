import { Arrow } from "./Arrow";
import { formatBr, formatBrDelta, MODE_LABEL, type Mode } from "@/lib/br";

type Props = {
  /** Raw economic rank, not BR. */
  rank: number;
  mode?: Mode;
  /** Rank before the change, to show a ▲/▼ delta. */
  fromRank?: number;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-3xl",
};

export function BrBadge({ rank, mode, fromRank, size = "md" }: Props) {
  const dir = fromRank === undefined || fromRank === rank ? null : rank > fromRank ? "up" : "down";
  return (
    <span className={`inline-flex items-baseline gap-1 font-display tabular ${SIZE[size]}`}>
      {mode && <span className="text-[0.7em] font-semibold text-fg-3">{MODE_LABEL[mode]}</span>}
      <span className="font-semibold text-fg">{formatBr(rank)}</span>
      {dir && fromRank !== undefined && (
        <span
          className={`inline-flex items-center gap-0.5 text-[0.75em] ${dir === "up" ? "text-bad" : "text-good"}`}
          title={`${dir === "up" ? "Uptiered" : "Downtiered"} from ${formatBr(fromRank)}`}
        >
          <Arrow dir={dir} />
          {formatBrDelta(fromRank, rank)}
        </span>
      )}
    </span>
  );
}
