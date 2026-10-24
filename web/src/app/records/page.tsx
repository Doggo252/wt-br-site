import type { Metadata } from "next";
import { RecordsTable } from "@/components/RecordsTable";
import { getMeta, getRecords } from "@/lib/data";

export const metadata: Metadata = {
  title: "RB kill records",
  description: "Most kills in one life for every War Thunder ground vehicle in Realistic Battles.",
};

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1MJEjscVDZ1hgU7fHp6dB0levgh6rnpXwOlI7fTBXly0";

export default function RecordsPage() {
  const rows = getRecords();
  const meta = getMeta();
  const withKills = rows.filter((r) => r.kills);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">RB kill records</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          The most ground kills in a single life, per vehicle, in Realistic Battles. {withKills.length} records across{" "}
          {rows.length} vehicles.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-fg-3">
          Records are collected and verified by the community{" "}
          <a href={SHEET_URL} rel="noopener">
            Ground RB Records sheet
          </a>
          . Submit new records there, not here. Uptier only links each record to its vehicle.
        </p>
      </header>
      <RecordsTable rows={rows} nations={meta.nations} />
    </div>
  );
}
