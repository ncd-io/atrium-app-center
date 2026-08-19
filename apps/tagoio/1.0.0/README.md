# TagoIO

Connect the gateway to TagoIO: manage TagoIO devices, report sensor telemetry,
and configure sensors from the cloud.

## What it does

- Links the gateway to your **TagoIO profile** with a single token — no
  per-sensor setup in the cloud.
- Every sensor you enable becomes its own **TagoIO device**, created for you and
  kept in sync. Rename or re-pair a sensor and the mapping follows it.
- Streams telemetry to your TagoIO dashboards as readings arrive, so charts stay
  current without polling.
- **Backfills gaps automatically.** If the internet drops, readings are replayed
  afterwards with their original timestamps, so history lands in the right place
  rather than bunching up as "now".
- **Two-way sensor configuration.** Change a report interval, threshold, or mode
  from a TagoIO dashboard and the gateway delivers it over the radio the next
  time that sensor checks in — then reports back what the sensor actually
  accepted.
- **Builds the TagoIO side for you.** One button creates the dashboard, widget,
  analysis, and action needed for cloud configuration, and keeps them current as
  you enable more sensors or upgrade the app.

## Requirements

- Atrium platform **2.3.2** or newer.
- A TagoIO account, and a **profile token** for the profile you want the gateway
  to report into.
- One or more NCD wireless sensors paired with the gateway.

## Getting started

1. **Connection** — paste your TagoIO profile token and pick your region. The
   app verifies the token and shows which profile it belongs to.
2. **Devices** — enable the sensors you want in TagoIO. Each one is created as a
   TagoIO device and begins reporting.
3. **Configuration** *(optional)* — press **Set up in TagoIO** to build the
   cloud-side dashboard for changing sensor settings from TagoIO.
4. **Diagnostics** — confirms what has been delivered and surfaces any errors
   from the TagoIO API.

Several gateways can report into one TagoIO profile: each is namespaced by a
prefix assigned at install, so their device serials never collide.

## Configuration

- **Region** — the TagoIO region your account lives in.
- **Backfill lookback** (default 24 h) — how far back to replay after an outage.
  A longer window recovers more history; a shorter one returns to live sooner.
- **Battery and signal reporting** — optional. Every variable in every push
  consumes one TagoIO data record, so these can be switched off to reduce
  account usage.

## Permissions

- `data:read` — reads telemetry from the platform database (read-only).
- `telemetry:subscribe` — receives live sensor frames to push as they arrive.
- `sensor:config` — applies setting changes to sensors over the radio.
- `net:external` — reaches the TagoIO API and telemetry endpoints.
- `secrets` — stores your TagoIO tokens encrypted at rest.
