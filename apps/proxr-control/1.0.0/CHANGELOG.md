# Changelog

## 1.0.0

- Initial release.
- Register ProXR controllers over DigiMesh and read each board's feature map.
- Custom control panels assembled from cards — command buttons, relay
  indicators and grids, analog readouts and trend charts, controller status —
  on a drag-and-drop grid.
- Per-relay and per-bank control with friendly names, plus timed "on for N
  seconds" commands the controller times itself.
- Sequences: ordered command lists with delays, runnable from a panel button.
- Schedules: a command or sequence at a time of day, described in plain English
  with the next three firings previewed, evaluated in the gateway's timezone.
- Command console with the exact transmitted frame and decoded reply.
- Activity log of every operator command and controller response.
- Inter-app bus support: publishes controller status, relay state and analog
  input; provides relay, bank, flasher and sequence commands as actions.
