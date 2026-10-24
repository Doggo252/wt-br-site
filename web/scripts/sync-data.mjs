// Copies the ETL's client-side data (../data/public) to public/data so the static
// site can fetch it at runtime (the tech tree's patch slider).
import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const src = join(import.meta.dirname, "../../data/public");
const dest = join(import.meta.dirname, "../public/data");
rmSync(dest, { recursive: true, force: true });
if (existsSync(src)) {
  cpSync(src, dest, { recursive: true });
  console.log("synced data/public -> web/public/data");
} else {
  console.warn("data/public missing: run the ETL (wtbr build) first");
}
