// Smoke and accessibility test against the built site in out/.
// Serves out/ locally, opens one page of each kind, fails on page errors, missing content or
// axe-core violations. Run after `pnpm build`: pnpm smoke
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const OUT = join(import.meta.dirname, "../out");
const AXE = readFileSync(join(import.meta.dirname, "../node_modules/axe-core/axe.min.js"), "utf8");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png" };

// [path, text that must appear]
const PAGES = [
  ["/", "Every BR change"],
  ["/ground/germany/", "Germany"],
  ["/air/usa/", "USA"],
  ["/vehicle/germ_pzkpfw_VI_ausf_h1_tiger/", "Battle Rating history"],
  ["/vehicle/p-51d-5/", "Flight performance"],
  ["/updates/", "Updates"],
  ["/updates/2.57.1.72/", "Update 2.57.1.72"],
  ["/ground/", "Ground forces"],
  ["/announcements/360129/", "October 2026"],
  ["/records/", "Kill records"],
  ["/explore/", "Biggest moves"],
  ["/dev/", "Dev server"],
  ["/about/", "About Uptier"],
  ["/announcements/", "BR announcements"],
  ["/compare/?ids=us_m42_duster,p-51d-5", "M42"],
  ["/lineup/?b=ground&n=germany&br=6.7", "Tiger H1"],
  ["/watchlist/", "Watchlist"],
  ["/market/", "Market prices"],
  ["/patch-notes/", "Patch notes"],
  ["/shells/?br=8.7", "Shell penetration"],
  ["/vehicle/germ_leopard_2a6/", "DM53"],
];

const server = createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  let file = join(OUT, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ executablePath });
let failures = 0;
for (const [path, text] of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  if (!res?.ok()) errors.push(`HTTP ${res?.status()}`);
  if (!(await page.getByText(text).first().isVisible().catch(() => false))) errors.push(`missing text "${text}"`);
  // Phone width (checked before axe, which injects its own elements): nothing may push the page sideways.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(150);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  if (wide > 390) errors.push(`page is ${wide}px wide at a 390px viewport`);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addScriptTag({ content: AXE });
  const axe = await page.evaluate(() => window.axe.run(document, { resultTypes: ["violations"] }));
  for (const v of axe.violations) errors.push(`axe ${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(" ")}`);
  console.log(`${errors.length ? "FAIL" : "ok  "} ${path}`);
  for (const e of errors) console.log(`     ${e}`);
  failures += errors.length ? 1 : 0;
  await page.close();
}
// Interactive states the static pages don't show.
const STATES = [
  ["tree: time machine + lineup highlight", "/ground/germany/", async (p) => {
    await p.getByRole("button", { name: "Time machine" }).click();
    await p.getByText(/Showing the tree as of update/).waitFor();
    await p.getByLabel("Lineup at").selectOption({ index: 5 });
  }],
  ["tree: planned preview", "/ground/germany/", async (p) => {
    const box = p.getByLabel(/Preview .* planned/);
    if (await box.count()) await box.check();
  }],
  ["search open", "/", async (p) => {
    await p.keyboard.press("/");
    await p.keyboard.type("tiger");
    await p.getByRole("option").first().waitFor();
  }],
  ["update filter", "/updates/2.57.1.72/", async (p) => {
    await p.getByLabel("Nation").selectOption("germany");
  }],
];
for (const [name, path, act] of STATES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + path, { waitUntil: "networkidle" });
  await act(page).catch((e) => errors.push(`step failed: ${e.message.split("\n")[0]}`));
  await page.addScriptTag({ content: AXE });
  const axe = await page.evaluate(() => window.axe.run(document, { resultTypes: ["violations"] }));
  for (const v of axe.violations) errors.push(`axe ${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(" ")}`);
  console.log(`${errors.length ? "FAIL" : "ok  "} [${name}]`);
  for (const e of errors) console.log(`     ${e}`);
  failures += errors.length ? 1 : 0;
  await page.close();
}

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
