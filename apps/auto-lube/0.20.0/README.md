# Auto Lubrication System (`auto-lube`)

Fleet management for **NCD Wireless Automatic Luber** nodes on the Atrium
Gateway: sensor type **105** (device type `0x0069`, one ultrasound channel and
one dispenser) running **firmware 3 or later**.

## The one thing to understand first

**The node lubricates itself.** Every report interval it measures its
ultrasound sensor (RMS, peak and peak-to-peak, in µV and dBµV) and decides for
itself whether to run the perma STAR CONTROL dispenser:

```
RMS level > base_line + delta                    -> a candidate for lubrication (Auto mode)
   ... and the kurtosis check passes             (baseline_kurtosis + kurtosis_margin)
   -> run one dose (lube_on_time seconds)
max_consecutive_auto_lube doses in a row without -> machine treated as faulty,
   the level coming down                            dosing stops
lubrication_mode = manual / time                 -> never dose on its own / dose on a schedule
```

The gateway is **not** in that loop. The app configures the nodes, judges each
report against their settings, records what they did, and predicts what needs
attention. The only dose it ever sends is a manual lube an operator requests.

**Firmware 1–2 is a different protocol** (4–20 mA loop, dB = mA / 0.2,
friction/faulty thresholds, a lubrication state in every report). This version
of the app does not decode it. Such a node shows as "firmware N is not
supported" rather than as offline.

## What firmware 3 reports, and what the app derives

| Frame | `msg_type` | Fields the app uses |
|---|---|---|
| Report (`0x01`) | `sensor_data` | `rms_ultrasound_dBuV`, `ultrasound_peak_dBuV`, `ultrasound_peak_to_peak_dBuV`, `rms_uV`, `peak_uV`, `peak_to_peak_uV`, `crest_factor`, `kurtosis` (0 = not computed, ignored), `temperature`, `frequency_1..3_Hz`, `lube_cycles` (meaning unconfirmed; stored only) |
| Lube report (`0x02`) | `lube_status` | `lube_cycles_this_burst`, `lube_total_cycles` (u32), `dispenser_status` (`healthy` / `unhealthy`) |

The field names are the platform decoder's (`node-red-enterprise-sensors`
`105.js`, firmware > 2). In `atrium.readings` they appear lowercased
(`rms_ultrasound_dbuv`, `temperature`, …).

Firmware 3 reports **no lubrication state**, so the app derives one per report
(`L.classifyReading`):

| State | Meaning |
|---|---|
| `normal` | RMS level at or below baseline + threshold |
| `elevated` | Above it, so the node should be lubricating. This is the healthy working case |
| `not_responding` | Still above it after `max_consecutive_auto_lube` automatic lubes in a row. The firmware treats the machine as faulty |
| `damage_suspected` | Above it **and** kurtosis above `baseline_kurtosis + kurtosis_margin`: an impulsive rise (impacts, spalling), so damage, not starvation. The node doesn't dose |
| `manual_mode` | Lubrication mode is Manual: the node never doses on its own |
| `scheduled` | Lubrication mode is Time: the node doses on a schedule, not on the level |
| `unknown` | No baseline reported, so there is nothing to compare against |

This is an **approximation**. The node also applies a kurtosis check that the
report doesn't carry, and every surface that shows the state says so. A setting
the node hasn't reported falls back to the spec's default and is flagged as
assumed (`L.effectiveSettings`). The baseline is the one exception: it never
gets a default, because it's specific to each machine.

The dose counter and dispenser state come **only from the lube report**, which
the node sends after every lubrication, automatic or manual. A counter the node
never started arrives as `-1` (`FF FF FF FF` through the decoder's signed
arithmetic). The app stores it as "not set" (`dispensers.counter_unset`, see
`L.doseCounter`), never as a count, and offers the counter reset.

## What the app is for

| Job | Why the node can't do it | Mechanism |
|-----|--------------------------|-----------|
| **Lubrication settings** | A trigger level (baseline + threshold) above 255 dBµV means the node silently *never lubricates* | `ctx.services.sensorConfig.setDesired()`, validated first |
| **Level judgement** | The node no longer reports its decision | Derived per report against its own settings, logged on change in `state_transitions` |
| **Cartridge life prediction** | The node counts doses but has no idea what cartridge is fitted or the cm³/dose set on the dispenser | `cartridges` table + the manufacturer's dose tables |
| **Outcome history** | Lube reports are discrete events, not a time series | `lube_events` |
| **Alerting** | The node reports, but sends nothing anywhere | `ctx.services.mailer`, throttled via `alert_state` |
| **Commissioning support** | The baseline should come from this machine in known-good condition | Mean RMS dBµV over a window, suggested as `base_line` |

Capabilities: `data:read`, `telemetry:subscribe`, `sensor:config`, `digimesh:transmit`,
`notify:email`, `events:publish`, `mcp:tools`. Free app, both gateway models.
**`minPlatformVersion` is `2.4.0`** because of `events:publish`.

### Settings

The app uses the platform decoder's own key names (sensor library of 2026-10-07 or later):
`base_line`, `delta`, `max_consecutive_auto_lube`, `lube_on_time`, `baseline_kurtosis`,
`kurtosis_margin`, `lubrication_mode` (**0 = manual, 1 = auto, 2 = time**),
`auto_lube_deadband` (in **mg**), `fly_timeout` (1–10 s) and `report_rate`.

Only in **Auto** mode does the node decide on the ultrasound level, so only then does the
app judge the level against the trigger. A node in Manual mode shows as `manual_mode`, one
in Time mode as `scheduled`, and doses from Time mode are tagged `scheduled` in
`lube_events` (they don't count towards the consecutive-lube limit). A reported value
outside its valid range is stored as unknown (`L.sanitizeReported`). Known library issues,
including temperature currently decoded from one byte, are in
`../auto-lube-dev/DECODER-REQUEST.md`.

## What it publishes to the inter-app bus

Two level-triggered events, so an operator can wire lubrication state to
anything else on the Automations page without this app knowing what that is:

| Topic | Keyed by | Fires on |
|-------|----------|----------|
| `node.health` | `device_id` | Every report, after every lube, and each background sweep |
| `cartridge.level` | `device_id:dispenser` | Same, once a cartridge is registered and the node has reported its dose counter (lube reports only) |

Both carry **current state**, not "something happened", and are republished on
every evaluation, so a dropped message self-heals and a service restart
reconciles from retained state. The enum fields (`status`, `lubrication_state`,
`dispenser_status`, `reading_fault`, `level`) are always present, with explicit
`unknown` / `none` values rather than being omitted. That gives the operator a
dropdown in the condition builder instead of a free-text box. `node.health`
carries the RMS level as `dbuv` and the temperature as `temperature_c`.

`status` and `level` are **exclusive bands**, so each has monotone companions
(`enum:true,false`, published as strings) that stay `"true"` as things get
worse. Bind automations to these rather than to `status is attention`, which
stops matching, and fires the binding's exit edge, the moment a node escalates
to fault:

| Event | Field | `"true"` when |
|---|---|---|
| `node.health` | `attention_or_worse` | status is attention, fault or offline |
| `node.health` | `fault_or_worse` | status is fault or offline |
| `cartridge.level` | `warn_breached` | level is warn or critical |
| `cartridge.level` | `critical_breached` | level is critical |

Offline ranks above fault because that's `deriveStatus`'s worst-wins order. A
faulty node that goes silent reports as offline, so a fault flag that ignored
offline would clear at exactly that moment.

Removing a node publishes a final `disabled` `node.health` and, if a cartridge
level was ever published for it, a final `cartridge.level` of `unknown` with
both ladders `"false"`. That way no binding can stay latched on a node that no
longer exists.

The app exposes **no bus actions**.

## What an AI assistant can read (MCP)

The app declares `mcp:tools` and five `provides.reads`. An assistant connected to
the gateway over MCP (with a token that has the **`apps:data`** scope) can then
answer lubrication questions from this app's own view: the node's baseline and
trigger, the operator's cartridge records and alert rules. See
`docs/15-ai-agent-access.md`.

| Read (tool `auto-lube__<id>`) | Route | Answers |
|---|---|---|
| `fleet_status` | `GET /reads/fleet` | Every managed node's status, lubrication state, RMS level against its trigger, temperature and cartridge level; the source of `device_id`s |
| `node_setup` | `GET /reads/nodes/:device_id/setup` | Commissioning baseline, IMPULSE confirmation, the firmware-3 settings (with the unreported ones listed), pending pushes, fitted cartridge, platform metric keys |
| `node_activity` | `GET /reads/nodes/:device_id/activity?days=7` | Per-UTC-day dBµV mean/min/max, highest temperature, doses delivered, plus state changes |
| `cartridge_forecast` | `GET /reads/nodes/:device_id/cartridge` | Lubricant remaining, run-out projection (same computation as the chart), service history |
| `open_alerts` | `GET /reads/alerts` | Open alert conditions, critical first, and whether email actually went out |

These are purpose-built routes, not the ones the UI calls. They're small, omit
nulls, use ISO timestamps and resolve names. The reads only become reachable on a
2.6.0+ gateway; check with `GET /api/apps/reads`.

Numeric telemetry stays in `atrium.readings` and is read live by JOIN. It is never
copied into app tables.

## Alert conditions

| Kind | Meaning | Operator action |
|---|---|---|
| `damage_suspected` | Level above the trigger with high kurtosis (impulsive) | Inspect the machine; more grease won't help |
| `not_responding` | Level still above the trigger after the allowed consecutive automatic lubes | Inspect the machine, then the dispenser and cartridge |
| `dispenser_error` | Dispenser status lines not healthy at the last lube | Check the cartridge (firmware 3 doesn't separate "empty"), then wiring and power |
| `no_signal` | Sensor reported 0 µV RMS | Check the sensor connection and mounting |
| `offline` | No report within `stale_interval_factor` × `report_rate` | Check node power and radio |
| `cartridge_low` | Doses used past the warn/critical % of rated doses | Schedule a cartridge change |
| `dose_rate` | More doses in a rolling 24 h than the node's budget (per-node `max_doses_per_day`, else the app default `dose_rate_max_per_day`); manual doses count | Possible over-greasing: check the dose responses, the baseline and the machine |

## Over-greasing: dose response and dose budget

Too much grease churns and heats a bearing, and that pushes the ultrasound level
**up**, the same direction as starvation. Two things in the app help tell them
apart.

- **Dose response** (`L.doseResponse`, shown per dose in the history and in the
  `node_activity` read). It compares the mean of the last 3 RMS readings before a
  dose with the first 3 at least 20 minutes after it:
  - `fell`: the dose helped.
  - `rose`: over-greasing signature, flagged more strongly when the temperature
    rose too.
  - `no_change`: under 2 dBµV either way.
  - `pending`: still within the 20 minutes.
  - `no_data`: not enough readings around the dose.
- **Dose budget**: doses in a rolling 24 h against a per-node or app-wide budget,
  raising `dose_rate`. The node's own consecutive-lube limit resets; this doesn't,
  so it catches reasonable-looking doses that add up to too much.

## Things the hardware docs warn about, encoded here

- **IMPULSE mode is invisible over the radio.** The dispenser gives one dose per
  power-on rising edge. In TIME mode it runs its own schedule while everything
  still looks healthy. `luber_nodes.impulse_mode_confirmed` is something the
  operator attests to; the app can't verify it and doesn't pretend to.
- **Dose size is set on the dispenser, not over the radio.** `lube_on_time` is
  how long the dispenser is powered per dose, *not* how much it delivers.
- **Config delivery isn't immediate.** Settings reach the node in the short
  listening window after a report. `config_pushes` tracks desired against
  reported, so the UI shows "pending" honestly.
- **The commands were renumbered in firmware 3.** Manual lube is `0x66` (cycles
  only, no dispenser index). `0x5E`, which used to reset the attempt counter,
  now **sets the kurtosis margin**. There's no attempt-counter reset at all, and
  the app refuses to transmit any stored `reset_attempts` row.
- **The decoder's dispenser and battery values have known issues.** See
  `DECODER-REQUEST.md`: any non-zero pin byte currently decodes as healthy, and
  battery reads about 63 V.

## Manual control

Manual lube and the dose-counter reset (`F4 5B <node_id> 00 69`) are
**one-shot commands, not settings**. The reset is confirmed by the node's next
lube report, and on a node with a real count it has to be acknowledged first,
because it erases the lifetime count.

Manual lube is a **one-shot command, not a setting**, so it can't go through
`sensorConfig.setDesired()`. It goes out as the raw frame
`F4 66 <node_id> 00 69 <cycles>` through `digimesh:transmit` (platform 2.3.5+,
with the node registered as a DigiMesh peer), or through a future
`sensor:command` service (`../auto-lube-dev/PLATFORM-REQUEST.md`). Both are
feature-detected. Without either, the route returns `501` and the UI explains
why.

Guards around manual lube, because every cycle is real grease:

- cycle count capped (`manual_lube_max_cycles`, default 20), with the burst
  duration (`cycles × on_time + (cycles−1) × 2 s`) shown before confirming
- explicit confirmation, and `ctx.audit` with the operator's username
- cooldown between requests (`manual_lube_cooldown_sec`, default 15 min)
- only one request outstanding at a time
- a queued command the node never collects expires instead of firing hours
  later

A delivered command only proves the radio accepted the frame. The **lube
report** that follows is what proves grease moved, so that's what resolves the
command and tags the dose `manual` in the history. A delivered request with no
lube report within 10 minutes is closed as "most likely did not run" and doesn't
count towards the cooldown.

**Cartridge changes need no command.** The app anchors to the counter reading at
install and works out doses used by subtraction, which preserves the node's
lifetime service history.

### Scheduled (interval) dosing

A time-interval dosing option that is **not** a node firmware mode. The node's
own `lubrication_mode` Time setting defers to the perma STAR CONTROL's internal
schedule, which the app cannot set over the radio. This instead has the **gateway**
issue the ordinary manual lube automatically every *N* days the operator sets
(the UI collects whole days, 1–365, and stores them as hours in
`luber_nodes.auto_lube_interval_hours`; `auto_lube_cycles` is doses per burst —
both app-DB only; nothing is written to the node). It reuses the manual-lube
queue, so a scheduled dose is delivered in the node's next Fly window exactly like
a hand-issued one and resolves on the lube report.

It is meant to run with the node in **Manual** mode, so the schedule is the only
thing dosing. The interval counts from when the operator turned the schedule on
(`auto_lube_anchor_ts`, set by the API), and from each scheduled dose after that
(the `scheduleAutoLubes` sweep advances the anchor to "now" each time it fires) —
NOT from the node's last manual lube. So "every 1 day" fires one day after it is
enabled, then daily, rather than immediately because an old dose is past due. It
holds the "one outstanding command" rule, skips a dispenser the last report
flagged unhealthy, and needs the same transmit path as manual lube (it is
silently inactive without one). Set it in *Manual control*; migrations 016–017.

## Layout

```
auto-lube/
├── app.json                 # manifest
├── backend/api/index.js     # /api/apps/auto-lube/*        (reads + app-DB writes)
├── backend/ingest/index.js  # frame hook, alerting, and /api/apps/auto-lube/ingest/*
├── backend/lib/luber.js     # shared pure logic (both processes require it)
├── migrations/              # 001-init … 007-firmware-3
└── frontend-src/            # CRA source (not shipped; builds to ../frontend)
```

**Why the split.** `ctx.services` is injected only into the ingest daemon, so
email, node configuration and the radio are unreachable from the API side.
Configuration and commands are therefore **daemon routes** under
`/api/apps/auto-lube/ingest/…`; everything else is a normal API route.
`backend/lib/luber.js` is a plain relative `require`, not an npm dependency.

Reference material is in `../auto-lube-dev/reference/`. The firmware-3 spec is
in `firmware-3/` (README and command frames, plus the type-105 decoder as
installed on the test gateway). The older files describe firmware 1–2.

Package with `scripts/package-app.sh auto-lube`.
