"""Filesystem locations. Everything is relative to the repo root."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ETL = ROOT / "etl"
CACHE = ETL / "cache"
DATA = ROOT / "data"
MANUAL = ETL / "manual"
WEB_PUBLIC = ROOT / "web" / "public"
UNIT_IMAGES = WEB_PUBLIC / "img" / "units"
