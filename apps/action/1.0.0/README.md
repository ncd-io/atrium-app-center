# Action

Automate relay control with sensor-triggered recipes and interactive board
management.

## What it does

- Build **recipes** that command relays in response to live sensor telemetry.
- Manage NCD relay boards interactively from the dashboard.
- Subscribe to telemetry in real time so actions fire the moment a threshold is
  crossed.

## Requirements

- Atrium platform **2.0.0** or newer.
- At least one NCD relay board paired with the gateway.

## Permissions

- `data:read` — reads telemetry from the platform database (read-only).
- `telemetry:subscribe` — receives live sensor frames.
- `relay:command` — sends relay commands through the platform.
