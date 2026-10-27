---
title: Aircraft HUD
summary: How to read the 410SUM1 HUD on Harriers and Jaguars and the Buccaneer S.2 HUD, including their CCIP, CCRP and missile modes.
source: https://wiki.warthunder.com/mechanics/236-hud
---

A head-up display (HUD) is a clear glass panel in front of the windscreen that shows flight and weapon information, so the pilot doesn't have to look down at the instruments. Every HUD design looks and works a little differently, and most have several modes. This page explains two of them: the 410SUM1, used on the Harrier and Jaguar families, and the Buccaneer S.2's own HUD.

## Controls

Only two controls affect the HUD:

| Control | Default key | What it does |
|---|---|---|
| Toggle Cockpit Sight | ' (apostrophe) | Switches the gunsight on and off, which here means the whole HUD |
| Switch sight mode in cockpit | Unbound | Steps through the HUD modes, usually the standard mode plus several ground-attack modes |

For CCRP bombing, place your target point **before** you switch the HUD into its automatic bombing mode. How to place one is explained in [Ballistic Computer](/guide/mechanics/ballistic-computer/).

## 410SUM1 (Harrier and Jaguar)

Five modes: Standard, Cannon on ground target, Rockets, Bombs, and Bombs (auto).

### Standard mode

| Symbol | How to read it |
|---|---|
| Aircraft symbol | Where the nose is pointing. Its little wings always stay level with the aircraft's wings. |
| Horizon bar | Two solid lines either side of a gap, always parallel to the real horizon. Put the aircraft symbol on it and you're flying level. |
| Pitch bars | Lines parallel to the horizon every 30°. Bars above the horizon have 4 dashes each side of the gap, and bars below have 2. |
| True air speed | Your true airspeed (TAS) in knots |
| Radar altitude | Height above the ground in feet, up to 5,000 ft. Above that it disappears. |
| Angle of attack | An arrow against a scale. The solid line is 0°, the three dots above it are 8°, 12° and 16°, and the dot below is −5°. |
| Vertical speed | An arrow against a scale in feet per minute. The solid line is 0, and each dot is 500 fpm, so the scale runs from +1,000 to −2,000 fpm. |
| Heading | Compass heading with the last digit dropped, so 32 means 320°. |
| Sideslip | A circle beside a vertical line. Centred means no sideslip. Mainly useful in VTOL flight. |
| Gyro gunsight | A normal gyro gunsight |

### Attack modes (CCIP)

In Cannon on ground target, Rockets and Bombs modes, two things change and everything else stays the same:

- A **computed impact point** marker takes the place of the gyro gunsight, showing where the selected guns, rockets or bombs will hit.
- The aircraft symbol becomes the **FRL cross** (Fuselage Reference Line), set 6° higher. When the cross sits on the horizon bar, your nose is actually 6° below the horizon.

### Bombs (auto) mode (CCRP)

The standard symbols stay, plus:

| Symbol | How to read it |
|---|---|
| Bombing line | A vertical line through your chosen target |
| CCRP target | A short horizontal mark on the bombing line, where the target is |
| Time circle | Appears while you fly towards the target. It starts almost complete and shrinks anticlockwise as you close in. |
| Break X | An X in the middle of the time circle, warning that you're at risk of hitting the ground or being caught in your own bombs' blast. Pull up. |

To bomb: place the target point, select Bombs (auto), and steer so the centre of the aircraft symbol lines up horizontally with the bombing line, which means you are flying straight at the target. As the time circle starts to shrink, press and hold bomb release. When the circle disappears, the bombs drop and hit the mark. If the Break X appears, pull up.

### Missile symbols

Whenever you activate an air-to-air missile, in any mode, two extra symbols appear:

- **A fixed cross** in the centre of the HUD. It flashes while the missile is getting ready and goes steady when it's ready.
- **A second cross** circling around the fixed one. It also flashes until the missile is ready. It vanishes when the missile has a target, and comes back if the missile loses it.

## Buccaneer S.2

A fairly simple HUD with four modes: Standard, Rockets, Bombs, and Bombs (auto).

### Standard mode

The standard mode shows little more than your speed and roll angle.

| Symbol | How to read it |
|---|---|
| Aircraft symbol | Where the nose is pointing. Its wings stay level with the aircraft's wings. |
| Roll bars | Two bars that stay parallel to the ground. Compare them with the aircraft symbol to read your roll. |
| Quadrantal marks | Four marks fixed relative to the aircraft symbol, which help you read roll angle against the roll bars |
| Target spot | Fixed in the centre of the aircraft symbol, or works as a gyro gunsight when rockets are carried |
| Speed scale | Indicated airspeed from 300 to 600 knots. The four dots are 300, 400, 500 and 600 kts, and the line's position along them is your speed. |

### Rockets and Bombs modes (CCIP)

Everything stays the same except the target spot, which now shows the computed impact point of the rockets or bombs. If it seems to have vanished:

- With bombs, it has probably dropped off the bottom of the HUD. Put the nose down into a dive to bring it back.
- With rockets, it's either the same problem or you're still too far away.

The impact point appears at the same range as the third-person CCIP marker, which depends on the weapon.

### Bombs (auto) mode (CCRP)

| Symbol | How to read it |
|---|---|
| Target spot | Sits on the CCRP target point |
| Range circle | Appears as you fly towards the target. It starts almost complete and shrinks anticlockwise. |
| Quadrantal marks | As in standard mode, but they also act as scale marks for the range circle |
| Acceptance mark | Shows that a target point is set and you're in CCRP mode. It disappears if the target point is removed or you turn away from it. |
| 3 second event mark | Appears 3 seconds before the bombs release automatically |

To bomb: place the target point and select Bombs (auto). The acceptance mark and range circle appear, and the target spot jumps onto the target. Steer until the target spot is centred left to right in the HUD, which means you're heading straight for it. Start holding bomb release as the range circle begins to shrink. The 3 second event mark warns you that release is close, and the bombs drop when the circle disappears.
