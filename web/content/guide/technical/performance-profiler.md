---
title: Performance Profiler
summary: How to record a performance log with War Thunder's built-in profiler when you get FPS drops, and which files to send with your report.
source: https://wiki.warthunder.com/311-technical-performance-profiler
---

If the game stutters or your frame rate drops, a description alone rarely lets anyone find the cause. War Thunder has a built-in performance profiler for exactly this. You switch it on, play normally, and it records what the game was doing so the technical team can see where the time went.

Everything is driven from the **F11** key.

## The key combinations

| What you want | Keys |
|---|---|
| Turn the profiler on or off | **Fn + Alt + F11**, or **Alt + F11** if your keyboard has no Fn key |
| Save the recorded data / mark a moment | **Fn + F11**, or **F11** without an Fn key |

The per-system variants given for the toggle are:

- **Windows:** Windows key + left Alt + F11
- **Mac:** Apple key + left Alt + F11
- **Linux and others:** Fn + left Alt + F11, or just left Alt + F11

You can tell what the profiler is doing from a message in the top left corner of the screen: it confirms when the profiler is switched on, when its data is being stored to the log, and when it is switched off.

## Recording a general performance log

1. Start the game, log in, and wait until the hangar has loaded.
2. Turn the profiler on.
3. Play several battles with it running: at least 3.
4. After the last battle, press the save key (Fn + F11, or F11). This writes the profiler's data into your [client log](/guide/technical/client-logs/).
5. Turn the profiler off with the same keys you used to turn it on.
6. Attach the complete `.clog` file to your report.

## Catching a specific FPS drop

If the drops happen at particular moments, you can mark them as they happen:

1. Start the game and go into a battle.
2. Press **left Alt + F11** to start recording.
3. The moment the frame rate drops, press **F11** once to mark that point in time.
4. Press left Alt + F11 again to stop.

This produces `.dap` files in the game's `.game_logs` folder, and those are what you attach to the report:

| File | Created by |
|---|---|
| `spikes-date_time.dap` | Running the profiler (Alt + F11) |
| `ring-datetime.dap` | Pressing F11 |

If you're not sure which kind of report you need, send both the `.clog` and any `.dap` files from the session.
