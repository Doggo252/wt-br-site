# Uptier

Battle Rating history for every War Thunder vehicle, patch by patch. A fan site; not affiliated with Gaijin Entertainment.

The full plan is in [PLAN.md](PLAN.md).

| Folder | What |
|---|---|
| `etl/` | Python ETL (uv). Turns the War Thunder Datamine into JSON in `data/`. |
| `web/` | Next.js static export (TypeScript, Tailwind). Builds to `web/out/`. |
| `firebase.json` | Firebase Hosting config, serving `web/out`. |

## Develop

```
cd web && pnpm install && pnpm dev     # style guide at http://localhost:3000/design/
cd etl && uv sync && uv run pytest
```

## Deploy

```
cd web && pnpm build && cd .. && firebase deploy --only hosting
```

This needs a Firebase project (`firebase use --add`).
