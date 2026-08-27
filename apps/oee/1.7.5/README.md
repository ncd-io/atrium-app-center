# OEE

Standalone Overall Equipment Effectiveness tracking. Define your machines and
shifts, then drive **Availability**, **Performance**, and **Quality** from
sensors or manual entry — no other app required.

## What it does

- Organize your plant into **machines**, group them into **views** (lines,
  cells, areas), and see a live OEE score for each machine, view, and the whole
  plant.
- Each machine has three independently configurable slots — **Availability**,
  **Performance**, and **Quality** — and each slot can be driven by a **sensor**
  (run-state signal, uptime counter, or parts counter) or by **manual entry**.
- Define shifts with start/end times, weekdays, and a scheduled length; OEE is
  measured against elapsed production time so far in the shift.
- **Downtime reason codes** with auto-detected stops: the app surfaces stops it
  measured from the Availability sensor and lets an operator assign a reason to
  each, then charts the top loss reasons as a **Pareto**.
- **Reject reason codes**: assign reasons to sensor-counted rejects (the sensor
  count stays authoritative) or log rejects by hand, with an "unclassified"
  bucket and a reject Pareto.
- Per-machine **OEE target** drives consistent green/amber/red coloring across
  every score in the app.
- Set the machine's **ideal rate** in parts/min (stored as an ideal cycle time);
  Performance is measured against it.

## Requirements

- Atrium platform **2.3.0** or newer.
- Runs on both **EG5120** and **EG5100**.
- No other app required. OEE manages its own machine and shift configuration and
  reads sensor telemetry directly.

## Configuration

- **Machines** — add a machine, give it an ideal rate (parts/min) and an OEE
  target, and assign it to a view. Configure each of the three OEE slots for a
  sensor metric or manual entry. State-based Availability inputs support an
  **active-low** preset for common pull-up wiring.
- **Shifts** — set start/end times and active weekdays. The editor shows the
  configured timezone, the computed shift duration, and warns on a shift that
  wraps past midnight.
- **In-app help** — a **? Help** button explains OEE in plain language, and each
  slot offers wiring guidance for what to connect.

## Permissions

- `data:read` — reads telemetry from the platform database (read-only).
