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
    # Main gun mount (deg/s and degrees), from the tank model; aced crew, stock vehicle.
    traverseDegS: float | None = None
    elevationDegS: float | None = None
    gunDepression: float | None = None  # negative, e.g. -9
    gunElevation: float | None = None
    traverseLimits: tuple[float, float] | None = (
        None  # set when the gun can't turn all the way round
    )
    ammo: int | None = None  # main gun rounds carried
    gearsFwd: int | None = None
    gearsRev: int | None = None
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
    # Gaijin Market: item id (shop.blkx marketplaceItemdefId), its name in market URLs
    # (trade.gaijin.net/market/1067/<name>) and the lowest sell offer in GJN at the last snapshot.
    marketItemId: int | None = None
    marketName: str | None = None
    marketPrice: float | None = None
    # Premiums: Golden Eagle price when sold in game, or `pack` when sold for money on the Gaijin
    # Store instead, with the lowest current price of a store pack that includes it (US dollars).
    geCost: int | None = None
    pack: bool = False
    storePrice: float | None = None
    requires: str | None = None  # tech tree vehicle to research first
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


class MarketQuote(Model):
    """One Gaijin Market listing at snapshot time. Prices in GJN."""

    name: str  # item name in market URLs (trade.gaijin.net/market/1067/<name>)
    title: str  # display name
    price: float | None = None  # lowest sell offer
    buy: float | None = None  # highest buy order
    sellers: int = 0
    buyers: int = 0
    icon: str | None = None
    quality: str | None = None
    event: str | None = None


class ModeValues(Model):
    ab: float | None = None
    rb: float | None = None
    sb: float | None = None


class Economy(Model):
    """Research, purchase, crew and repair costs from wpcost.blkx. SL = Silver Lions,
    RP = research points, GE = Golden Eagles."""

    researchRp: int | None = None
    purchaseSl: int | None = None
    purchaseGe: int | None = None  # premiums bought in the game
    crewSl: int | None = None
    expertsSl: int | None = None
    acesGe: int | None = None
    acesRp: int | None = None
    repairSl: ModeValues = ModeValues()  # stock
    repairUpgradedSl: ModeValues = ModeValues()
    rewardPct: ModeValues = ModeValues()  # Silver Lion reward multiplier, as a percentage
    rpPct: int | None = None  # research point multiplier, as a percentage


class Modification(Model):
    id: str
    name: str
    tier: int | None = None
    rp: int | None = None
    sl: int | None = None
    ge: int | None = None  # cost to buy outright with Golden Eagles
    effect: str | None = None  # what researching it does ("+11% engine power")


class EarlyBr(Model):
    """A BR data point from before the datamine (March 2020): what the wiki showed (the BR in
    each mode, or a change between two captures), or a change stated in an official changelog."""

    date: str
    source: str  # "wiki" or "changelog"
    br: dict[str, float] = {}  # wiki: mode -> BR
    change: dict[str, tuple[float, float]] = {}  # changelog: mode, or "br" if unnamed -> (was, now)
    url: str | None = None  # the archived wiki page
    after: str | None = None  # a wiki change: the last capture still showing the old BR
    noteId: int | None = None  # the changelog entry


class NewsRef(Model):
    """A warthunder.com news post that names this vehicle."""

    id: int
    title: str
    date: str
    kind: str
    url: str


class NewsPost(NewsRef):
    """One row of data/news.json."""

    summary: str = ""
    image: str | None = None
    units: list[str] = []


class StorePack(Model):
    """A War Thunder product on the Gaijin Store."""

    id: int  # store.gaijin.net/story.php?id=<id>
    title: str
    url: str
    image: str | None = None
    price: float | None = None
    oldPrice: float | None = None  # before the current discount
    currency: str = "$"
    endsAt: int | None = None  # discount end, unix seconds
    units: list[str] = []  # vehicles in the pack
    contents: list[str] = []  # everything else (premium time, Golden Eagles, decals...)


class Round(Model):
    """One projectile. Penetration is flat-plate RHA in mm, as the game reports it."""

    name: str
    type: str  # short label: APFSDS, HEAT, HE...
    typeName: str | None = None  # the game's long name for the type
    mass: float | None = None  # kg
    speed: float | None = None  # muzzle velocity, m/s
    explosive: float | None = None  # filler, kg
    explosiveType: str | None = None
    tnt: float | None = None  # TNT equivalent, kg
    pen: list[int] | None = None  # kinetic, at ammo.DISTANCES
    jet: int | None = None  # HEAT jet, any range
    hesh: int | None = None  # thickest plate HESH still damages behind
    frag: float | None = None  # what the blast and fragments go through
    range: int | None = None  # guided missiles, m
    guidance: str | None = None


class AmmoOption(Model):
    """A shell, or for autocannons a belt, that a gun can load."""

    mod: str | None = None  # the shell's modification id; None = the gun's default shell
    tier: int | None = None  # tier of the modification that unlocks it; None = stock
    rp: int | None = None  # research cost of that modification
    perShell: int | None = None  # Silver Lions per shell
    rounds: list[Round]


class ArmorPlate(Model):
    """Nominal thickness of a group of armour plates, in mm (angles not included)."""

    area: str  # "hull_upper", "hull_lower", "turret", "mantlet", "composite", "addon"
    face: str = ""  # front, side, rear, top, bottom; empty for mantlet, composite, add-on
    min: float
    max: float
    material: str  # rolled, cast, high_hardness, aluminium, structural, composite, ...


class WeaponCount(Model):
    name: str
    count: int  # barrels for guns; bombs, rockets or missiles for stores
    ammo: int | None = None  # rounds per barrel (guns)


class Loadout(Model):
    """A loadout preset (older aircraft) or one store option on a pylon."""

    name: str | None = None  # the game's id for it
    items: list[WeaponCount]
    tier: int | None = None  # modification tier that unlocks it


class Pylon(Model):
    index: int
    options: list[Loadout]


class Armament(Model):
    """Aircraft and helicopters."""

    guns: list[WeaponCount] = []  # fixed, pilot-fired
    turrets: list[WeaponCount] = []  # defensive or gunner-operated
    countermeasures: int | None = None  # flares and chaff carried
    presets: list[Loadout] = []  # whole loadouts (older aircraft)
    pylons: list[Pylon] = []  # per-pylon choices (newer aircraft and helicopters)


class Gun(Model):
    name: str
    caliber: float | None = None  # mm
    ammo: list[AmmoOption]


class PatchMention(Model):
    """A patch note item naming this vehicle."""

    id: int  # changelog entry
    date: str
    title: str
    html: str  # the item, reduced to <strong>, <em> and <a>


class UnitDetail(UnitSummary):
    """data/units/<id>.json."""

    fullName: str
    sights: dict[Crew, list[Sight]] = {}
    stats: Stats = Stats()
    eventName: str | None = None
    # Aircraft and helicopters used in ground battles have their own RB/SB ranks there.
    groundBattleRb: int | None = None
    groundBattleSb: int | None = None
    history: list[HistoryPoint] = []
    absences: list[Absence] = []
    record: UnitRecord | None = None
    market: MarketQuote | None = None  # the vehicle itself, when tradeable
    skins: list[MarketQuote] = []  # its skins on the Gaijin Market, cheapest first
    patchNotes: list[PatchMention] = []  # newest first, capped
    economy: Economy | None = None
    modifications: list[Modification] = []
    guns: list[Gun] = []
    armor: list[ArmorPlate] = []
    armament: Armament | None = None
    storePacks: list[StorePack] = []
    news: list[NewsRef] = []
    early: list[EarlyBr] = []  # newest first


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


class DevUnit(Model):
    """A vehicle that exists only on the dev server, so the site has no page for it."""

    name: str
    branch: Branch
    nation: str
    br: Ranks


class DevPreview(Model):
    """data/dev.json: BRs on the dev server compared with the live game. Only written while the
    newest datamine build looks like a dev-server build."""

    v: str
    d: str
    base: str  # live version compared against
    changes: list[BrChange] = []
    added: dict[str, DevUnit] = {}


Outcome = Literal["pending", "applied", "different", "not_applied"]


class OfficialChange(Model):
    """One row of a Gaijin BR-change table: (was, now) ranks per mode it changes."""

    name: str  # as written in the table
    branch: Branch
    ids: list[str] = []  # matched vehicles (same-named copies share a row)
    ab: tuple[int, int] | None = None
    rb: tuple[int, int] | None = None
    sb: tuple[int, int] | None = None
    grb: tuple[int, int] | None = None  # aircraft in ground battles
    comment: str | None = None
    # Planned tables only: what happened next, per mode, judged 45 days later.
    outcome: dict[Literal["ab", "rb", "sb"], Outcome] = {}


class Announcement(Model):
    """data/official.json: Gaijin's BR change posts (forum tag br-changes), newest first."""

    id: int
    title: str
    date: str
    kind: Literal["planned", "implemented", "other"]
    url: str
    changes: list[OfficialChange] = []
    unavailable: bool = False  # the linked table is no longer published


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


class MarketPoint(Model):
    d: str  # snapshot date
    price: float | None = None
    buy: float | None = None


class MarketEntry(MarketQuote):
    """One row of data/market.json: every War Thunder item on the Gaijin Market."""

    kind: str  # tank, aircraft, helicopter, skin, decal, chest, key, ...
    unit: str | None = None  # vehicle id, for vehicles and matched skins
    country: str | None = None
    history: list[MarketPoint] = []


class ResearchRules(Model):
    """data/research.json: branch -> nation -> {rank: vehicles of that rank you must own to open
    the next rank} (rank.blkx needBuyToOpenNextInEra)."""

    unlocks: dict[str, dict[str, dict[int, int]]]


class StoreData(Model):
    """data/store.json."""

    fetched: str
    packs: list[StorePack]


class MarketData(Model):
    """data/market.json."""

    snapshot: str  # date of the newest snapshot
    snapshots: list[str]
    items: list[MarketEntry]


class PatchNoteItem(Model):
    html: str  # reduced to <strong>, <em> and <a href>
    depth: int = 0  # list nesting
    units: list[str] = []  # vehicles named in the item's bold lead


class PatchNoteSection(Model):
    title: str | None = None
    items: list[PatchNoteItem]


class PatchNoteSummary(Model):
    """One row of data/patchnotes/index.json (newest first)."""

    id: int
    title: str
    date: str
    summary: str = ""
    image: str | None = None
    version: str | None = None  # game version in the title, when there is one
    forVersion: str | None = None  # the update page (data/versions.json) it belongs to
    units: int = 0  # vehicles mentioned


class PatchNote(PatchNoteSummary):
    """data/patchnotes/<id>.json: one warthunder.com changelog entry."""

    url: str
    sections: list[PatchNoteSection]
