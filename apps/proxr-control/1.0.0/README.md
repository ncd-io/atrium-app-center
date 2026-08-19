# ProXR Control

Build custom control panels for NCD **ProXR** relay controllers over DigiMesh —
relays, timers, flashers and A/D inputs.

## What it does

- Register each ProXR board once — name, DigiMesh address, relay count, analog
  input options — and the app reads the board's own feature map from it.
- **Assemble control panels from cards**: command buttons, relay indicators,
  relay grids, analog readouts and trend charts, and controller status. Drag a
  card anywhere on the grid, or nudge and resize it a cell at a time. Gaps stay
  where you leave them.
- Panels show the controller's **actual reported state**, polled from the board,
  rather than what was last commanded.
- **Controller detail** — per-relay toggles with friendly names, bank actions,
  and timed "on for N seconds" commands. The controller switches the relay back
  off itself, so a lost gateway cannot leave a load energized.
- **Sequences** — ordered command lists with delays between steps, for startup,
  shutdown, or test runs. Runnable from a panel button.
- **Schedules** — run a command or sequence at a time of day, described in plain
  English with the next three firings shown before you save. **Run now** proves a
  schedule without waiting. Times follow the gateway's timezone, so 06:00 stays
  06:00 across daylight-saving changes.
- **Command console** — pick any command, see the exact frame that will be
  transmitted, send it, and read the decoded reply.
- **Activity** — every operator command with the bytes exchanged, who sent it,
  and whether the controller answered.

## Automations

ProXR Control participates in the gateway's inter-app bus, so its state can
drive — and be driven by — other apps. Wiring is done by you in the platform;
apps never reach into each other directly.

**Publishes:** controller status, relay state, analog input readings.

**Provides:** set a relay, set every relay in a bank, set a flasher, run a
sequence.

## Requirements

- Atrium platform **2.4.0** or newer (the inter-app bus and DigiMesh peer I/O
  were added in 2.4.0).
- One or more NCD ProXR relay controllers reachable over the gateway's DigiMesh
  radio.
- Each controller's 64-bit DigiMesh address.

## Permissions

- `data:read` — reads platform data (read-only).
- `digimesh:transmit` — sends commands to ProXR controllers over the radio.
- `digimesh:subscribe` — receives controller replies and status.
- `events:publish` — publishes controller state on the inter-app bus.
- `actions:provide` — exposes relay, bank, flasher, and sequence commands for
  other apps' events to trigger.
