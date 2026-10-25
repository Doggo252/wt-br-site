# Uptier — War Thunder BR History: Project Plan

A fan site showing the Battle Rating (BR) history of every War Thunder vehicle. Tanks come first and aircraft are added later as a module. No other site shows per-vehicle BR history, so that is the core feature. The tech tree, stats, thermals and records exist to support it.

Status: every build step (1–5) is built for ground, air and helicopters. See "Progress" below.

## Progress

| Step | State | Notes |
|---|---|---|
| 1. Scaffold, design system | Done | `/design` style guide. Glyph font still missing (see §2). |
| 2. Current vehicles, vehicle pages | Done | 1,242 ground vehicles in 10 nations; 1,235 images mirrored (7 have none on the CDN). |
| 3. BR history | Done | 221 versions with ground changes since 2020-03, 91 of them with BR changes; time machine rewinds layout and BRs. |
| 4. Records | Done | 1,215/1,215 sheet rows matched (40 via `etl/manual/records.toml`). Maintainers not yet contacted. |
| 5a. Explore | Mostly done | Biggest moves, most changed, thermal finder, top BR over time. |
| 5b. Official sheets | Done | 21 forum posts (2023-08 onward) via the Discourse API; 17 tables still published. 2,618 rows, all matched to vehicles. Planned changes are judged 45 days later: 97% went live as announced. The four 2023–Jan 2024 tables are unpublished (Wayback is a possible fallback). |
| 5c. Air | Done | Aviation (1,364) and helicopters (115): trees, history, time machine, flight stats from the in-game stat card. Killstreak/nuke units excluded. |
| Pre-2020 (ControlNet) | Deferred | Only covers 2019-11 to 2020-03, keyed by wiki names, and the data repo is AGPL-3.0. Needs a licensing decision. |
| Infra | Done, not live | CI, daily deploy workflow, validation. Needs push access and a Firebase project. |

### What the real data showed (replaces the **(verify)** guesses)
- `shop.blkx` gives the tree: `country_x.army.range` is a list of columns (2020–2022 files use a list of `{range: column}` instead). Folders are nested dicts. Group names are `shop/group/<id>` in `units.csv`.
- Ground vehicles in `wpcost.blkx`: `unitMoveType` is `tank`, `heavy_tank` or `wheeled_vehicle`. Squadron: `researchType = clanVehicle` / shop `isClanVehicle`. Event: shop/wpcost `event` or `marketplaceItemdefId`. Premium: `costGold` or `gift`.
- Types come from `unittags.blkx` `type_*` tags; operator flags from extra `country_*` tags. Armor (hull/turret front/side/rear) is in `unittags.blkx` `Shop`.
- Tank model files are lower-case IDs; so are encyclopedia image URLs.
- Night vision: `nightVision.{gunner,commanderView,driver}{Thermal,Ir}` in the model, with thermals often added by the `night_vision_system` modification. IR also uses 800×600 / 1600×1200.
- The datamine mixes in dev-server builds. A commit counts as live only if no later commit has a lower version.
- Full history fits in a ~170 MB blobless clone plus one batched fetch of every `wpcost`/`shop` version (~25 MB once extracted).
- `symbols_skyquake.ttf` is not in the datamine; only the client's packed `ui/fonts.vromfs.bin` has it.

Items marked **(verify)** are assumptions to confirm against real data in the step that first needs them. They are not settled facts.

---

## 1. Goals and non-goals

### Goals
- Show every ground vehicle's AB/RB/SB BR at every game version since 2019-11, with a change log that names the patch for each change.
- Have a tech tree that can be rewound to any patch (the "time machine").
- Show a per-patch BR diff for every update.
- Show per-crew thermal generation for each vehicle, and let users search by it.
- Show RB records for each vehicle, with credit to the records sheet.
- Make it feel like the game's own UI, dark only.
- Keep the site fully static and cheap to host, rebuilt daily without manual work.
- Design the data model for every branch (ground, air, heli, naval) from day one, even though only ground ships first.

### Non-goals for v1
- User accounts, comments, or anything that needs a server.
- Armor or penetration simulation, or full modification and economy data.
- Live player statistics (that is StatShark/Thunderskill territory).
- Naval and helicopters. The schema supports them, but the UI doesn't show them yet.
- Translations. The site is English only, though the ETL keeps the other language columns for later.

---

## 2. Data sources

| # | Source | What we take | Coverage |
|---|---|---|---|
| S1 | `gszabi99/War-Thunder-Datamine`, `char.vromfs.bin_u/config/wpcost.blkx` | `economicRankArcade/Historical/Simulation`, plus premium/squadron/cost flags | 1.95.1.7 (2020-03) to 2.59.0.86, and later as new versions land |
| S2 | same repo, `char.vromfs.bin_u/config/shop.blkx` **(verify)** | Tech-tree layout: nation, rank, column, folders/groups, research order | same |
| S3 | same repo, `char.vromfs.bin_u/config/unittags.blkx` **(verify)** | Unit type (light tank, MBT, tank destroyer, SPAA, …) and branch tags | same |
| S4 | same repo, `lang.vromfs.bin_u/lang/units.csv` | Display names from the `<id>_shop` rows (short) and the `<id>_0` rows (long) **(verify)**, including in-game glyphs | same |
| S5 | same repo, `aces.vromfs.bin_u/gamedata/units/tankmodels/<id>.blkx` | Stats and per-crew sights/thermals | current, plus history if it's cheap |
| S6 | `https://static.encyclopedia.warthunder.com/images/<id>.png` | 512×256 vehicle images | current vehicles only |
| S7 | ControlNet `wt-data-project.data`, `wk/` CSVs | BRs before the datamine history starts | 2019-11 to 2020-03 |
| S8 | Forum "br-changes" posts → Gaijin's published Google Sheets (2PACX), plus the Wayback Machine for older ones | Planned vs implemented BR changes | 2020-08 to now |
| S9 | RB records sheet `1MJEjscVDZ1hgU7fHp6dB0levgh6rnpXwOlI7fTBXly0`, read per nation tab via `gviz/tq?tqx=out:csv&sheet=<Nation>` | About 1,215 records, 95.81% vehicle coverage | current |
| S10 | Datamine `symbols_skyquake.ttf` | Glyphs used in vehicle names | current |

### Source notes
- **BR conversion:** BR = rank/3 + 1, shown to one decimal (1.0, 1.3, 1.7, 2.0, …). Store the raw integer rank and convert only for display, so there are no float drift bugs. Don't hard-code a BR cap.
- **Versions:** The datamine has one commit per client version. The ETL maps each commit to `{version, commit_sha, date}`. A major update (where the second number changes) gets a human name such as "Firebirds" from a hand-kept `etl/manual/updates.yaml`.
- **Clone strategy:** use `git clone --filter=blob:none`, then `git log --format=... -- <file>` to list only the commits that touched each file, then `git show <sha>:<path>`. This fetches only blobs we need. Cache the clone in CI.
- **IDs:** datamine IDs are case-sensitive and permanent within the datamine. Renames and re-IDs are handled by a manual alias file (`etl/manual/id_aliases.yaml`).
- **S7 → S1 join:** check how ControlNet identifies vehicles **(verify)**. If it uses names rather than IDs, build a mapping with fuzzy matching plus manual overrides.
- **S8 sheets:** formats differ between years. Parse them semi-automatically and check the results by hand. They're stored as curated data in `etl/manual/official_changes/<date>.csv`, not re-scraped every day.
- **S9 records:** the emoji/glyph to datamine-ID mapping goes in `etl/manual/records_aliases.yaml`:
  - 🌩️ → ◍ (the 6 `_sm` vehicles)
  - 🐾Tiger → ␠ (`germ_pzkpfw_VI_ausf_h1_tiger_animal_version`)
  - ★T-III → ▂ (`ussr_pzkpfw_III_ausf_J_L42`)
  - YouTube Cup → ␙ (`us_m1a1_abrams_yt_cup_2019`)
  - ◇M4 → `us_m4_sherman_promo`
  - Any record that doesn't match fails the ETL with a list of names, so nothing is silently dropped.
- **Thermals:** map resolutions to generations: 500×300 = Gen 1, 800×600 = Gen 2, 1200×800 = Gen 3. An unknown resolution is logged as a warning and shown raw ("Thermal 1600×900") until it is mapped. Track each crew position separately (commander, gunner, driver) and keep night vision (IR/image intensifier) separate from thermal.

### Licensing and permissions (resolve before launch)
- **Gaijin content:** follow Gaijin's fan-site/content guidelines. Show a "not affiliated with Gaijin" disclaimer on every page. No ads that suggest an official connection.
- **Images (S6):** mirror at build time to WebP, with attribution, and stop if Gaijin objects. (Default chosen; hotlinking would tie us to their CDN's uptime and referrer policy.)
- **Game font (S10):** `symbols_skyquake.ttf` is **not in the datamine**. The datamine only has the index of the client's packed font archive (`gui.vromfs.bin_u/idx/ui/fonts.vromfs.bin`). The font ships in the game client's `ui/fonts.vromfs.bin`, so it has to be extracted from a game install (see `web/public/fonts/README.md`). Until then, the glyphs fall back to system fonts. Redistributing it is a legal gray area: subset it to the needed glyphs, or draw our own SVG versions. Decide before launch.
- **Records sheet (S9):** contact the maintainers before launch. Get permission, agree on attribution wording, and offer a link back.
- **Datamine and ControlNet:** check each repo's license and credit them in the footer and on the About page.
- **Fonts:** Fira Sans Condensed and PT Sans are both under the OFL and can be self-hosted.

---

## 3. Data model

All branches (ground, air, heli, naval) share one model. The `branch` field controls what the UI shows.

Pydantic models in `etl/` are the single source of truth. They export JSON Schema, and TypeScript types are generated from that schema (`json-schema-to-typescript`), so the ETL and the site can't drift apart.

### `data/versions.json`
```
[{ version: "2.59.0.86", date: "2026-…", sha: "…", major: "2.59", name: "…", isMajor: bool }]
```

### `data/units/index.json`
A light list used by the tech tree, search and explore pages:
```
{ id, branch, nation, rank, type, name, nameShort, status: "tree"|"premium"|"squadron"|"event"|"removed",
  br: { ab, rb, sb },               // current, as raw economic ranks
  added: version, removed?: version,
  thermal: { gunner?: gen, commander?: gen, driver?: gen },
  hasRecord: bool, image: path }
```

### `data/units/<id>.json`
The full detail for a vehicle page:
```
{ ...index fields,
  history: [{ version, ab, rb, sb }],        // change points only, not every version
  officialChanges: [{ date, mode, from, to, planned: bool, implemented: bool }],
  stats: { massT, enginePowerHp, pwr, maxSpeedFwd, maxSpeedRev, crew, reloadS?, ... },
  sights: [{ crew: "gunner", type: "thermal", resolution: [w,h], gen: 2 }, ...],
  record?: { mode: "RB", kills, player?, date?, source: "records-sheet" },
  sameBr: { rb: [ids...] }                    // precomputed for the vehicle page strip
}
```

### `data/updates/<version>.json`
```
{ version, date, name, changes: [{ id, mode, from, to }], added: [ids], removed: [ids] }
```
Only versions that actually change something get a file.

### `data/tree/<nation>@<version>.json` (time machine)
**Decided: the time machine rewinds both the tree layout and the BRs.** Layout comes from `shop.blkx` at each version. To keep the file count down, emit one layout file per change to `shop.blkx`, not per patch. BRs for any version are applied client-side from `history`. Removed and event vehicles appear in the tree, greyed out.

### Size budget
About 1,000 ground vehicles × about 30 change points each is tiny. The aim is under 5 MB for all ground data, and under 50 KB gzipped for any single page's JSON.

---

## 4. ETL pipeline (`etl/`)

Python 3.12, managed with `uv`. Each stage is separate and caches its output so it can be rerun.

```
etl/
  fetch/       datamine.py (blobless clone + per-file commit list), sheets.py, controlnet.py, images.py
  parse/       blk.py (blkx JSON → typed), wpcost.py, shop.py, unittags.py, lang.py, tankmodel.py, records.py
  build/       units.py, history.py, updates.py, tree.py, search.py
  manual/      updates.yaml, id_aliases.yaml, records_aliases.yaml, thermal_map.yaml, official_changes/
  models.py    pydantic schemas
  validate.py  invariants (below)
  cli.py       `wtbr fetch|build|validate|all`
tests/
```

### Stages
1. **fetch:** update the datamine clone incrementally. Download the sheets as CSV, then the ControlNet CSVs, then the images (only new or changed ones).
2. **parse:** turn each source into typed records, keyed by `(version, id)` for the versioned sources.
3. **build:** merge the sources. Collapse the per-version BRs into change points. Compute diffs, the same-BR lists and the search index. Write `data/`.
4. **validate:** fail the build if any invariant breaks:
   - Every unit in the tree has a name, a nation, a rank and a current BR.
   - BR ranks are non-negative integers, and the history is sorted by version.
   - No record is left unmatched (or unmatched records are in an explicit ignore list).
   - Thermal resolutions are all mapped, or warnings are emitted.
   - Unit counts per nation are within ±5% of the previous build (catches parser breakage after a game update).
5. **report:** write `data/build-report.json` with counts, warnings and new vehicles. The CI job summary shows it.

### Testing
- Unit tests for BR conversion, the blk parsing quirks, and resolution → generation mapping.
- Golden tests: about 10 hand-checked vehicles with known BR histories (for example, a famous decompression victim, a premium, a squadron vehicle and a removed vehicle). Snapshot their output JSON.
- Fixtures are trimmed real blkx files, kept small.

---

## 5. Site (`web/`)

Next.js (App Router) with `output: "export"`, TypeScript (strict), Tailwind and Recharts. pnpm.

### Pages

| Route | Content | Key components |
|---|---|---|
| `/` | Hero for the latest update (name, date, ↑/↓ counts, top movers), recent updates list, search, nation picker | `UpdateHero`, `MoverList`, `SearchBox` |
| `/ground/[nation]` | Tech tree laid out by rank and column, with folders. AB/RB/SB toggle. A time-machine slider over versions. Cards changed in the selected patch are highlighted. | `TechTree`, `UnitCard`, `ModeToggle`, `PatchSlider` |
| `/vehicle/[id]` | Image and name, current BRs, a **BR step chart** (3 modes with patch markers), the change log table, stats, thermal chips per crew, record card, a strip of vehicles at the same BR, and links to the datamine/wiki | `BrStepChart`, `ChangeLog`, `StatGrid`, `ThermalChip`, `RecordCard`, `SameBrStrip` |
| `/updates` | A list of all versions, with major updates marked | `UpdateList` |
| `/updates/[version]` | BR diff grouped by nation, filterable by mode and up/down, plus added/removed vehicles | `DiffTable` |
| `/records` | Records table that can be sorted and filtered by nation, type and BR, with attribution | `RecordsTable` |
| `/explore` | Biggest movers (all-time and last year), most-changed vehicles, thermal finder (gen × BR × nation), "BR at a date" lookup, and decompression charts | `ExploreTabs` |
| `/design` | Style guide: tokens, type, card states, chips, charts | — |
| `/about` | Sources, credits, disclaimer, methodology (BR formula, data caveats) | — |

### URL state
Mode, slider version and filters live in query params (`?mode=rb&v=2.41`). That makes views shareable. Static export works with client-side param reading.

### Search
A client-side fuzzy search (MiniSearch or Fuse) over the index of names, IDs and nations. It's prebuilt at ETL time and loaded lazily.

### Performance
- Vehicle pages are statically generated (about 1,000 pages). Charts load per page.
- Images are served as WebP with fixed sizes and lazy-loaded in the tree.
- Tech tree: render about 100 cards per nation without virtualization first, and measure.

### Mobile
- The tech tree scrolls horizontally, with the rank column fixed to the left edge.
- Vehicle pages use one column.
- The patch slider has large touch targets and step buttons.

### SEO and sharing
- Each vehicle has a title and description: "<Name> BR history: 6.7 → 7.7 (RB)".
- A generated Open Graph image per vehicle at build time, showing the card and a sparkline **(stretch)**.
- `sitemap.xml`.

### Accessibility
- Never show BR direction by color alone. Use ▲/▼ arrows plus color (#20F020 / #FF4B38).
- Check the contrast of #808080 on #11141A. If it fails, use it only for large text or non-essential text.
- Make sure toggles and the slider work with the keyboard.
- Give charts a table alternative (the change log serves as this).

---

## 6. Design system (War Thunder look, dark only)

### Color tokens
From `gui/const/colors.css`. The game stores colors as #AARRGGBB, so convert them to #RRGGBB.

| Token | Value |
|---|---|
| `bg` | #11141A |
| `panel` | #1B2226 |
| `header` | #2D343C |
| `text` | #FFFFFF |
| `text-2` | #C0C0C0 |
| `text-3` | #808080 |
| `link` | #17CBFC |
| `gold` | #F9DB78 |
| `good` | #20F020 |
| `bad` | #FF4B38 |
| `premium` | #B19B62 |
| `squadron` | #82A952 |

### Unit card states
From `unitcard.css`. Each state is background / 1px border / 2px top line.

| State | Background | Border | Top line |
|---|---|---|---|
| Default | #1A2228 | #233844 | #2F4B5C |
| Premium | #2D250F | #5B471F | #7B591F |
| Squadron | #263A1C | #3E5C2C | #4B712F |

Cards are 120–180 px wide.

Extra states the site needs, derived from the above: hover, selected, "changed this patch" (▲/▼ badge), "not yet in game at this version" (dimmed), and removed.

### Typography
- Fira Sans Condensed for headings, cards and numbers (use tabular numerals).
- PT Sans for body text.
- Both self-hosted through `@fontsource`.

### Name glyphs
`symbols_skyquake.ttf` is used as `font-family: "WTSymbols"`. It's limited with `unicode-range: U+2415-2420, U+22E0, U+2580-25E5, U+2622, U+F059`. The range was widened from U+2417 because `globalscripts/countrysymbols.nut` also uses U+2415 and U+2416 and comes first in the name font stack, so only those code points use it. This depends on the licensing decision in §2.

U+2580–25E5 includes ▲▼◆, so UI text must never use those characters. Arrows are SVG (`<Arrow>`).

### Chart style
- Step lines (BR changes are discrete). AB uses `text-2`, RB uses `link` and SB uses `gold`.
- Patch markers use `text-3`, and hovering one shows the version name.

### Implementation
Tailwind theme tokens plus CSS variables, documented live on `/design`.

---

## 7. Infrastructure

### Repo layout
```
/etl  /data (generated, committed or artifact — see below)  /web  /.github/workflows
```
The generated `data/` should be committed on a `data` branch, not on `main`. This gives a free history of our own outputs and keeps `main` diffs clean.

### CI
- **`ci.yml`** runs on every pull request: ETL tests, `validate` on cached data, the web typecheck, lint, build, and Playwright smoke tests (home, one tree, one vehicle, one update).
- **`daily.yml`** runs on a cron schedule:
  1. Fetch the datamine.
  2. If there's no new commit and no sheet changes, exit early.
  3. Otherwise, run the full ETL, then validate, then commit `data`, then build, then deploy.
  4. On a validation failure, open an issue with the build report instead of deploying.

### Hosting
- **Decided: Firebase Hosting.** `firebase.json` at the repo root serves `web/out` with trailing-slash URLs and long-lived caching for hashed assets.
- The free Spark plan gives 10 GB storage and about 360 MB/day of transfer. Vehicle images will use most of that on a busy day, so expect to move to the pay-as-you-go Blaze plan at launch.
- Deploys go through `FirebaseExtended/action-hosting-deploy` with a service-account secret, added once a Firebase project exists.

### Analytics
A cookieless tool such as GoatCounter, so no consent banner is needed. Google Analytics for Firebase sets cookies and would need one.

### Monitoring
The daily job's status, plus an uptime check.

---

## 8. Build order and acceptance criteria

### Step 1: Scaffold and design system
- **Work:**
  - Monorepo skeleton with `etl/` (uv, pytest), `web/` (Next.js static export, Tailwind, Recharts) and CI skeleton.
  - Tokens, fonts and the WTSymbols setup.
  - `UnitCard` in all states.
  - `ThermalChip`, `BrBadge` and `ModeToggle`.
  - The `/design` page.
- **Done when:**
  - `pnpm build` produces a static site.
  - `/design` shows every token, every card state and the glyph font rendering the test strings.
  - CI is green.

### Step 2: Current vehicles ETL, then vehicle pages
- **Work:**
  - Datamine fetch for the latest version.
  - Parse wpcost, shop, unittags, lang and tankmodels (verifying the §2 assumptions).
  - Build `units/index.json` and `units/<id>.json` with the current data.
  - Mirror the images.
  - `/vehicle/[id]` with stats, thermals and the same-BR strip.
  - `/ground/[nation]` with the current tree and a mode toggle.
- **Done when:**
  - Every ground vehicle in the current tree has a page.
  - The unit count per nation matches the in-game tree (spot-check 3 nations).
  - Thermals are correct for 10 hand-checked vehicles.

### Step 3: BR history
- **Work:**
  - Walk all wpcost commits, then build `versions.json`, the history change points and `updates/<version>.json`.
  - Merge ControlNet data from before 2020.
  - BR step chart and change log.
  - `/updates` pages.
  - The time-machine slider.
  - The home-page hero.
- **Done when:**
  - The golden tests pass for about 10 vehicles.
  - Slider positions reproduce known historical BRs.
  - A full rebuild finishes in under 10 minutes in CI.

### Step 4: Records
- **Work:**
  - Sheet fetch and the alias mapping.
  - `RecordCard` and `/records`.
  - Contact the maintainers.
- **Done when:**
  - At least 95% of records are matched and the rest are explicitly listed.
  - The maintainers have replied, or launch waits.

### Step 5a: Explore
- **Work:** movers, the thermal finder, BR-at-date lookup and decompression views.
- **Done when:** each view loads in under 1 s on a mid-range phone.

### Step 5b: Official sheets
- **Work:**
  - Curate the planned-vs-implemented data.
  - Overlay it on the vehicle charts (planned shown as a dashed ghost step).
  - Add a "planned but reverted" badge.
- **Done when:** 2020-08 to now is covered, or the gaps are documented.

### Step 5c: Air module
- **Work:**
  - Point the ETL at `flightmodels/`.
  - Turn on the `air` branch in the UI.
  - Add `/air/[nation]`.
  - Use air-specific stats instead of thermals.
- **Done when:** the same acceptance checks as step 2 pass for air.

### Step 6: Polish and player tools (done)
- Visual pass: panels, section titles, flags and branch icons, hero art, styled 404, share card and favicon.
- Player tools: lineup planner, watchlist, smart search ("germany 6.7", `/` shortcut), Atom feed, planned-BR preview and lineup highlight in trees, counterparts and tree line on vehicle pages, update filters, "since your last visit".
- Explore: uptiers by nation, longest unchanged BRs. Records: most records held, per-nation averages.
- Smoke test now also fails any page wider than a 390 px phone viewport.

### Launch checklist (between 4 and 5)
- About page and disclaimer.
- Licensing decisions made (§2).
- Records maintainers' OK.
- Analytics.
- 404 page. (done)
- Sitemap. (done)
- OG images. (done: site card; vehicle pages use the vehicle image)
- Lighthouse score of at least 90 on mobile.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A datamine format change breaks a parser | The validation count check fails the build instead of deploying bad data. Keep the parsers small and covered by fixtures. |
| The datamine repo goes away or is rewritten | Keep our own `data` branch as an archive. Mirror the needed blobs once. |
| Gaijin objects to images or fonts | Mirroring can be switched off. Have SVG glyph fallbacks. Keep the disclaimer. |
| The records sheet changes columns | Parse by header name, not position. Validate. |
| ControlNet IDs don't match | Manual alias file. Show the pre-2020 period as "approximate" if needed. |
| Hosting bandwidth (Firebase Spark limits) | Serve WebP at fixed sizes, cache for long periods, move to Blaze at launch. |
| Scope creep (air, naval, stats depth) | Strict build order. Air waits for step 5. |
| Build output is about 1 GB, mostly ~400 KB per vehicle page (HTML plus Next's RSC payload, written twice). Every page shows the data version, so each daily deploy re-uploads all of them | Pages compress to ~17 KB. If deploys get slow, drop the version line from vehicle pages so unchanged vehicles keep their hash, or trim the payload. |
| The October 2026 announcement page is 2.7 MB of HTML (620 rows) | 68 KB gzipped, so acceptable for now. Split by branch tab or paginate if mobile parsing feels slow. |

---

## 10. Decisions

| Question | Decision |
|---|---|
| Hosting | Firebase Hosting |
| Site name | Uptier |
| Time machine | Rewinds both the tree layout and the BRs |
| Removed and event vehicles | Shown in the tree, greyed out |
| Glyph font | Not in the datamine; extract it from the game client (see §2) |
| Images | Mirror (default; not yet confirmed) |

Still open: the domain name, and whether to redistribute the glyph font at launch.
