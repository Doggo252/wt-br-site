---
title: Armour
summary: Armour material modifiers, how to work out effective thickness, angling, spaced armour, ERA protection values and add-on track armour.
source: https://wiki.warthunder.com/mechanics/242-armour
---

Armour is the first thing standing between a shell and your crew. The game doesn't just look at how thick a plate is: it also cares what the plate is made of, the angle the shot meets it at, and whether there are gaps, screens or reactive tiles in the way. This page covers how those pieces fit together. To check what a round can actually go through, use our [ammunition browser](/shells/).

## Materials and modifiers

Every material has a modifier that scales its thickness. Rolled homogeneous armour (RHA) is the baseline at 1.00, so a 50 mm plate with a 0.50 modifier stops a shot like 25 mm of RHA. Penetrators fall into two groups, **KE** (kinetic energy) and **CE** (chemical energy). One modifier covers both unless two values are given.

### Ground vehicles

| Material | Modifier | Examples |
|---|---|---|
| Rolled homogeneous armour (RHA) | 1.00 | |
| Modern RHA | 1.01 | Leopard 1A5, Chieftain Mk 3 |
| Cast homogeneous armour (CHA) | 0.94 | |
| Modern CHA | 0.98 | KPz-70, T-64B |
| High hardness rolled armour (HHRA) | 1.25 | Pz.III L, Ikv 91 |
| Modern HHRA | 1.10 | Strv 122A, BMP-2 |
| Tracks | 0.75 | |
| Structural steel | 0.45 | T26E1-1 |
| Structural steel of chassis | 0.60 | |
| Wheel | 0.30 | |
| Rubber-fabric screens | 0.20 | OF-40, M901 |
| Composite screen | 0.16 KE / 2.00 CE | Leclerc S2, Type 16 |
| Air (spaced armour) | 0.05 KE / 0.30 CE | AMX-32, KPz-70 |
| Aluminium | 0.20 | ST-A1, BMP-2M |
| Aluminium alloy 5083 | 0.32 | CM25, M3 Bradley |
| Aluminium alloy AA7017 | 0.50 | Striker, Stormer HVM |
| Aluminium alloy 7020 | 0.50 | Centauro I 120 |
| Aluminium alloy 7039 | 0.50 | R3 T20 FA-HS, Type 75 SPH |
| Alloy ABT-101 | 0.38 | BMP-2, Object 685 |
| Alloy ABT-102 | 0.42 | BMP-3 |
| Aluminium alloy AMS 4050A | 0.50 | AMX-10RC, Type 87 |
| Alloy BT-6 | 0.70 | T-80U |
| External composite armour with NERA elements | 0.10 KE / 1.70 CE | Leopard 2A6, Type 90 (B) |
| Wood | 0.05 | IS-3, Object 120 |
| MEXAS 2 | 0.16 | M1128 |
| MEXAS 2C | 0.16 | M1128 |

### Ships

| Material | Modifier | Examples |
|---|---|---|
| Rolled homogeneous armour | 1.00 | |
| Rolled cemented armour | 1.10 | Heavy cruisers, battleships |
| Structural steel | 0.45 | |
| Coal bunker | 0.01 | |
| Concrete | 0.35 | AF D1, AF D3 |
| Wood | 0.05 KE / 0.00 CE | |
| Antifragmentation armour | 0.90 | |
| Hardened armour | 0.80 | |

## Sloped armour and effective thickness

Tilting a plate back makes a shell travel through more steel than the plate's nominal thickness. That buys protection without adding weight, and the steeper the angle, the better the odds of a ricochet. The costs are harder manufacturing and less room inside.

A simple way to estimate line-of-sight thickness:

**effective thickness = (plate thickness x material modifier) / cos(plate angle)**

Take the Panther's upper front plate: 80 mm of RHA set at 55 degrees, hit by a plain AP shot (modifier 1.0 against KE).

- 80 mm x 1.0 = 80 mm
- cos(55 degrees) = 0.574
- 80 / 0.574 = 139.4 mm, so roughly 140 mm against kinetic AP

This assumes a head-on shot on flat ground with no shell drop. It ignores any sideways angle between the shooter and the plate, and the steeper fall of a shell fired from long range.

## Angling the hull

You can also add effective thickness by turning your whole vehicle so the shot meets the front plate at a slant. This helps most on tanks with flat, vertical armour. The Tiger I is the classic case: its front plate is 100 mm upright, but the Tigerfibel crew manual advised a 45-degree "diamond" stance that gave nearly 130 mm of effective protection.

The catch is the side. Turn too far and you start showing the enemy your thinner side armour, which may be easier to get through than the front you were trying to protect.

Some designs build this in. The IS-3's "pike nose" front slopes both backwards and out to the sides, which raises effective thickness and the chance of a ricochet.

## Spaced armour

Spaced armour is a thinner plate mounted some distance from the main armour. German Schürzen side skirts are the best-known early example. They were meant to soak up the energy of Soviet 14.5 mm anti-tank rifle rounds, which could get through the thin side armour of German tanks. A full-calibre tank shell carries far more energy, so the skirts did little against it except at very steep angles. It's often said they were designed against HEAT from shoulder-fired weapons, but that wasn't their purpose.

Later designs used the gap deliberately. A HEAT jet loses much of its power crossing the air space before it reaches the main armour. A spaced plate can also shatter some kinetic rounds on the first layer: older brittle tungsten penetrators were vulnerable to this, while tougher materials such as depleted uranium made rounds largely immune. In the game, the air in a gap has its own modifier (0.05 against KE, 0.30 against CE), as the table above shows.

## Explosive reactive armour (ERA)

ERA comes as tiles: a layer of explosive sandwiched between metal sheets, bolted over a tank's weak spots. When a round strikes a tile, the explosion disrupts it.

ERA is very effective against HEAT. Early types did little against fast kinetic rounds such as APDS and APFSDS, because they pass through too quickly for the blast to matter, but newer types can resist those too. Downsides:

- Each tile works once. After it fires, the bare armour underneath is exposed.
- Tandem warheads defeat it: a small first charge sets off the tile and the main charge hits the armour behind.
- Tiles rarely cover everything. Curves and moving parts leave gaps you can aim for.

Some vehicles only get their ERA through a modification.

### ERA protection values

| ERA type | vs KE | vs CE | Examples |
|---|---|---|---|
| "Passive" ERA | 5 mm | 370 mm | CM11, M60A1 RISE (P) |
| "Blazer" ERA | 5 mm | 260 mm | Strv 104, Magach 3 (ERA) |
| "CONTACT-1" ERA | 5 mm | 400 mm | T-64B, T-72AV (TURMS-T) |
| "CONTACT-5" integrated ERA | 120 mm | 450 mm | T-72B3, T-90A |
| "Relict" ERA | 20-250 mm | 450-600 mm | T-72B3, T-80BVM |
| FY-4 ERA | 140 mm | 450 mm | ZTZ96A, ZTZ99-II |
| ZTZ59D1 ERA | 5-120 mm | 370 mm | ZTZ59D1 |
| T-69 II G ERA | 5 mm | 370 mm | T-69 II G |
| "ROMOR-A" ERA | 30 mm | 300 mm | Centauro I 105 R, Challenger 2 (2F) |
| "BRENUS" ERA | 5 mm | 400 mm | AMX-30B2 BRENUS |
| Integrated ERA | 10 mm | 250 mm | Leclerc |
| "DYNAS" ERA | 100 mm | 550 mm | T-72M2 Moderna |

## Add-on armour

Crews in the Second World War often hung extra protection on their tanks: logs, sandbags, spare track, concrete or welded plates. Whether most of it stopped anything is still argued over, though it did wonders for crew confidence, and the extra weight strained engines and suspensions. Welded plates were the most useful, as on the up-armoured M4A3E2 "Jumbo" Sherman.

Since Update 1.57, some vehicles can take an **Add-on Armour** modification. It hangs spare track links on the hull and turret, adding on average 17-20 mm of armour wherever they sit.

## Aircraft armour

Planes carry very little armour, because every kilogram costs performance. What there is protects the vital parts. The pilot usually gets bullet-resistant glass that stops rifle-calibre rounds, and some aircraft, such as the P-47, have plating behind the seat. That plating only stops small calibres; mostly it drains a round's energy so whatever gets through does less harm. Some planes also armour the engine. How tough an aircraft is depends mostly on how well the airframe soaks up damage and how well the engine, pilot and fuel tanks are shielded.
