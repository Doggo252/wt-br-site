"""Penetration must match what the game shows (values from the in-game ammo cards)."""

from wtbr import ammo

LO = "lanzOdermatt"


def kinetic(**k):
    return {"damage": {"kinetic": k}}


DM53 = {
    "bulletType": "apds_fs_long_l30_tank", "bulletName": "120mm_dm53", "mass": 5.0, "speed": 1750.0,
    "caliber": 0.12, "damageCaliber": 0.023, "ballisticCaliber": 0.023, "Cx": 0.74,
    **kinetic(**{f"{LO}Material": "tungsten", f"{LO}WorkingLength": 685.0, f"{LO}Density": 17500.0}),
}  # fmt: skip
M829 = {
    "bulletType": "apds_fs_long_tank", "bulletName": "120mm_m829", "mass": 4.268304, "speed": 1670.0,
    "caliber": 0.12, "damageCaliber": 0.027, "ballisticCaliber": 0.027, "Cx": 0.46031,
    **kinetic(**{f"{LO}Material": "depletedUranium", f"{LO}WorkingLength": 460.0, f"{LO}Density": 18600.0}),
}  # fmt: skip
DEMARRE = {"demarreSpeedPow": 1.43, "demarreMassPow": 0.71, "demarreCaliberPow": 1.07}
M61 = {
    "bulletType": "apcbc_tank", "bulletName": "75mm_m61", "mass": 6.79, "speed": 618.0,
    "caliber": 0.075, "explosiveMass": 0.065, "explosiveType": "exp_d", "Cx": 0.379,
    **kinetic(demarrePenetrationK=1.0, **DEMARRE),
}  # fmt: skip
PZGR_40_42 = {
    "bulletType": "apcr_tank", "bulletName": "75mm_pzgr_40_42", "mass": 4.75, "damageMass": 1.12,
    "caliber": 0.075, "ballisticCaliber": 0.075, "damageCaliber": 0.03, "speed": 1120.0, "Cx": 0.28,
    **kinetic(demarrePenetrationK=0.65, **DEMARRE),
}  # fmt: skip
L28A1 = {
    "bulletType": "apds_tank", "bulletName": "105mm_l28a1", "mass": 4.0, "damageMass": 2.7,
    "caliber": 0.105, "damageCaliber": 0.06, "ballisticCaliber": 0.06, "speed": 1478.3,
    "Cx": 0.15718,
    **kinetic(
        demarrePenetrationK=1.12, demarreSpeedPow=1.47, demarreMassPow=0.74, demarreCaliberPow=1.07
    ),
}  # fmt: skip


def test_lanz_odermatt_tungsten_and_range_falloff():
    assert ammo.kinetic_penetration(DM53) == [653, 650, 641, 629, 617, 605]


def test_lanz_odermatt_depleted_uranium():
    assert ammo.kinetic_penetration(M829)[0] == 469


def test_demarre_full_calibre_with_filler():
    pen = ammo.kinetic_penetration(M61)
    assert pen[0] == 104 and abs(pen[-1] - 68) <= 1


def test_demarre_subcalibre_counts_part_of_the_pallet():
    assert ammo.kinetic_penetration(PZGR_40_42) == [228, 224, 204, 182, 162, 145]
    assert ammo.kinetic_penetration(L28A1) == [350, 347, 333, 317, 302, 287]


def test_shell_without_drag_coefficient_still_slows_down():
    m79 = {"bulletType": "ap_tank", "mass": 6.8, "caliber": 0.0762, "speed": 792.0}
    m79 |= kinetic(demarrePenetrationK=0.9, **DEMARRE)
    pen = ammo.kinetic_penetration(m79)
    assert pen[0] == 134 and abs(pen[-1] - 89) <= 1


EXPLOSIVES = ammo.Explosives(
    {"tnt": 1.0, "comp_b": 1.31, "rdx": 1.6},
    [(0.005, 2.0), (0.1, 4.0), (0.2, 5.0), (2.0, 25.0), (3.0, 35.0), (5.0, 40.0), (6.0, 50.0)],
)


def test_heat_hesh_and_blast():
    heat = {
        "bulletType": "heat_fs_tank", "bulletName": "120mm_dm12a1", "mass": 13.5, "speed": 1190.0,
        "explosiveMass": 1.64, "explosiveType": "comp_b", "cumulativeDamage": {"armorPower": 480.0},
    }  # fmt: skip
    r = ammo.round_of(heat, {"120mm_dm12a1": "DM12A1"}, EXPLOSIVES)
    assert (r.name, r.jet, r.pen, r.frag) == ("DM12A1", 480, None, 26.5)
    hesh = {
        "bulletType": "hesh_tank", "mass": 11.4, "speed": 720.0, "explosiveMass": 1.97,
        "explosiveType": "rdx", "cumulativeDamage": {"armorPower": 127.0},
        "armorpower": {"ArmorPower0m": [8.0, 10.0]},
    }  # fmt: skip
    r = ammo.round_of(hesh, {}, EXPLOSIVES)
    assert (r.hesh, r.jet, r.pen, r.frag) == (127, None, None, 35.4)


def test_ammo_options_follow_the_vehicle_and_name_belts():
    weapon = {
        "bullet": [
            {"bulletType": "ap_t", "bulletName": "a", "mass": 0.4, "speed": 970.0},
            {"bulletType": "he_frag_i", "bulletName": "b", "mass": 0.39, "speed": 960.0},
            {"bulletType": "ap_t", "bulletName": "a", "mass": 0.4, "speed": 970.0},
        ],
        "shared_apds": {"bullet": DM53},
        "other_vehicles_only": {"bullet": M829},
    }
    mods = {
        "shared_apds": {"reqModification": "shared_apds_ammo_pack", "value": 240},
        "shared_apds_ammo_pack": {"tier": 4, "reqExp": 20000},
    }
    opts = ammo.ammo_options(weapon, mods, {}, EXPLOSIVES)
    assert [[r.name for r in o.rounds] for o in opts] == [["a", "b"], ["120mm_dm53"]]
    assert (opts[1].tier, opts[1].rp, opts[1].perShell) == (4, 20000, 240)
    assert opts[0].tier is None
