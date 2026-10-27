---
title: HE Effect and Overpressure
summary: How explosive-filled rounds breach armour and spray fragments, and when overpressure injures crew, as modelled since the Ixwa Strike overhaul.
source: https://wiki.warthunder.com/mechanics/4236-the-mechanics-of-high-explosive-effect-and-overpressure
---

When an explosive round goes off, three things do the damage: the shock wave, the shattering force of the blast (its brisance), and the fragments it throws out. Update 2.5 "Ixwa Strike" rebuilt how all of this is modelled to make it more realistic, replacing the old "hull destruction" mechanic. The game now handles it as two connected systems: the high-explosive effect, which can break through armour, and overpressure, which can hurt the crew. For the HE penetration of a specific round, see our [ammunition browser](/shells/).

## The high-explosive effect

Brisance is an explosive's ability to shatter what's around it, and the high-explosive effect is how the game represents it. It applies to every round with an explosive filler:

- high-explosive and fragmentation rounds: shells, rockets, bombs, air-to-ground missiles and surface-to-air missiles
- APHE shells
- shaped-charge ammunition: spin-stabilised and non-spin-stabilised HEAT, ATGMs, rockets, air-to-ground missiles and surface-to-air missiles
- HESH rounds

### Breaching armour

When the round hits armour, the game checks whether its explosive effect can get through either the plate it struck or the nearest plate facing the blast square-on. If it can, the round opens a **breach** at that point. Fragments go through the breach freely and fan out in a cone of roughly 30-45 degrees behind it.

Each round's card lists both its HE penetration and its kinetic penetration, along with its other figures.

Watch out for overpenetration. A round with plenty of kinetic penetration and an insensitive delay fuze can go straight through thin armour without the fuze ever triggering, and simply carry on past.

## Overpressure

The shock wave from a blast creates a sudden spike in pressure that can injure crew even if no fragment touches them. This is overpressure.

When it applies:

- **Only the HE effect causes it.** A shaped-charge jet doesn't, and neither does the spall from a HESH round.
- **APHE needs enough filler.** An APHE shell only causes overpressure if its filler holds at least 170 g of TNT equivalent.
- **The armour must be breached.** If the explosion or its fragments get through the armour and damage an internal module (a crew member, fuel tank, ammunition rack or part of the drivetrain), the armour counts as breached at that spot, and the crew in that compartment take overpressure damage as well.
- **Hitting the gun breech alone isn't enough** to trigger it. Some vehicle designs have other exceptions too.

How it behaves:

- Anyone inside the blast radius can be hurt. The closer they are to where the round went off, the worse it is, and it doesn't always kill.
- The hit camera shows two red spheres when overpressure damage happens.
- Overpressure never spreads beyond the compartment where the module or crew member was hit. A round that breaks into more than one compartment gets a separate overpressure check in each.
- Crew who ride outside the armour, as on open or unarmoured vehicles, are exposed directly: they can take overpressure damage with no breach or module hit needed first.
- **Ships work differently.** Only the crews of open, exposed positions can be knocked out by overpressure: main, secondary and anti-aircraft guns, rangefinders and fire directors. Anything inside the hull is safe from it.

## A worked example

The Japanese Ka-Chi shows how the pieces fit together. Its side is two 10 mm plates: an outer plate and the hull wall behind it.

1. A weak Type 94 HE shell, with 12 mm of HE penetration, hits the side. Its explosive effect is enough to breach the outer plate.
2. Fragments fly through the breach and penetrate the inner plate.
3. Inside, they can damage modules such as the transmission.
4. As soon as an internal module is hit, overpressure kicks in. Crew members close to where the shell's 810 g of explosive went off are hit by the pressure wave.

Even a small shell can be dangerous against a lightly protected vehicle. See [Armour](/guide/mechanics/armour/) for how spaced plates and materials are modelled.
