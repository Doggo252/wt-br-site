---
title: Launcher Logs
summary: What the War Thunder launcher log records, when you need it, and where to find the right file for a bug report.
source: https://wiki.warthunder.com/308-technical-launcher-logs
---

The launcher keeps its own log, separate from the game's [client log](/guide/technical/client-logs/). If your problem happens before you reach the hangar, for example while updating, checking files or starting the game, this is the file the technical team needs. Launcher logs are plain text files (`.txt`).

## What it covers

Each launcher log covers one launcher session. It starts when you open the launcher to play and ends when the launcher closes, either to hand over to the game or because you quit to the desktop. Everything the launcher tried to do in that time is listed, which makes it the main tool for tracking down faults in the launcher itself.

## Where to find it

Launcher logs are stored in a folder called `.launcher_log` inside your War Thunder installation:

- **Installed from the Gaijin website:** look in the install folder you chose during setup.
- **Installed through Steam:** look in Steam's standard install location for the game.

Each file name is a time stamp in this pattern (note the double underscore before the ID):

`YEAR_MONTH_DAY_HOUR_MINUTE_SECOND__ID.txt`

Sort by date and take the log from the session where the problem happened. In most cases it is the newest file. Attach it to your report.

If the launcher crashed outright, also look for [problem report files](/guide/technical/problem-report-files/).
