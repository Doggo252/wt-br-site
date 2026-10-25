# Uptier

Battle Rating history for every War Thunder tank, aircraft and helicopter, patch by patch, since March 2020. A fan site; not affiliated with Gaijin Entertainment.

The plan, decisions and progress are in [PLAN.md](PLAN.md).

## Features

- Tech trees for every nation and branch, with a time machine back to March 2020, a preview of Gaijin's planned changes and a "lineup at BR" highlight.
- Vehicle pages: BR history in every mode, stats, night vision, its tree line, counterparts from other nations, kill record and official announcements.
- Update pages with nation and watchlist filters; an Atom feed at `/feed.xml`.
- Lineup planner (`/lineup`), watchlist (`/watchlist`, stored in the browser), compare (`/compare`), explore, kill records, dev-server preview.
- Search by name or by nation and BR ("germany 6.7"); press `/` anywhere.

## What's here

| Path | What |
|---|---|
| `etl/` | Python ETL (uv). Reads the [War Thunder Datamine](https://github.com/gszabi99/War-Thunder-Datamine) and the RB records sheet, writes JSON to `data/`. |
| `etl/manual/` | Hand-kept data: record-name overrides (`records.toml`). |
| `web/` | Next.js static export (TypeScript, Tailwind, Recharts). Builds to `web/out/`. |
| `firebase.json` | Firebase Hosting config, serving `web/out`. |
| `.github/` | CI for pull requests; build and deploy on push to `main` and daily. |

Generated and downloaded files are not committed: `data/`, `etl/cache/` (datamine clones, about 400 MB), `web/public/img/units/` and `web/public/data/`.

## Run it locally

Needs Python 3.12+ with [uv](https://docs.astral.sh/uv/), Node 22 and pnpm.

```sh
cd etl
uv sync
uv run wtbr all        # first run: ~5 min (history clone and extraction) + ~20 min (images)
cd ../web
pnpm install
pnpm dev               # http://localhost:3000
```

The share card `web/public/og.png` is rendered from the built site by `node scripts/make_og.mjs` (needs a static server on `web/out`, see the script). The zero-width glyph fallback font `web/public/fonts/wt-blank.woff2` comes from `python3 scripts/make_blank_glyphs.py` (needs fonttools and brotli).

Individual ETL stages: `uv run wtbr history | fetch | images | records | build | schema`. `wtbr build --no-history` is a fast current-version-only build.

After changing the ETL's output models, run `uv run wtbr schema` and then `pnpm gen:types` in `web/` to regenerate `web/src/lib/data.gen.ts`.

## Checks

```sh
cd etl && uv run pytest && uv run ruff check && uv run ruff format --check
cd web && pnpm lint && pnpm build && pnpm smoke   # smoke = Playwright + axe-core on the built site
```

The ETL refuses to write data that looks broken (vehicles without names, out-of-order history, or a tree losing more than 5% of its vehicles compared with the last build). If a drop is real, rerun with `WTBR_SKIP_VALIDATION=1`.

## Deploy (Firebase Hosting)

1. Create a Firebase project and enable Hosting.
2. In the GitHub repo settings:
   - Add a variable `FIREBASE_PROJECT_ID` with the project ID.
   - Add a secret `FIREBASE_SERVICE_ACCOUNT` with a service-account JSON key that has the Firebase Hosting Admin role (`firebase init hosting:github` can create it).
3. Push to `main`. The **Build and deploy** workflow runs the ETL, builds the site, tests it and deploys. It also runs daily at 05:17 UTC to pick up new game versions.

The free Spark plan allows about 360 MB of transfer per day; expect to need the pay-as-you-go Blaze plan once the site has traffic.

To deploy by hand: `cd web && pnpm build && cd .. && firebase deploy --only hosting`.

## Data notes

- BR = economic rank ÷ 3 + 1. Data files keep the raw rank.
- The datamine mixes dev-server builds in with live ones. A build counts as live only if no later build has a lower version; the newest builds of an update that's still on the dev server are shown on `/dev` instead of in the history.
- Vehicle names can contain the game's private glyphs. The site expects the game's `symbols_skyquake.ttf` in `web/public/fonts/` to draw them; it isn't in the datamine (see that folder's README).
