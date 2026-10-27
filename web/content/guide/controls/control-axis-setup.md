---
title: Control Axis and Sensitivity Setup
summary: Tuning joystick and gamepad axes: dead zone, nonlinearity, multiplier, correction, sensitivity, and driving prop pitch, mixture and radiator from keys.
source: https://wiki.warthunder.com/controls/4785-setting-up-control-axis-and-sensitivity
---

If you fly with a joystick, HOTAS or gamepad, a few axis settings make a big difference to how precise your aircraft feels. This page walks through each option in the axis settings window, explains what the sensitivity slider really does, and shows how to control axes such as propeller pitch, mixture and radiator with buttons.

## Reading the axis display

At the top of the controls tab there is a small window that visualises the axis. The **red diamond** is the raw position of your physical stick; the **green diamond** is the value the game actually uses after your settings are applied. Every option below changes how the green diamond follows the red one, so keep an eye on it while you adjust.

## Axis settings

### Dead zone

The dead zone is a small area around the stick's centre where movement is ignored. It cures stick drift, calms down over-sensitive devices and stops the input jittering around neutral. With a dead zone set, the green diamond only starts moving once the red one has left that central area.

Some devices have a dead zone built in and some do not, so set it to suit yours. The smallest value is usually enough for a steady neutral; older controllers may need a bit more. You can set it either in your device's own software or in the game.

### Nonlinearity

A linear axis sends the same amount of change for every bit of stick movement, from centre to full deflection. Nonlinearity makes the centre less sensitive and the edges more so: small, precise corrections near neutral, while full deflection is still quick. In the display, the green diamond lags behind the red one near the centre and catches up towards the edge.

A value of 1 is fully linear. Many pilots use something between 1 and 2.5 on pitch, roll and yaw, but this is personal, so experiment in a test flight.

**Check your stick first.** Not every controller is linear to begin with. The X-52, for example, is known for nonlinear roll and pitch curves that no driver can fix, only physical modifications. Adding in-game nonlinearity on top of a stick like that makes things worse: very dull near the centre and twitchy near the edges, a quick route to stalling. Some higher-end HOTAS devices let you shape the response curve outside the game.

To test linearity, use the free program joytester2 and move the stick around in a circle. A linear stick traces something close to a circle; a nonlinear one draws shapes closer to a rhombus. You can see the same thing in the game by circling the stick and watching the control column in the cockpit. If your device is already nonlinear, leave the in-game nonlinearity alone.

### Invert axis

Reverses the direction of an axis. It is most often needed for throttles: if pushing the lever down increases throttle, inverting the axis makes pushing it up do that instead.

### Multiplier

The multiplier scales your input before it reaches the aircraft.

| Multiplier | Result at full stick deflection |
|---|---|
| 1 | Full (100%) control surface deflection |
| Below 1, e.g. 0.8 | Proportionally less, e.g. 80% deflection |
| Above 1 | Reaches 100% before the stick reaches its limit |

A value below 1 can help stop you stalling in tight turns. Apart from that, moving it away from 1 brings no benefit, on a joystick or a gamepad.

### Correction

Correction shifts an axis that sits off centre. Most modern controllers calibrate themselves, but for those that do not, this realigns the axis. It works by adding a fixed offset, so the green diamond moves away from the centre even when the red one is sitting at zero.

## Sensitivity

Sensitivity here is about response time: how quickly the virtual stick in the cockpit, and with it the control surfaces, follows your real one.

- **100% (full bar):** the virtual stick matches your movements instantly, both going out and coming back to neutral.
- **Lower:** the virtual stick and control surfaces take a moment to catch up, and also take longer to return to neutral when you let go.
- **Minimum (empty bar):** the response is very slow, with a large delay behind your inputs.

Lower sensitivity helps on gamepads, whose small thumbsticks need precise movements and can otherwise throw the control surfaces around too fast. It can also help beginners and anyone using a very sensitive controller. Joysticks have bigger handles and longer travel, so they are easier to control, and experienced joystick pilots usually do best with high or even maximum sensitivity.

## Controlling an axis with buttons

Keys and mouse buttons can drive an axis too. This is especially handy in Simulator battles for the radiator, mixture and propeller pitch.

### Turn on relative control

On the axis you want, set **Relative control** to Yes. The "Maximum value" and "Minimum value" bindings change to "Increase value" and "Decrease value", and the axis now keeps its value when you let go of the button. With relative control set to No, buttons can only send the axis to its maximum or minimum, and it snaps back to neutral the moment you release them.

### Tune the step and repeat rate

- **Relative control sensitivity** sets how fast a held key repeats, and so how fast the value climbs or falls while you hold it. Lower is slower, higher is faster, just like key repeat in Windows.
- **Relative control step** sets how much of the axis range one press moves. Its scale only runs from 0 to 50%, so whatever you set is effectively halved. With a step of 10%, a single press moves propeller pitch (0 to 100%) by only 5%. For 10% per press, set the step to 20%. This assumes a multiplier of 1, since the multiplier also affects the result.

### Limit a slider to part of a range

Multiplier and correction together can map a control onto just part of an axis. One example uses the thumb slider on an X-52 Pro for mixture, whose axis runs from 0 to 120%. A multiplier of 0.5 makes the slider cover half of that length, 60% of mixture. Adding a correction of 25% moves the starting point up, so the slider now runs from 60% to 120% of mixture. Not the most intuitive setup, but it works.

### Switch to manual engine control

Pitch, mixture and radiator only respond if the aircraft is set to **Full Control** in the control settings (Menu, then Controls), and you have switched to manual engine control in flight, since engine control is automatic by default. You can also turn manual engine control on in flight through the Y menu (Y, 5, 4). On some later aircraft you may also need to turn off automatic propeller pitch and radiator control. Not every aircraft lets you adjust these at all.

## Testing your settings

Take a test flight and watch the stick in the cockpit: it should move exactly as your physical stick does, unless you have inverted an axis. Then switch to an external view and check how the control surfaces respond. You can pause at any point (P by default) or press Escape to change settings mid-flight and see the effect straight away. The defaults suit most players, but it is worth trying a few setups to see whether one suits you better.
