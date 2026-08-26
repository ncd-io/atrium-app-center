# ProXR Control

Build custom control panels for NCD **ProXR** relay controllers reached over the
gateway's DigiMesh radio.

## What it does

An operator registers each ProXR board once (name, 64-bit DigiMesh address,
relay count, analog input options), then assembles control panels from cards:
command buttons, relay indicators, relay grids, analog input readouts and trend
charts, and controller status. Cards can drive any command in the ProXR set —
individual relays, whole banks, relay groups, patterns, on-board timers and
flashers — and the app polls each board so the panels show the controller's
actual reported state rather than what was last commanded.

Panels are laid out on a grid. A card is dragged to any cell, including an empty
one on a row below, or nudged and resized a cell at a time with the arrows on the
card; gaps are kept exactly where the operator leaves them rather than being
closed up. The server validates every layout it is sent, so cards cannot overlap
or hang off the panel.

Beyond the panels it ships:

- **Controller detail** — per-relay toggles with friendly names, bank actions,
  timed "on for N seconds" commands (the controller switches the relay back off
  by itself, so a lost gateway can't leave a load energized), analog input
  scaling into engineering units, and the board's own feature map read from its
  device identification bytes.
- **Sequences** — ordered command lists with delays between steps (startup,
  shutdown, test runs), runnable from a panel button.
- **Schedules** — a command or a sequence at a time of day. Day of week, hour,
  minute and second are each optional: an unset field that is coarser than the
  finest one set means "every", so a schedule with only the minute set runs once
  an hour, and one with only the hour set runs once a day. Finer unset fields are
  zero, so "hour = 6" is 06:00:00 rather than 3 600 firings. The page shows the
  rule in plain English and the next three firings before anything is saved, and
  "Run now" proves a schedule without waiting for its time. Times are evaluated
  in the gateway's `display_timezone`, so a schedule set for 06:00 stays at 06:00
  across daylight-saving changes.
- **Command console** — pick any command, see the exact API frame that will be
  transmitted, send it, and read the raw reply decoded.
- **Activity** — every operator-initiated command with the bytes exchanged, who
  sent it and whether the controller answered.
- **Automations** — controller state is published on the gateway's inter-app bus,
  and four commands are exposed for an operator to trigger from anything else the
  gateway publishes. See [Inter-app bus](#inter-app-bus) below.

It consumes **no sensor telemetry**: ProXR boards are not sensors, so nothing in
`atrium.readings` is involved. The only platform hardware surface it uses is the
DigiMesh peer the operator authorized for each board.

## Data model

All in the app's own database (`/overlay/apps/proxr-control/app.db`).

| Table | Contents | Growth |
|---|---|---|
| `app_config` | Key/value app settings (retention windows, install timestamp). | Fixed. |
| `controllers` | One row per ProXR board: name, DigiMesh address (unique), relay count, analog input settings, poll and sample intervals, enabled flag, cached device identification. | One row per board. |
| `relay_labels` | Friendly name per relay, so cards inherit it. | ≤ relay count per board. |
| `adc_inputs` | Label, unit, scale, offset, decimals and display range per analog input. | ≤ 8 per board. |
| `dashboards` | User-built control panels. | A handful. |
| `widgets` | One row per card: kind, title, controller override, action, parameters and options as JSON, and its grid cell and size (`grid_x`, `grid_y`, `grid_w`, `grid_h`). `span`/`sort_order` are kept in step so a panel built before the grid still reads correctly. | Tens per panel. |
| `scenes` | Named command sequences (steps stored as JSON). | A handful. |
| `schedules` | Name, target (command + parameters, or a sequence), the optional day/hour/minute/second fields, enabled flag, and the outcome of the last run. | A handful. |
| `controller_state` | Last known relay banks, analog values, online flag and last error per controller. Written by the daemon **on change only**; this is how the API service (a separate process) sees live state. | One row per board. |
| `adc_samples` | Sampled analog inputs for trend charts, one row per channel per sample. | See retention below. |
| `command_log` | Operator-initiated commands: frame sent, frame received, outcome, duration, username. Polling traffic is deliberately **not** logged. | See retention below. |

**Retention.** `adc_samples` and `command_log` are the only tables that grow
continuously, and both are pruned by a background worker in the daemon every 30
minutes using chunked deletes (5 000 rows per statement, capped per pass) so the
write lock is never held long. Windows are configurable in the app's Settings
page (`app_config.adc_retention_hours`, default 7 days;
`app_config.log_retention_hours`, default 14 days). Worst case at the defaults —
one board, 8 inputs, the fastest allowed 10 s sample interval — is roughly
480 k rows, a few tens of MB. At the default 60 s interval it is ~80 k rows.

Sampling is throttled independently of polling (`adc_log_interval_ms`, minimum
10 s), so a 2 s poll interval for responsive panels does not multiply stored
rows.

## Platform touchpoints (matches `capabilities`)

- `data:read` — reads `atrium.gateway_config` (gateway model) and
  `atrium.digimesh_peers` (to show whether a controller's radio is registered
  and enabled). Nothing in `atrium.*` is ever written.
- `digimesh:transmit` — `ctx.services.digimesh.transmit(address, bytes)` to send
  ProXR frames. Every call is audited by the platform.
- `digimesh:subscribe` — `ctx.services.digimesh.subscribe(address, handler)` to
  receive each board's replies. One subscription per enabled controller.
- `events:publish` — `ctx.bus.publish` on the ingest side to announce controller,
  relay and analog state; `ctx.bus.retained` on the API side to read it back for
  the Settings page.
- `actions:provide` — the four handlers exported from `backend/ingest/index.js`,
  so an operator can put a ProXR command on the "Then" side of a binding.

`ctx.audit` is used for console commands, sequence runs, every schedule firing and
every command an automation triggers — unattended commands are exactly what an
audit trail is for. No `telemetry:subscribe`, no email, no external network
access, and **no `events:subscribe`**: this app does not watch the bus, because
bindings need no code in it and keep the operator in control.

`minPlatformVersion` is **2.4.0**, the release that added the bus. Without the
floor an older gateway would install the app happily and then leave `ctx.bus`
undefined — a runtime failure instead of an install-time one. The DigiMesh
capabilities need 2.3.5, so 2.4.0 covers both.

### Process split

Everything that touches the radio lives in `backend/ingest` — the daemon owns
the radio, and ProXR boards are speak-when-spoken-to, so each controller has a
serialized command queue with exactly one exchange in flight. The API plugin
(`backend/api`) owns configuration, cards, sequences and history and never
transmits. The frontend calls `/api/apps/proxr-control/*` for configuration and
`/api/apps/proxr-control/ingest/*` for anything on the wire.

Schedules are evaluated in the daemon, once a second, because that is the process
that can transmit. Every second between the previous tick and now is checked, so
a busy event loop cannot silently drop a firing, and a schedule that already ran
in a given second will not run again — the guard is the persisted timestamp, so it
survives a restart inside that same second. A tick more than a minute behind
(service restart) is not replayed.

Polling costs one exchange for relays plus one for analog inputs. Boards with
more than 8 relays use the single 32-bank read; if that command goes unanswered
three times (some firmware revisions don't implement it) the daemon falls back
permanently to one read per populated bank and logs the switch.

`backend/lib/proxr.js` is the single source of truth for the protocol: frame
building, checksums, the action catalog with its parameter ranges, the
incremental frame parser, and response decoding. The frontend renders its
command and card forms from catalogs served out of that file
(`GET /actions`, `GET /widget-kinds`), so the two sides cannot drift.

## Inter-app bus

The app has no idea what is on the other end of a binding, and contains no other
app's id: it publishes its state, it exposes commands, and the **operator** wires
the two on the gateway's Automations page. That click is the authorization —
this app holds `digimesh:transmit`, and letting another app ask it to fire a
relay would hand that app radio authority it never declared.

### Published state (`provides.events`)

Level-triggered current state, keyed per thing, republished on every evaluation.
Publishing the same value twice dispatches nothing; the opposite value dispatches
the exit edge, so a binding self-heals after a dropped message or a restart
instead of latching on.

| Topic | Keyed per | Published when |
|---|---|---|
| `controller.status` | controller | Every poll; also the moment a board's radio turns out not to be authorized, which is the only state an un-subscribable board ever has. |
| `relay.state` | controller + relay number | Every poll. A relay that has never been read is **not** published — an automation must not act on a value the app invented. |
| `analog.input` | controller + input channel | On the board's `adc_log_interval_ms`, scaled and labelled exactly as the panel cards show it, so a threshold means what it means on screen. |

Every payload declares its fields, with `enum:` where the values are fixed, since
that is what populates the operator's condition builder. `controller.status`
carries both `status` (`online`/`offline`) and `online` (bool) deliberately: the
enum gives a dropdown, the bool reads better interpolated into an email.

**What is deliberately not published:** the radio round-trip time. It is on the
controller page and in `/ingest/state`, but it is a gauge, not state — it changes
on nearly every poll, so a level-triggered event carrying it announces a "change"
every few seconds forever. On a test gateway it was 56% of everything this app put
on the bus. The general rule for anything added here: if a field moves on its own
without the thing it describes having changed, it does not belong in the payload.

**Rate limit.** The platform allows 120 publishes per minute per topic, and a
32-relay board polled every 5 s would want 384 on `relay.state` alone.
`backend/lib/bus.js` handles this: a key publishes the instant its state changes,
every key is re-asserted on a sweep whose cadence is derived from the number of
keys (60 re-assertions a minute, so a bigger installation heartbeats more slowly),
and a per-topic budget below the platform's limit spends on changes before
re-assertions. A refused or throttled publish is retried on the next evaluation
rather than swallowed.

Re-assertion is a **safety net, not a heartbeat** — it exists to repair a dropped
message or a restarted broker. The floor is 5 minutes, because on a small install
the floor is the rate, and a sweep re-asserting two keys every 30 s is most of
what ends up in the event log. A key a poll published within half its topic's own
interval is skipped, so the sweep and a poll cannot publish the same key twice in
a tick.

### Exposed commands (`provides.actions`)

Ingest-side only, because every one of them touches the radio. All absolute and
idempotent — `relay.set` with a state, never `relay.toggle`, because a binding is
re-asserted after a gateway restart and a relative command would invert the load.

| Action | Parameters |
|---|---|
| `relay.set` | controller, relay, `on`/`off`, and an optional auto-off in seconds. The auto-off is handed to the controller's own duration timer, so the load is released even if this gateway stops answering; the timer index is derived from the relay number, so re-asserting the same relay reuses it instead of leaving two timers racing. |
| `bank.set` | controller, bank (0 = every bank), `on`/`off`. |
| `flasher.set` | controller, flasher 1-16, `on`/`off`. |
| `sequence.run` | a sequence built on the Sequences page. |

Parameters come from a human filling in a form, so every handler validates them
and throws a message the operator can act on (`controller 4 is not configured on
this gateway`, not `Cannot read properties of undefined`). The controller and
sequence fields are dropdowns rather than boxes to type an id into, fed by
`GET /bus/options/controllers` and `GET /bus/options/sequences` — the paths named
by `options_from` in the manifest.

Commands triggered this way are written to the command log with source
`automation`, or `automation_test` when the operator pressed **Run now**, so the
Activity page does not make a test look like a real firing. Each one is also
audited with the binding's name.

`GET /bus` (API side) returns the declared catalog plus the retained state the
daemon last published, which is what the Settings page's Automations panel shows;
`GET /ingest/bus` returns the publisher's counters, which only the daemon has.

## Configuration

The customer must do two things before the app can talk to a board:

1. **Register the radio** under **Settings → Devices → DigiMesh Peers** on the
   gateway, using the radio module's 64-bit MAC. Apps cannot register their own
   peers — that registration *is* the authorization model. Until it exists, the
   controller shows "not authorized" with the address to add, and the daemon
   retries the subscription every 15 s so it starts working without a restart.
2. **Set the radio to transparent mode (`AP=0`)** and point its destination
   (`DH`/`DL`) at this gateway or broadcast. In API mode the ProXR board receives
   framed bytes it cannot parse and never answers, while `transmit` still reports
   delivery — the radio did receive it.

Then add the controller in the app (name, address, relay count) and press "Read
now". Wiring notes are repeated in the app's Settings page so the operator does
not need this file.

Nothing else is required: no SMTP, no API keys, no sensor assignment.

## Safety notes surfaced in the UI

- Relay state is the controller's **memory** state, which is what ProXR reports.
  A damaged relay, an unpowered expansion board or severe EMI can make the
  physical relay disagree with it.
- Expansion boards must be powered simultaneously with the main controller,
  never after it.
- Buttons that switch real loads can be marked "ask for confirmation", and
  momentary buttons send the inverse command on release. For anything where a
  lost link must not leave a load on, use a timed command instead — the
  controller enforces the timeout itself.

## Testing done

- **Off-gateway unit checks:** `node tools/proxr-selftest.js` in the parent
  development repo checks every command frame this app can build against the
  byte-for-byte tables in the NCD ProXR quick start guide (183 checks: frames,
  checksums, response decoding including the device identification worked
  example, radio-fragmented frame reassembly and resync, relay/bank numbering,
  address normalization, card validation, panel geometry including deliberate
  gaps and refused overlaps, and schedule matching — partial fields, day sets,
  predicted firings, and both daylight-saving transitions). It also documents the
  three places where the guide's printed values are internally inconsistent (the
  "Activate All Timers" mask, the timer query length byte, and the
  write-scratchpad checksums) — in each case the frame this app sends is the one
  the guide's own arithmetic supports. The bus checks additionally assert that the
  manifest and the code describe the same events and actions in both directions —
  no undeclared payload field, no handler without a declaration, no relative
  action, and no `options_from` pointing at a path the API does not serve.
- **Off-gateway integration:** `node tools/proxr-integration.js` runs the real
  API plugin and daemon against a real SQLite database (migrations applied in
  order) and a simulated radio that answers ProXR frames, covering controller and
  panel creation, layout persistence and the backfill of pre-grid panels,
  rejection of illegal layouts, subscription and polling, a schedule firing on
  its second exactly once, run-now, and a schedule on an unauthorized radio
  recording the failure. The bus half runs against a broker that validates every
  publish against `app.json` and rate limits per topic the way the platform does:
  state published under stable per-thing keys, an unchanged relay not republished,
  each action driving the simulated board, each rejecting bad operator input with
  an actionable message, and the API service reading the daemon's retained state
  back. `node tools/proxr-dev-server.js` serves the same stack on
  `localhost:3001` for `npm start` against a simulated board, and stands in for
  the platform's `/api/bus/catalog` and `/api/bus/events` plus a
  `POST /api/bus/run/<action>` that does what a binding's **Run now** does.
- **Frontend:** production CRA build clean (no warnings), `MemoryRouter` seeded
  from `window.location`, scoped-token handshake from the template unchanged, all
  polling at the platform's 5 s convention or slower and cleaned up on unmount.
  Absolute times render in the gateway's `display_timezone` and "x minutes ago"
  is measured against the gateway's clock (`/api/system/time`), so a skewed
  browser clock doesn't make a live board look stale.
- **Gateway model(s):** _pending — needs a 2.4.0+ gateway with a registered ProXR
  peer._
- **Platform version:** _pending._
- **Checklist (`docs/11-checklist.md`):** manifest, backend, database, frontend and
  inter-app bus sections verified by inspection and by the two suites above. The
  "On-gateway verification" section is outstanding and needs hardware, and with it
  the two bus items that can only be proved on a gateway: that `GET /api/bus/catalog`
  lists all three events and all four actions with `invocable` true, and that
  publishing a matching state twice dispatches a binding only once.

## Commercial intent

To be decided with NCD. The app is complete and self-contained either way.

## Changelog

- 0.2.1 — stop `controller.status` publishing on a timer. The payload carried the
  radio round-trip time, which changes on nearly every poll, so an idle board
  announced a state change every 5 s; on a test gateway 477 events in 52 minutes
  carried 4 real changes. The round-trip time is no longer published (it stays on
  the controller page), and the re-assertion floor moves from 30 s to 5 minutes.
- 0.2.0 — inter-app bus: controller, relay and analog state published as
  level-triggered events, and `relay.set`, `bank.set`, `flasher.set` and
  `sequence.run` exposed for an operator to wire to anything else the gateway
  publishes. Raises `minPlatformVersion` to 2.4.0.
- 0.1.0 — initial release: controllers, control panel builder with 9 card types on
  a free-form grid, the full ProXR command catalog, sequences, schedules, command
  console, activity log, analog input scaling and trends, configurable retention.
