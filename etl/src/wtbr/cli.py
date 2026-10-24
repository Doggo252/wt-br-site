"""`wtbr` command line. See PLAN.md §4."""

import argparse
import json

from . import images, paths, records
from .build import build_current
from .datamine import SHOP, WPCOST, Datamine
from .history import BlobCache, History, timeline
from .history_build import build_history
from .models import (
    Meta,
    NationTree,
    RecordRow,
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
    sub.add_parser("all", help="fetch, history, records, images, build, schema")
    args = parser.parse_args(argv)

    dm = Datamine(paths.CACHE / "datamine")
    if args.cmd in ("fetch", "all"):
        dm.sync()
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
        res = images.mirror(ids, paths.UNIT_IMAGES)
        print("images:", {k: len(v) for k, v in res.items()})
        if res.get("missing"):
            print(
                "  missing:",
                ", ".join(res["missing"][:20]),
                "…" if len(res["missing"]) > 20 else "",
            )
    hist = History(paths.CACHE / "history.git")
    cache = BlobCache(paths.CACHE / "blobs")
    if args.cmd in ("history", "all"):
        hist.sync()
        points = timeline(hist.commits())
        wanted = [(WPCOST, p.wpcost) for p in points] + [(SHOP, p.shop) for p in points if p.shop]
        n = cache.fill(hist, wanted)
        print(f"history: {len(points)} live versions, {n} new snapshots extracted")
    if args.cmd in ("records", "all"):
        records.fetch(paths.CACHE / "records")
        print("records: sheet downloaded")
    if args.cmd in ("build", "all"):
        rec_dir = paths.CACHE / "records"
        record_rows = (
            [r for n in records.TABS for r in records.parse(n, (rec_dir / f"{n}.csv").read_text())]
            if all((rec_dir / f"{n}.csv").exists() for n in records.TABS)
            else None
        )
        result = None
        if not getattr(args, "no_history", False) and hist.path.exists():
            result = build_history(timeline(hist.commits()), cache)
            print(f"history: {len(result.versions)} versions with tree or BR changes")
        meta = build_current(dm, paths.DATA, paths.UNIT_IMAGES, result, record_rows)
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
    ):  # fmt: skip
        schema = model.model_json_schema(mode="serialization")
        (out / f"{model.__name__}.json").write_text(json.dumps(schema, indent=2))
    print(f"schemas written to {out}")
