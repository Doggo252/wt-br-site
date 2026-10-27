---
title: Ground Vehicle Modules
summary: What each internal part of a tank does, how damage to it plays out in Arcade versus Realistic and Simulator, and which hits hurt most.
source: https://wiki.warthunder.com/mechanics/4775-ground-vehicle-modules
---

Tanks in War Thunder have no health bar. What keeps one in the fight is the collection of parts and crew inside the armour, and a single shell into the right component can finish a vehicle whose plates are barely scratched. Knowing what each module does tells you what to protect on your own vehicle and where to aim on the enemy's.

## How damage states work

Modules change colour as they take damage: orange, then red, then black (knocked out). They fall into two groups:

- **Linear modules** lose performance with any damage, and the worse the damage the bigger the loss. The engine, transmission, barrel and crew work this way.
- **All-or-nothing modules** barely notice partial damage but stop working when fully knocked out. The radiator, fuel tanks, aiming drives and the newer electronic systems behave like this.

Several modules also behave differently by mode, so the tables below split Arcade (AB) from Realistic and Simulator (RB/SB).

## Mobility

### Engine

Of all the modules this is the one to guard most closely, arguably more than any single crewman: a tank a crewman or two short can often keep fighting, but one stranded in the open under fire seldom lasts. It usually sits at the back, which tends to be the thinnest part of the hull. It is sturdy enough to catch shrapnel and sometimes even whole shells, but it can burn, and a black engine has a high chance of catching fire.

| State | AB | RB/SB |
|---|---|---|
| Orange or red | Big loss of power | Big loss of power |
| Black | Very large loss of power, but you can still crawl | Vehicle cannot move |

### Transmission

The transmission takes the engine's power to the tracks or wheels, so losing it is just as bad as losing the engine. It can also catch fire. On some German designs it is a very large target, stretching from the engine bay all the way to the drive sprockets at the front.

| State | AB | RB/SB |
|---|---|---|
| Orange or red | Big loss of power | Big loss of power |
| Black | Slow movement still possible | Vehicle cannot move |

### Radiator

The radiator cools the engine. It sits near it, is fairly large and offers almost no resistance to shells. Since Update "La Royale" it can be functionally damaged in ground battles. Partial damage changes nothing, but a knocked-out radiator makes the engine overheat, which causes damage, a gradual loss of power and finally a stall that leaves you stranded. You can usually limp to cover first, but repair it quickly: leave it too long and you will be fixing the engine as well.

### Tracks and wheels

Most tracked vehicles have two tracks, some more. A hit in the track is often a lucky one for you, except on SPGs: tracks are structural steel and add protection, sometimes even stopping HEAT rounds. Stay still for a few seconds and track repairs start by themselves in every mode.

Wheels are flimsier than tracks and can be knocked out by machine-gun fire or nearby explosions. On the other hand, a wheeled vehicle with four, six or eight wheels has spares to lose: a BTR-80A can keep driving on several damaged wheels, just less nimbly, while a tracked vehicle that loses a track is usually stuck. Since Update "Seek & Destroy" a failed wheel can also throw the vehicle into a sideways skid and tilt it far enough that you cannot fire. Crews often carry spare wheels, so repairs are fairly quick.

### Driver controls

Steering, pedals, levers and gauges. If they fail, the vehicle may be unable to move or steer, which in practice leaves it immobilised.

## Firepower

### Breech

The breech is where rounds go into the gun. It sits inside the fighting compartment, which protects it, but damage here can put the whole weapon out of action.

| State | AB | RB/SB |
|---|---|---|
| Orange | Substantial chance of a misfire, without detonation | Substantial chance of detonation |
| Red | Significant chance of a misfire, without detonation | Significant chance of detonation |
| Black | Very significant chance of a misfire, without detonation | Cannot fire |

### Barrel

The barrel is the exposed part of the gun and easy to damage. A badly damaged barrel may not survive the pressure of firing and can burst. A burst barrel outside the fighting compartment will not kill you, but it wrecks your firepower, so repair it straight away; that is usually quicker than replacing a destroyed gun. In AB you can keep shooting with a burst barrel, though with much worse accuracy and penetration. In RB and SB the gun is useless, and the damage is plain for enemies to see.

| State | AB | RB/SB |
|---|---|---|
| Orange | High chance of destruction | High chance of destruction |
| Red | Destruction practically certain | Destruction practically certain |
| Black | Destroyed, but can still fire | Destroyed, cannot fire |

### Traverse and elevation drives

These small, vulnerable drives turn the turret and raise or lower the gun. Partial damage has little effect, but once they are knocked out your aiming suffers badly. You can sometimes still aim roughly by turning the whole hull.

| State | AB | RB/SB |
|---|---|---|
| Orange or red | Aiming speed unaffected | Aiming speed unaffected |
| Black | Aiming much slower | Aiming mechanism disabled |

### Autoloader

On vehicles that have one, the [autoloader](/guide/mechanics/autoloader/) does all of the reloading. When it is damaged the gun cannot be reloaded until it is repaired, and the crew cannot load by hand. A round that is already in the chamber can still be fired, so you may get one last shot off.

## Modern systems

Update "Seek & Destroy" added a set of modules that represent modern vehicle electronics. They are all-or-nothing: partial damage usually does nothing, but a knocked-out module badly limits what it controls. The crew can repair them in the field. What each one covers differs from vehicle to vehicle; in the hangar, hover over a module in X-ray view to see the list.

- **Fire control system (FCS).** Helps with spotting targets and working out lead. Depending on the vehicle it can include the laser rangefinder, night vision, gun stabiliser and radiation or laser warning, all of which can drop out when it is hit. You can usually still aim and fire manually, but on vehicles with unmanned turrets or remotely operated weapons, such as the 2S38 and PUMA, FCS damage can stop you aiming and firing altogether.
- **Electrical system.** Generators, batteries and the wiring that feeds sensors, radar, FCS and other electronics. Damage shuts many of those down, radar and stabilisation included, and raises the risk of fire.
- **Radio-electronic equipment.** Radios, radar and optical search and tracking stations, and laser or radiation warning systems. Lose these and you lose tracking data, which makes it much harder to work out gun lead or guide missiles against aircraft.

## Things that burn or explode

### Ammo racks

If an ammo rack detonates, the vehicle is usually gone. Most vehicles have several racks in different places, and they empty in a fixed order that is different for each vehicle. An empty rack cannot be hit, which is why many players carry fewer rounds to keep racks out of exposed areas; see [first-stage ammo stowage](/guide/mechanics/first-stage-ammo-stowage/) for how ready racks fit in. On separate-loading guns like the IS-2's, shells and charges are stored apart and can be scattered around the vehicle. Inert projectiles do not explode when hit; only the propellant charges do.

Many modern tanks keep their rounds in a protected bustle compartment behind an armoured partition, fitted with blow-out panels. In X-ray view the partition stands out, often highlighted in red. If the partition and panels do their job, an ammo fire vents outwards, the crew and internal systems survive and the tank keeps fighting. Layouts differ, though. Many Abrams variants keep most of their rounds in one protected compartment, so a catastrophic hit there can leave you with only the round in the gun. The Leopard 2 has extra stowage inside the fighting compartment as well. And once the partition between the ammo and the crew has been breached, the panels cannot protect anyone.

### Fuel tanks

Whether it holds diesel or petrol, a fuel tank is one of the quickest ways to lose a vehicle. A hit can start a fire or set off the fuel vapour in an instant explosion that destroys the vehicle. How likely that is depends mostly on the round: high-explosive shells carry the biggest risk. Fuel can also stop weaker rounds and shrapnel. Internal tanks may sit in the engine bay, by the transmission, or in the fighting compartment next to the ammo and crew. External auxiliary tanks, mounted behind armour or walled off from vital parts, are less likely to cause a catastrophe and add a layer of protection.

The damage colour does not change the risk; that depends on the vehicle and the round. Since Update 2.3.0.42 a destroyed fuel tank is removed from the damage model: further hits on it cannot start fires or explosions, but it also no longer shields the modules and crew behind it.

## Crew

Each crewman is a separate part of the damage model. A wounded crewman keeps doing his job; only at black is he knocked out for the rest of the battle. Since Update "Seek & Destroy", wounded crew also recover on their own after a delay until any performance penalty has gone, and a healing icon shows on the damage panel while they do. The Crew Replacement upgrade lets you call in one replacement crewman per battle. Most vehicles count as destroyed once fewer than two crew are left, though there are exceptions such as the Strv 103.
