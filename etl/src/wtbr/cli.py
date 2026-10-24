"""`wtbr` command line. See PLAN.md §4."""

import argparse
import json

from . import images, paths
from .build import build_current
from .datamine import SHOP, WPCOST, Datamine
from .models import Meta, NationTree, UnitDetail, UnitSummary
from .parse import ground_ranks, parse_shop


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="wtbr", description="Uptier ETL")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("fetch", help="sync the datamine clone")
    sub.add_parser("images", help="mirror vehicle images to web/public/img/units")
    sub.add_parser("build", help="write data/ for the current version")
    sub.add_parser("schema", help="write JSON Schema for the output files")
    sub.add_parser("all", help="fetch, images, build, schema")
    args = parser.parse_args(argv)

    dm = Datamine(paths.CACHE / "datamine")
    if args.cmd in ("fetch", "all"):
        dm.sync()
        print(f"datamine at {dm.version} ({dm.commit[:10]})")
    if args.cmd in ("images", "all"):
        ground = ground_ranks(dm.read_json(WPCOST))
        ids = sorted(u for u in parse_shop(dm.read_json(SHOP))[0] if u in ground)
        res = images.mirror(ids, paths.UNIT_IMAGES)
        print("images:", {k: len(v) for k, v in res.items()})
        if res.get("missing"):
            print(
                "  missing:",
                ", ".join(res["missing"][:20]),
                "…" if len(res["missing"]) > 20 else "",
            )
    if args.cmd in ("build", "all"):
        meta = build_current(dm, paths.DATA, paths.UNIT_IMAGES)
        print(f"built {meta.unitCount} units for {meta.version} across {len(meta.nations)} nations")
    if args.cmd in ("schema", "all"):
        write_schema()
    return 0


def write_schema() -> None:
    out = paths.DATA / "schema"
    out.mkdir(parents=True, exist_ok=True)
    for model in (Meta, UnitSummary, UnitDetail, NationTree):
        schema = model.model_json_schema(mode="serialization")
        (out / f"{model.__name__}.json").write_text(json.dumps(schema, indent=2))
    print(f"schemas written to {out}")
