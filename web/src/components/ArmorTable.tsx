import type { ArmorPlate } from "@/lib/data.gen";

const ROWS = [
  { area: "hull_upper", label: "Upper hull" },
  { area: "hull_lower", label: "Lower hull" },
  { area: "turret", label: "Turret" },
] as const;
const FACES = ["front", "side", "rear", "top", "bottom"] as const;
const MATERIAL: Record<string, string> = {
  rolled: "rolled steel",
  cast: "cast steel",
  high_hardness: "high-hardness steel",
  aluminium: "aluminium",
  structural: "structural steel",
  screens: "screens",
  composite: "composite",
};

const mm = (p: ArmorPlate) => (p.min === p.max ? `${fmt(p.max)}` : `${fmt(p.min)}–${fmt(p.max)}`);
const fmt = (v: number) => v.toLocaleString("en", { maximumFractionDigits: 1 });

/**
 * Plate thickness by face, from the game's damage model. Composite faces show no number: their
 * modules' physical thickness says little about protection.
 */
export function ArmorTable({ armor }: { armor: ArmorPlate[] }) {
  const at = (area: string, face = "") => armor.find((p) => p.area === area && (p.face ?? "") === face);
  const mantlet = at("mantlet");
  const composite = at("composite");
  const addon = at("addon");
  return (
    <div className="space-y-3">
      <div className="panel overflow-x-auto">
        <table className="data-table w-full min-w-[560px] text-sm">
          <thead>
            <tr>
              <th scope="col" className="text-left">
                mm
              </th>
              {FACES.map((f) => (
                <th key={f} scope="col" className="text-right capitalize">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.filter((r) => armor.some((p) => p.area === r.area)).map((r) => (
              <tr key={r.area}>
                <th scope="row" className="text-left font-display font-normal text-fg">
                  {r.label}
                </th>
                {FACES.map((f) => {
                  const p = at(r.area, f);
                  return (
                    <td key={f} className="text-right tabular">
                      {!p ? (
                        <span className="text-fg-3">–</span>
                      ) : p.material === "composite" ? (
                        <span className="text-gold">composite</span>
                      ) : (
                        <>
                          <span className="text-fg">{mm(p)}</span>
                          {p.material !== "rolled" && (
                            <span className="block text-[11px] text-fg-3">{MATERIAL[p.material] ?? p.material}</span>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-fg-2">
        {mantlet && (
          <li>
            Gun mantlet: <span className="tabular text-fg">{mm(mantlet)} mm</span>{" "}
            <span className="text-fg-3">({MATERIAL[mantlet.material] ?? mantlet.material})</span>
          </li>
        )}
        {composite && <li>Composite armour modules: <span className="text-gold">yes</span></li>}
        {addon && (
          <li>
            Add-on armour: <span className="tabular text-fg">{mm(addon)} mm</span>
          </li>
        )}
      </ul>
      <p className="text-xs text-fg-3">
        Nominal thickness of the plates on each face, from the game&rsquo;s damage model; a range means plates of different
        thickness. Angles aren&rsquo;t included, so sloped plates protect much better than these numbers suggest.
        Composite and explosive reactive armour can&rsquo;t be summed up as a thickness.
      </p>
    </div>
  );
}
