# Changelog

## 1.7.5

- Fixed the **Shift Time Budget** strip tooltips, which were clipped by the
  strip's rounded-corner mask and never appeared on hover. The segment labels
  (Run / Planned stop / Unplanned stop / Unaccounted, with minutes) now show.

## 1.7.4

- **Standalone.** OEE no longer depends on the Productivity Monitor app. It owns
  its own machine and shift configuration and reads sensor telemetry directly,
  so it can be installed on its own. (`requires: ["productivity"]` is dropped;
  minimum platform is now 2.3.0.)
- **Data freshness.** Each machine estimates its own reporting cadence and flags
  a node as stale after several missed intervals, with a "last seen Xm ago"
  caption and a three-state status dot (running / stopped / unknown). Stale
  machines are surfaced in the view and fleet roll-ups.
- **Consistent OEE coloring.** A per-machine OEE **target** drives green/amber/red
  coloring uniformly across the KPI cards, view tabs, machine donuts, and detail
  panel, so the same score never shows two different colors.
- **Cycle-time entry** is idempotent: saving an unchanged parts/min value no
  longer drifts the stored ideal cycle time through rounding.
- Counter handling hardened against out-of-order and duplicate mesh frames — mid-
  range dips are ignored and only true resets re-baseline, so parts and rejects
  aren't double-counted.

## 1.7.0

- **Downtime reason codes** with auto-detected stops from the Availability
  sensor, and a downtime **Pareto** of the top loss reasons.
- **Reject reason codes**: assign reasons to sensor-counted rejects without
  changing the authoritative count, plus an "unclassified" bucket and a reject
  Pareto. Paretos update live as reasons are logged.
- **Guided setup**: onboarding empty state, per-machine setup/plausibility
  health chips, in-modal wiring help, an active-low preset for state-based
  Availability inputs, and a plain-language **? Help** guide.
- **Per-machine reset** ("measure from now") to re-baseline accumulating sensor
  counters for a clean run.
- Shift editor shows timezone, computed duration, and warns on midnight wrap.

## 1.0.0

- Initial release.
- Availability / performance / quality OEE calculation with trend history.
