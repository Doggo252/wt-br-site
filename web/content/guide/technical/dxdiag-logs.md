---
title: DxDiag Logs
summary: How to save a DxDiag report of your PC's hardware and drivers on Windows so it can go with a War Thunder bug report.
source: https://wiki.warthunder.com/307-technical-dxdiag-logs
---

A DxDiag log is a plain text file (`.txt`) produced by Microsoft's DirectX Diagnostic Tool. It lists your system's hardware and the drivers it is running, without any personal information. Support uses it to check whether a problem comes from an incompatibility or a fault in a particular piece of hardware or a driver. It is especially helpful for graphics and sound problems, since it names your display and audio devices and the driver versions they use.

## Saving the log

1. Press **Windows key + R** to open the Run box.
2. Type `dxdiag` and click OK.
3. The DirectX Diagnostic Tool opens in its own window. Give it a moment to finish collecting information.
4. Save the report:
   - On **32-bit (x86) Windows**, click "Save All Information..." and choose where to save the file and what to call it.
   - On **64-bit (x64) Windows**, click "Run 64-bit DxDiag" first, then "Save All Information..." in the new window.
5. Attach the saved text file to your bug report.

It's often worth sending this together with a [client log](/guide/technical/client-logs/), so the team can match what the game did with the hardware it ran on.
