// Render public/og.png (1200×630 share card) from the built site's CSS and images.
// Needs `pnpm build` first and a static server on out/: node scripts/make_og.mjs [baseUrl]
import { readdirSync, writeFileSync, unlinkSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:4321";
const css = readdirSync("out/_next/static/chunks").filter((f) => f.endsWith(".css"));
const html = `<!doctype html><html><head>${css.map((f) => `<link rel="stylesheet" href="/_next/static/chunks/${f}">`).join("")}
<style>
  body{margin:0;width:1200px;height:630px;overflow:hidden}
  .card{position:relative;width:1200px;height:630px;background:radial-gradient(ellipse 60% 70% at 72% 55%,rgb(23 203 252/.10),transparent 70%),linear-gradient(160deg,#1b2329,#11141a 60%)}
  .tank{position:absolute;filter:drop-shadow(0 18px 18px rgb(0 0 0/.6))}
</style></head><body>
<div class="card">
  <img class="tank" src="/img/units/ussr_t_80bvm.webp" style="right:30px;top:90px;width:560px">
  <img class="tank" src="/img/units/germ_pzkpfw_VI_ausf_h1_tiger.webp" style="right:250px;top:330px;width:380px">
  <div style="position:absolute;left:72px;top:64px">
    <svg viewBox="0 0 24 24" width="56" height="56"><path d="M4 13 12 6l8 7" fill="none" stroke="#F9DB78" stroke-width="2.6" stroke-linecap="square"/><path d="M4 19 12 12l8 7" fill="none" stroke="#F9DB78" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="square"/></svg>
    <div class="font-display" style="font-size:40px;font-weight:700;letter-spacing:.14em;color:#fff;margin-top:8px">UPTIER</div>
  </div>
  <div style="position:absolute;left:72px;top:250px;width:620px">
    <div class="font-display" style="font-size:22px;font-weight:600;letter-spacing:.12em;color:#F9DB78">WAR THUNDER BATTLE RATING HISTORY</div>
    <div class="font-display" style="font-size:72px;font-weight:700;line-height:1.02;color:#fff;margin-top:14px">Every BR change,<br><span style="color:#F9DB78">patch by patch.</span></div>
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,transparent,#F9DB78,transparent)"></div>
</div></body></html>`;

writeFileSync("out/__og.html", html);
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`${base}/__og.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "public/og.png" });
  await browser.close();
} finally {
  unlinkSync("out/__og.html");
}
console.log("wrote public/og.png");
