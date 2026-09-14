# Site Survey

Commission a gateway on-site: every sensor's mesh link and the RF noise it
competes with, in one colour-coded list.

## What it does

- Replaces the per-sensor **Sensor Dashboard → View Map → Refresh Mesh Map**
  loop with a **single list** of every whitelisted sensor's mesh connectivity,
  colour-coded green / yellow / red against thresholds you set. When the whole
  list is green, the installation is done; red rows tell you which sensors need
  an antenna reoriented, a relocation, or a repeater.
- A **summary strip** — Good / Marginal / Poor / Untested counts plus a
  plain-language verdict. Click a count to filter the list to it.
- A **Status** column showing where each sensor's test actually is: Not tested,
  Waiting for check-in, Tracing route, Link testing, Complete, Partial, or
  Failed. A mesh test on a battery-powered sensor is slow and multi-stage, so a
  queued test is never shown as one that is on the air — a sensor that is asleep
  can be an hour from its next check-in, and the row says so instead of
  pretending to be busy.
- Expanding a row shows a **card per link leg** plus the route, with the
  measurements behind the colour: signal strength on the weakest leg, success
  rate, retries, and battery.
- **RF Environment** — scan the noise floor the installation is competing with,
  so a *weak link* and a *noisy site* can be told apart. They look identical in
  a signal-strength reading and have completely different fixes.

## Why the noise scan matters

A signal strength on its own does not say whether a link will work. A −80 dBm
link against a −105 dBm noise floor has 25 dB of margin and is healthy; the same
−80 dBm against a −85 dBm floor drops packets however the antenna is turned.

**Scan Noise Floor** sweeps the gateway's own DigiMesh radio and reports the
noise floor (the **median** channel, since the mesh hops across the band and a
link competes with the typical channel), the loudest channel with its frequency,
how many channels are busy, and a channel-by-channel chart. Each sensor also
gets a **margin over noise** figure in its expanded row.

**The radio cannot hear sensors while a scan runs.** A scan is therefore always
started by you — never scheduled, never offered as an automation action — and
the gateway refuses one while a link test is on the air.

## Requirements

- Atrium platform **2.6.0** or newer (mesh route tracing and link testing for
  apps was added in 2.6.0).
- One or more sensors whitelisted on the gateway.
- **RF Environment** additionally needs a platform that provides the radio
  noise-scan service. Where the gateway does not offer it, the panel is hidden
  and the rest of the app is unaffected.

Free app. Best on a tablet or laptop browser (roughly 900 px wide and up) —
which is what you have in hand while walking a site.

## Configuration

Nothing is required to start: open the app and run a survey.

The gear icon opens **Survey Settings**, which holds the link-test parameters
(how many packets each test sends, and how large) and the threshold pairs that
decide green / yellow / red for signal strength, success rate, retries, battery,
and the noise-floor readings. Defaults are set for a typical NCD install; raise
or lower them to match what the site needs.

## Permissions

- `data:read` — reads the platform's mesh routes, link measurements and device
  records (read-only).
- `radio:mesh` — runs a route trace and link test against a whitelisted sensor.
  Rate-limited and audited by the platform.
- `radio:scan` — measures the RF noise floor on the gateway's own radio, when
  the platform provides it.

Site Survey writes only its own settings. It never changes sensor
configuration, and never writes to platform data.
