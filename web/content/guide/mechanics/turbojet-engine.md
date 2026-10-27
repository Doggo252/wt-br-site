---
title: Turbojet Engines
summary: Why early jet engines lose thrust at low speed and regain it as speed builds, and why installed thrust is lower than the test-bench figure.
source: https://wiki.warthunder.com/mechanics/244-turbojet-engine
---

Early jets can feel strangely flat at low speed, then come alive once they are moving fast. That isn't the flight model playing tricks: it follows from how a turbojet's thrust changes with airspeed. Once you know the shape of that curve, it is easier to see why first-generation jets in the [air trees](/air/) reward keeping your speed up.

## How early turbojets were run

The first turbojets had a gas path of fixed shape, so the only thing the pilot or the engine's regulator could change was the fuel flow. Engines were therefore run to hold two things steady: engine RPM, and the temperature of the gas leaving the combustion chamber.

How thrust changes with Mach number at a fixed altitude, under that regime, is called the engine's **velocity characteristic**.

## Two trends pulling against each other

- **Specific thrust falls with speed.** Specific thrust is the thrust you get per unit of air passing through, and it depends on how much faster the exhaust leaves than the aircraft is flying. As flight speed rises that gap shrinks, and when the two are equal the engine produces no thrust at all.
- **Pressure and airflow rise with speed.** The faster you fly, the more ram pressure forces air into the intake, so the pressure rise and the mass of air flowing through both grow. At low speed the gain is small; at higher speed it climbs quickly, in a roughly quadratic way.

## The resulting thrust curve

Put those together and thrust follows a dip, a rise and then a fall:

1. **From a standstill to about Mach 0.5-0.6**, thrust drops, because specific thrust is falling faster than pressure and airflow are rising.
2. **Above that**, the growing pressure and airflow win out and thrust climbs again.
3. **Somewhere around Mach 2-4**, thrust falls back to zero.

Thrust-against-speed charts for the VK-1 and the Jumo 004B both show this shape. It's the reason a turbojet is at its weakest at low speeds and again at very high ones.

## Installed thrust is lower than the book figure

The thrust quoted in reference books is usually measured on a test bed. Once the engine is in an aircraft, it loses some of that:

- Early jet engines were big compared with the airframe, so they were usually buried inside the fuselage, which made it harder to feed them air.
- A good share of compressed air was bled off after the compressor to run pneumatic systems and keep the cockpit pressurised.
- The engine also drove oil pumps and electrical generators.

The VK-1 in the MiG-15bis shows how much this matters:

| VK-1 condition (sea level) | Thrust |
|---|---|
| On a test bed, zero speed | 2700 kg |
| Installed in the MiG-15bis, zero speed | 2500 kg |
| Installed, in flight at low speed | 2150 kg (80% of the static test-bed figure) |
