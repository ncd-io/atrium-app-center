# Productivity Monitor

Track machine runtime against shift quotas with real-time gauges.

## What it does

- Live runtime gauges for each monitored machine, updated as sensor frames arrive.
- Compares actual runtime against configurable shift quotas so operators can see
  at a glance whether a line is on pace.
- Per-shift rollups you can review from the dashboard.

## Requirements

- Atrium platform **2.0.0** or newer.
- At least one machine with a runtime/vibration sensor already reporting to the
  gateway.

## Permissions

- `data:read` — reads telemetry from the platform database (read-only).

## Notes

Productivity Monitor is the shared data source for the **OEE** and **Energy
Monitor** apps. Install it first if you plan to use either of those.
