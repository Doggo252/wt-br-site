---
title: Problem Report Files
summary: What the .dmp crash files are, which folder they land in after a game or launcher crash, and what to attach to a crash report.
source: https://wiki.warthunder.com/309-technical-problem-report-files
---

When War Thunder crashes, it writes a problem report file with the `.dmp` extension. It holds a snapshot of the program's memory at the moment it stopped working, which tells the technical team why it went down. You don't have to do anything to create one; it appears on its own. Your only job is to find it and send it.

## Which folder to check

| What crashed | Where to look |
|---|---|
| The game | `.game_logs` |
| The launcher | `.launcher_log` or `.start_app_logs` |

These folders are inside your War Thunder installation: the folder you chose during setup if you installed from the Gaijin website, or Steam's standard install location if you installed through Steam.

## What to attach

1. Open the right folder and sort it by date.
2. Find the `.dmp` file created at the time of the crash. It's usually the newest one of its kind.
3. Next to it is a compressed file created at the same time. Attach **both** the `.dmp` and that compressed file to your bug report.

A [client log](/guide/technical/client-logs/) from the same session helps too, since it shows what the game was doing just before the crash.
