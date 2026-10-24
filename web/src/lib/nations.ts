export const NATION_NAME: Record<string, string> = {
  usa: "USA",
  germany: "Germany",
  ussr: "USSR",
  britain: "Great Britain",
  japan: "Japan",
  china: "China",
  italy: "Italy",
  france: "France",
  sweden: "Sweden",
  israel: "Israel",
  // Operator flags for vehicles in another nation's tree.
  finland: "Finland",
  south_africa: "South Africa",
  hungary: "Hungary",
  australia: "Australia",
  netherlands: "Netherlands",
  thailand: "Thailand",
  belgium: "Belgium",
  greece: "Greece",
  indonesia: "Indonesia",
};

export function nationName(id: string): string {
  return NATION_NAME[id] ?? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const TYPE_NAME: Record<string, string> = {
  light_tank: "Light tank",
  medium_tank: "Medium tank",
  heavy_tank: "Heavy tank",
  tank_destroyer: "Tank destroyer",
  spaa: "SPAA",
  fighter: "Fighter",
  strike: "Strike aircraft",
  bomber: "Bomber",
  attack_helicopter: "Attack helicopter",
  utility_helicopter: "Utility helicopter",
  other: "Other",
};

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function roman(rank: number): string {
  return ROMAN[rank] ?? String(rank);
}
