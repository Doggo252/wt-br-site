from wtbr import parse
from wtbr.build import is_hidden, status_of

# Trimmed from the real 2.59 files.
SHOP = {
    "country_usa": {
        "army": {
            "range": [
                {"us_m2a4": {"rank": 1}, "us_m5a1_stuart": {"rank": 2, "reqAir": ""}},
                {
                    "us_m2_medium": {"rank": 1},
                    "us_sherman_group": {
                        "image": "#ui/unitskin#us_sherman_group",
                        "us_m4a1_1942_sherman": {"rank": 2},
                        "us_m4_sherman": {"rank": 2},
                    },
                },
            ]
        },
        "aviation": {"range": [{"p_26a_34": {"rank": 1}}]},
    }
}


def test_parse_shop_columns_and_groups():
    units, trees = parse.parse_shop(SHOP)
    assert set(units) == {
        "us_m2a4",
        "us_m5a1_stuart",
        "us_m2_medium",
        "us_m4a1_1942_sherman",
        "us_m4_sherman",
    }
    assert units["us_m4_sherman"].group == "us_sherman_group"
    assert units["us_m4_sherman"].column == 1
    (tree,) = trees
    assert tree.nation == "usa"
    assert [c.units for c in tree.columns[1]] == [
        ["us_m2_medium"],
        ["us_m4a1_1942_sherman", "us_m4_sherman"],
    ]


def test_ground_ranks_filters_by_move_type():
    wpcost = {
        "economicRankMax": 41,
        "germ_tiger": {
            "unitMoveType": "heavy_tank",
            "economicRankArcade": 14,
            "economicRankHistorical": 14,
            "economicRankSimulation": 15,
        },
        "us_jeep": {
            "unitMoveType": "wheeled_vehicle",
            "economicRankArcade": 0,
            "economicRankHistorical": 1,
            "economicRankSimulation": 2,
        },
        "p_51": {"unitMoveType": "air", "economicRankArcade": 9},
    }
    assert parse.ground_ranks(wpcost) == {
        "germ_tiger": {"ab": 14, "rb": 14, "sb": 15},
        "us_jeep": {"ab": 0, "rb": 1, "sb": 2},
    }


def test_parse_lang_keeps_shop_and_group_rows():
    text = (
        '"<ID|readonly|noverify>";"<English>";"<French>"\n'
        '"germ_tiger_shop";"Tiger H1";"Tiger H1"\n'
        '"germ_tiger_0";"Pz.Kpfw. VI Tiger Ausf. H1";"x"\n'
        '"germ_tiger_2";"Heavy tank";"Char lourd"\n'
        '"shop/group/us_sherman_group";"M4A1/M4/M4A2";"x"\n'
        '"ussr_pzkpfw_III_ausf_J_L42_shop";"▂T-III";"▂T-III"\n'
    )
    lang = parse.parse_lang(text)
    assert lang["germ_tiger_shop"] == "Tiger H1"
    assert lang["shop/group/us_sherman_group"] == "M4A1/M4/M4A2"
    assert lang["ussr_pzkpfw_III_ausf_J_L42_shop"] == "▂T-III"
    assert "germ_tiger_2" not in lang


def test_sights_stock_and_modification():
    model = {
        "nightVision": {"driverIr": {"resolution": [800, 600]}},
        "modifications": {
            "night_vision_system": {
                "effects": {
                    "nightVision": {
                        "gunnerThermal": {"resolution": [500, 300]},
                        "commanderViewThermal": {"resolution": [800, 600]},
                        "driverIr": {"resolution": [800, 600]},
                    }
                }
            }
        },
    }
    sights = parse.parse_sights(model)
    assert sights["driver"] == [{"kind": "ir", "resolution": (800, 600), "viaModification": False}]
    assert sights["gunner"] == [
        {"kind": "thermal", "resolution": (500, 300), "viaModification": True, "gen": 1}
    ]
    assert parse.best_thermal(sights) == {"gunner": 1, "commander": 2}


def test_unit_type_and_operator():
    tags = {"country_finland": True, "tank": True, "type_medium_tank": True}
    assert parse.unit_type(tags) == "medium_tank"
    assert parse.operator_country(tags, "sweden") == "finland"
    assert parse.operator_country({"country_sweden": True}, "sweden") is None
    assert parse.unit_type({"type_spaa": True, "type_light_tank": True}) == "spaa"


def test_status_and_hidden():
    assert status_of({}, {}) == "tree"
    assert status_of({"costGold": 5000}, {}) == "premium"
    assert status_of({"researchType": "clanVehicle"}, {"isClanVehicle": True}) == "squadron"
    assert status_of({}, {"event": "winter_2017"}) == "event"
    assert is_hidden({}, {"showOnlyWhenBought": True})
    assert not is_hidden({}, {})


def test_gun_name_lookup_is_case_insensitive():
    model = {
        "commonWeapons": {
            "Weapon": [{"blk": "gameData/Weapons/groundModels_weapons/88mm_Kwk36_user_cannon.blk"}]
        }
    }
    stats = parse.parse_stats(model, {}, {}, {"88mm_kwk36_user_cannon": "88 mm KwK36 cannon"})
    assert stats["mainGun"] == "88 mm KwK36 cannon"


def test_parse_shop_old_list_format():
    old = {
        "country_usa": {
            "army": [
                {"range": {"us_m2a4": {"rank": 1}}},
                {"range": {"us_m2_medium": {"rank": 1}, "us_m3_lee": {"rank": 2}}},
            ]
        }
    }
    units, trees = parse.parse_shop(old)
    assert set(units) == {"us_m2a4", "us_m2_medium", "us_m3_lee"}
    assert units["us_m3_lee"].column == 1
    assert len(trees[0].columns) == 2


def test_air_and_heli_types():
    assert (
        parse.unit_type(
            {"air": True, "type_fighter": True}, {"unitMoveType": "air", "unitClass": "exp_bomber"}
        )
        == "bomber"
    )
    heli_tags = {"air": True, "type_attack_helicopter": True}
    assert parse.unit_type(heli_tags, {"unitMoveType": "helicopter"}) == "attack_helicopter"
    assert (
        parse.unit_type({"type_utility_helicopter": True}, {"unitMoveType": "helicopter"})
        == "utility_helicopter"
    )


def test_air_stats_from_shop_card():
    stats = parse.parse_air_stats(
        {"Shop": {"maxSpeed": 194.0, "maxSpeedAlt": 7620.0, "climbSpeed": 18.0, "turnTime": 23.0}},
        {"crewTotalCount": 1},
    )
    assert stats == {
        "maxSpeedKmh": 698.0,
        "maxSpeedAltM": 7620.0,
        "climbRate": 18.0,
        "turnTimeS": 23.0,
        "crew": 1,
    }
