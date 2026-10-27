"""`wtbr` command line. See PLAN.md §4."""

import argparse
import json
from pathlib import Path

from . import images, news, official, patchnotes, paths, records, store, wayback
from .build import build_current
from .datamine import COUNTRY_ICONS, SHOP, WPCOST, Datamine
from .history import BlobCache, History, pending_point, timeline
from .history_build import build_history, diff_states, state_at
from .models import (
    Announcement,
    DevPreview,
    MarketData,
    Meta,
    NationTree,
    NewsPost,
    PatchNote,
    PatchNoteSummary,
    RecordRow,
    ResearchRules,
    StoreData,
    TimeMachine,
    UnitDetail,
    UnitSummary,
    UpdateDiff,
    VersionInfo,
)
from .parse import BRANCHES, parse_shop, unit_ranks


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="wtbr", description="Uptier ETL")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("fetch", help="sync the datamine clone")
    sub.add_parser("images", help="mirror vehicle images to web/public/img/units")
    sub.add_parser("history", help="sync the full-history clone and extract every version")
    b = sub.add_parser("build", help="write data/")
    b.add_argument("--no-history", action="store_true", help="current version only (fast)")
    sub.add_parser("schema", help="write JSON Schema for the output files")
    sub.add_parser("records", help="download the RB records sheet")
    sub.add_parser("official", help="download Gaijin's BR change announcements")
    pn = sub.add_parser("patchnotes", help="download the warthunder.com changelog (patch notes)")
    pn.add_argument("--full", action="store_true", help="re-read the whole index to fill gaps")
    sub.add_parser("store", help="download Gaijin Store pack prices")
    nw = sub.add_parser("news", help="download the warthunder.com news index")
    nw.add_argument("--full", action="store_true", help="re-read every index page")
    wb = sub.add_parser("wayback", help="download old wiki BR lists from the Internet Archive")
    wb.add_argument("--out", default=str(paths.CACHE / "wayback"), help="folder for the captures")
    wb.add_argument("--probe", action="store_true", help="only list what the archive holds")
    wb.add_argument("--pages", action="store_true", help="vehicle page infoboxes instead of lists")
    sub.add_parser("all", help="every step above, then build and schema")
    args = parser.parse_args(argv)

    if args.cmd == "wayback":
        if args.probe:
            wayback.probe(Path(args.out))
        elif args.pages:
            print(f"wayback: {wayback.fetch_pages(Path(args.out))} page captures")
        else:
            print(f"wayback: {wayback.fetch(Path(args.out))} new captures")
        return 0

    dm = Datamine(paths.CACHE / "datamine")
    hist = History(paths.CACHE / "history.git")
    cache = BlobCache(paths.CACHE / "blobs")

    # History first: it decides which commit is the latest *live* build.
    if args.cmd in ("history", "all"):
        hist.sync()
        commits = hist.commits()
        points = timeline(commits)
        pending = pending_point(commits)
        snapshots = points + ([pending] if pending else [])
        wanted = [(WPCOST, p.wpcost) for p in snapshots]
        wanted += [(SHOP, p.shop) for p in snapshots if p.shop]
        n = cache.fill(hist, wanted)
        print(f"history: {len(points)} live versions, {n} new snapshots extracted")
        if pending:
            print(f"history: newest build {pending.version} looks like a dev-server build")
    if args.cmd in ("fetch", "all"):
        live = latest_live(hist) if hist.path.exists() else None
        dm.sync(live)
        print(f"datamine at {dm.version} ({dm.commit[:10]})")
    if args.cmd in ("images", "all"):
        wpcost, shop = dm.read_json(WPCOST), dm.read_json(SHOP)
        ids = sorted(
            {
                u
                for section, move_types in BRANCHES.values()
                for u in parse_shop(shop, section)[0]
                if u in unit_ranks(wpcost, move_types)
            }
        )
        print(f"flags: {images.copy_flags(dm.path, COUNTRY_ICONS, paths.FLAGS)} country icons")
        res = images.mirror(ids, paths.UNIT_IMAGES)
        print("images:", {k: len(v) for k, v in res.items()})
        if res.get("missing"):
            print(
                "  missing:",
                ", ".join(res["missing"][:20]),
                "…" if len(res["missing"]) > 20 else "",
            )
    if args.cmd in ("records", "all"):
        records.fetch(paths.CACHE / "records")
        print("records: sheet downloaded")
    if args.cmd in ("official", "all"):
        n = len(official.fetch(paths.CACHE / "official"))
        print(f"official: {n} announcements")
    if args.cmd in ("patchnotes", "all"):
        full = getattr(args, "full", False)
        n = len(patchnotes.fetch(paths.CACHE / "patchnotes", full=full))
        print(f"patchnotes: {n} changelog entries")
    if args.cmd in ("news", "all"):
        try:
            full = getattr(args, "full", False)
            print(f"news: {len(news.fetch(paths.CACHE / 'news', full=full))} posts")
        except OSError as e:
            print(f"news: fetch failed ({e}), keeping the cached index")
    if args.cmd in ("store", "all"):
        try:
            print(f"store: {len(store.fetch(paths.CACHE / 'store'))} products")
        except OSError as e:  # the store is a nice-to-have; keep the last catalog
            print(f"store: fetch failed ({e}), keeping the cached catalog")
    if args.cmd in ("build", "all"):
        rec_dir = paths.CACHE / "records"
        record_rows = (
            [r for n in records.TABS for r in records.parse(n, (rec_dir / f"{n}.csv").read_text())]
            if all((rec_dir / f"{n}.csv").exists() for n in records.TABS)
            else None
        )
        result = dev = None
        if not getattr(args, "no_history", False) and hist.path.exists():
            commits = hist.commits()
            points = timeline(commits)
            result = build_history(points, cache)
            print(f"history: {len(result.versions)} versions with tree or BR changes")
            pending = pending_point(commits)
            if pending and points:
                changes, added, where = diff_states(cache, points[-1], pending)
                _, _, _, now = state_at(cache, pending)
                dev = (pending, points[-1], changes, added, where, {u: list(now[u]) for u in added})
                print(f"dev server {pending.version}: {len(changes)} BR changes, {len(added)} new")
        off_dir = paths.CACHE / "official"
        announcements = official.load(off_dir) if off_dir.exists() else None
        meta = build_current(
            dm, paths.DATA, paths.UNIT_IMAGES, result, record_rows, dev, announcements
        )
        counts = ", ".join(
            f"{b}: {sum(1 for k in meta.perNation if k.startswith(b + '/'))} nations"
            for b in meta.branches
        )
        print(f"built {meta.unitCount} units for {meta.version} ({counts})")
    if args.cmd in ("schema", "all"):
        write_schema()
    return 0


def write_schema() -> None:
    out = paths.DATA / "schema"
    out.mkdir(parents=True, exist_ok=True)
    for model in (
        Meta, UnitSummary, UnitDetail, NationTree, VersionInfo, UpdateDiff, TimeMachine, RecordRow,
        DevPreview,
        Announcement,
        MarketData,
        PatchNote,
        PatchNoteSummary,
        StoreData,
        ResearchRules,
        NewsPost,
    ):  # fmt: skip
        schema = model.model_json_schema(mode="serialization")
        (out / f"{model.__name__}.json").write_text(json.dumps(schema, indent=2))
    print(f"schemas written to {out}")


def latest_live(hist: History) -> str | None:
    """Sha of the newest live build (skips trailing dev-server builds)."""
    live = [c for c in hist.commits() if c.live]
    return live[-1].sha if live else None
