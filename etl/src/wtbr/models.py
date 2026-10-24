"""Output schemas. These are the contract with the site.

`wtbr schema` writes JSON Schema to data/schema/, and the site generates its
TypeScript types from that (web: `pnpm gen:types`).
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict

Branch = Literal["ground", "air", "heli", "naval"]
Status = Literal["tree", "premium", "squadron", "event"]
Crew = Literal["commander", "gunner", "driver"]
UnitType = Literal[
    "light_tank", "medium_tank", "heavy_tank", "tank_destroyer", "spaa",
    "fighter", "strike", "bomber", "attack_helicopter", "utility_helicopter",
    "other",
]  # fmt: skip


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Ranks(Model):
    """Raw economic ranks. BR = rank / 3 + 1."""

    ab: int
    rb: int
    sb: int


class Sight(Model):
    kind: Literal["thermal", "ir"]
    resolution: tuple[int, int]
    gen: int | None = None  # thermal only; None when the resolution isn't mapped
    viaModification: bool = False  # needs a researched modification


class Stats(Model):
    massT: float | None = None
    enginePowerHp: float | None = None
    powerToWeight: float | None = None
    maxSpeedFwd: float | None = None
    maxSpeedRev: float | None = None
    crew: int | None = None
    reloadS: float | None = None
    mainGun: str | None = None
    armorHull: tuple[float, float, float] | None = None  # front, side, rear (mm)
    armorTurret: tuple[float, float, float] | None = None
    # Aircraft and helicopters
    maxSpeedKmh: float | None = None
    maxSpeedAltM: float | None = None
    climbRate: float | None = None  # m/s
    turnTimeS: float | None = None
    ceilingM: float | None = None
    rollRate: float | None = None  # deg/s


class UnitSummary(Model):
    """One row of data/units/index.json."""

    id: str
    branch: Branch
    nation: str  # tech tree nation, e.g. "germany"
    operator: str | None = None  # flag country when it differs from the tree nation
    rank: int  # tech tree tier, 1-8
    type: UnitType
    name: str  # short shop name, may contain WTSymbols glyphs
    status: Status
    hidden: bool = False  # only shown in-game to owners / not currently obtainable
    br: Ranks
    thermal: dict[Crew, int] = {}  # best thermal generation per crew position
    image: bool = False  # whether img/units/<id>.webp exists
    added: str | None = None  # version first seen; None if already in the first snapshot (2020-03)
    removedIn: str | None = None  # set when the vehicle is no longer in the game
    changes: int = 0  # number of updates that changed its BR in any mode
    recordKills: int | None = None  # RB kill record in one life, from the records sheet


class UnitRecord(Model):
    """Most RB kills in one life, from the community records sheet."""

    kills: int
    player: str | None = None
    patch: str | None = None


class RecordRow(Model):
    """One row of data/records.json: a sheet row, matched to a vehicle when possible."""

    nation: str
    name: str
    id: str | None = None
    kills: int | None = None
    player: str | None = None
    br: str | None = None
    patch: str | None = None


class HistoryPoint(Model):
    """BR from this version on (until the next point)."""

    v: str
    d: str  # date, YYYY-MM-DD
    ab: int
    rb: int
    sb: int


class Absence(Model):
    """A stretch when the vehicle was out of the game."""

    removed: str
    returned: str | None = None


class UnitDetail(UnitSummary):
    """data/units/<id>.json."""

    fullName: str
    sights: dict[Crew, list[Sight]] = {}
    stats: Stats = Stats()
    eventName: str | None = None
    history: list[HistoryPoint] = []
    absences: list[Absence] = []
    record: UnitRecord | None = None


class BranchCounts(Model):
    changes: int = 0
    up: int = 0  # RB uptiers
    down: int = 0  # RB downtiers
    added: int = 0
    removed: int = 0


class VersionInfo(Model):
    """One row of data/versions.json: a live game version that changed any tracked vehicle.
    Version indexes elsewhere (history, time machine) refer to positions in this list."""

    v: str
    d: str
    major: str
    byBranch: dict[Branch, BranchCounts] = {}


class BrChange(Model):
    id: str
    before: Ranks
    after: Ranks


class UpdateDiff(Model):
    """data/updates/<version>.json."""

    v: str
    d: str
    prev: str | None = None
    next: str | None = None
    changes: list[BrChange] = []
    added: list[str] = []
    removed: list[str] = []


class TreeCell(Model):
    """A single vehicle or a folder of vehicles in one tech tree column."""

    rank: int
    units: list[str]  # one id, or several for a folder
    group: str | None = None  # folder id
    groupName: str | None = None


class NationTree(Model):
    """data/trees/<branch>/<nation>.json. Columns in in-game order, cells top to bottom."""

    nation: str
    branch: Branch
    columns: list[list[TreeCell]]


class Meta(Model):
    version: str
    commit: str
    date: str
    generatedAt: str
    unitCount: int
    branches: dict[Branch, list[str]]  # nations with a tree, in game order, per branch
    perNation: dict[str, int] = {}  # vehicles currently in each tree, keyed "branch/nation"


class TimeMachineUnit(Model):
    n: str  # name
    s: Status
    i: bool = False  # has image
    h: list[tuple[int, int, int, int]]  # (version index, ab, rb, sb) change points


class TimeMachine(Model):
    """data/public/timemachine/<branch>/<nation>.json, fetched by the tech tree's patch slider.
    Version indexes refer to data/versions.json."""

    nation: str
    branch: Branch
    layouts: list[tuple[int, list[list[TreeCell]]]]  # (from version index, columns)
    units: dict[str, TimeMachineUnit]
