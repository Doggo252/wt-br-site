import { CREW_LABEL, type CrewRole, type Sight } from "@/lib/units";

const CREW_SHORT: Record<CrewRole, string> = {
  commander: "CMD",
  gunner: "GNR",
  driver: "DRV",
};

/** Higher generations get brighter chips so they stand out in a row. */
const GEN_STYLE: Record<1 | 2 | 3, string> = {
  1: "border-header text-fg-2",
  2: "border-link/40 text-link",
  3: "border-gold/50 text-gold",
};

export function ThermalChip({ crew, sight }: { crew: CrewRole; sight: Sight }) {
  let value: string;
  let style: string;
  let title: string;

  if (sight.kind === "thermal" && sight.gen) {
    value = `Gen ${sight.gen}`;
    style = GEN_STYLE[sight.gen];
    title = `Thermal Gen ${sight.gen}`;
  } else if (sight.kind === "thermal") {
    // A resolution we haven't mapped to a generation yet: show it raw.
    value = sight.resolution ? `${sight.resolution[0]}×${sight.resolution[1]}` : "Thermal";
    style = "border-header text-fg-2";
    title = "Thermal, generation unknown";
  } else if (sight.kind === "nv") {
    value = "NV";
    style = "border-header text-fg-3";
    title = "Night vision (image intensifier)";
  } else {
    value = "—";
    style = "border-header/60 text-fg-3";
    title = "No night sight";
  }

  if (sight.kind === "thermal" && sight.resolution) {
    title += ` (${sight.resolution[0]}×${sight.resolution[1]})`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border bg-panel px-1.5 py-0.5 font-display text-xs tabular ${style}`}
      title={`${CREW_LABEL[crew]}: ${title}`}
    >
      <span className="text-[10px] font-semibold text-fg-3">{CREW_SHORT[crew]}</span>
      <span>{value}</span>
      <span className="sr-only">{`${CREW_LABEL[crew]}: ${title}`}</span>
    </span>
  );
}
