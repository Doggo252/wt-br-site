"""`wtbr` command line. Stages arrive in build step 2 (see PLAN.md §4)."""

import argparse


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="wtbr", description="Uptier ETL")
    parser.add_argument("stage", choices=["fetch", "build", "validate", "all"])
    args = parser.parse_args(argv)
    parser.exit(1, f"wtbr {args.stage}: not implemented yet (build step 2)\n")
