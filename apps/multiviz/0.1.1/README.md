# MultiViz

Sends vibration data from NCD wireless sensors to **Viking Analytics
MultiViz**, the self-learning machine-health monitoring platform. Enter the
broker details from MultiViz's **Setup Integration** wizard, link the sensors
you want monitored, and the app publishes their processed data and vibration
waveforms to MultiViz, which builds its asset tree from them.

**Requires Atrium 2.8.0** or later (the app's own MQTT connection to the
MultiViz broker). Status: **0.1.1**, the first App Center release.

## What it does

The app opens its own dedicated MQTT
connection to the broker MultiViz's integration wizard provisions per
customer, and publishes every frame from a linked sensor — processed
(`sensor_data.mode` 0/2/3) and waveform (mode 1, `sensor_data.data.{x,y,z}`) —
exactly as Atrium decoded it (the NCD structure: `nodeId`, `firmware`,
`battery`, `sensor_data`, `sensor_name`, `addr`, `received`, `rssi`, …;
the platform strips `original` before apps see the frame) on
`<topic_root>/<device_id>`. A partial waveform (packets lost: fewer samples,
`fft_confidence` < 100%, and the decoder sets `sensor_data.error` to "Time
Series Data Stream Timeout - incomplete data received") is still published;
its Historical row says how much arrived.

Type 127 (Vibration, Ultrasound and Temperature): the overall frame adds
`ultrasonic_rms_dBuV`, `ultrasonic_peak_to_peak_dBuV` and `crest_factor`
and is published as-is, as is its accelerometer waveform
(`sensor_data.source_type: "accelerometer"`, `data.{x,y,z}`). Its
**ultrasound** waveform (`source_type: "ultrasound"`, `data` a single array
of dBuV samples, `fsr: "120dbuV"`) is not published — MultiViz takes
accelerometer waveforms only — and is noted in Historical as "Ultrasound
waveform — not sent" (it doesn't count as a received waveform either).

Types **80 / 81** (One / Two Channel Vibration Plus — the pre-Gen4 line,
supported for its C1D2 certification): overall frames are published as-is.
Their waveform has no `mode` and arrives as numbered points
(`sensor_data.data = {"1": {x, y, z}, "2": …}`); the app reshapes it to the
Gen4 form (`data: {x: [...], y: [...], z: [...]}`, only the axes `en_axis`
enabled) before publishing and leaves every other key as decoded (no `mode`,
no `total_samples` — the decoder doesn't send them). They don't send
waveforms on their own and take only the Regular request, with their own
bytes: 80 `F4 4F 00 00 54 13`; 81 `F4 4F 00 00 50 13 p` with `p` 01 / 02 /
03 = both (sent with `fft._transmit`, since `sendRequestNow` would send FF).
They can't be configured through Atrium: no Configure button, and linking one
shows a V3-specific popup instead (no auto waveform — use On-request
Waveform Data; configure mode, destination address, payload length, … with
Node-RED; NCD technical support for guidance).

Sensor **error frames** are not published — MultiViz expects data frames
only, for now. `frameError()` in `backend/vibration.js` recognizes NCD's
shapes: `sensor_data = { error, probe }` with no `mode` (a type 111 probe
that failed to sample), or no `sensor_data` at all with top-level
`data = { probe_1_error, probe_2_error }` (type 111, both probes) or
`data = { error }` (older types). Each skipped frame is recorded in the
sensor's Historical popup as "Sensor error — not sent" with the sensor's
message, and no waveform request is sent on it. MultiViz builds its own asset tree
from the published data on its side — there is no site/area/machine/...
mapping in this app, unlike an earlier version of it.

It also sends an on-request waveform data request — Regular, Custom (ODR +
duration in the command) or Smart (waveform only if the motor runs, else
MOFF) — after every processed transmission from a sensor, while the operator
has it saved and enabled. The getting-started hardware settings (smart
threshold/skip count, data transmission interval, auto waveform interval and
destination address) are set from the Sensor Basic Hardware Settings popup;
everything else stays on the sensor's own Sensor Configuration tab.

Waveforms arrive on the same `sensor_data` event as processed frames (the
platform's own FFT module reads them there too), so both go out through one
publisher. A 2-channel (type 111) sensor is linked as one sensor: Atrium
decodes both probes into one processed frame (`s1_`/`x1_`/`y1_`/`z1_`/`rpm_1`
and the same with 2, no `probe` field), published whole; its waveforms carry
`sensor_data.probe`. The On-request Waveform Data popup still picks a probe, because the
request command has a probe byte.

On-request waveform data: a sleeping sensor only listens for ~1-2 s after it
sends processed data, so Save + Enable only record the request; the
`sensor_data` handler sends it on every processed frame (mode 2 Processed +
Raw on demand, or 3 Smart — mode 0 never listens and the UI says so) until
it's disabled. A duplicate frame within 3 s doesn't send twice. Commands
(`backend/vibration.js`, probe byte 01 / 02 / FF = both):
- Regular `F4 4F 00 00 50 13 p` — via the documented `fft.sendRequestNow`
  (one `both` command, not two requests).
- Custom `F4 4F 00 00 00 54 p ODR duration` (ODR 07–0D, duration 1–100 × 50 ms)
- Smart `F4 4F 00 00 65 50 p` (probe 1 or 2 only)
Custom and Smart go through `fft._transmit` — see Known gaps.
Per-probe request/receive times (`waveform_probe_status`) are shown per
probe in the popup; the Overview row's icon combines the probes the request
covers (received = every covered probe's waveform arrived after the latest
request).

## Data model

- `app_config` — key/value app settings.
- `broker_settings` — single row: the MultiViz broker connection (host, port,
  TLS, username, password — encrypted via `ctx.secrets`, topic root, client
  ID, enabled).
- `linked_devices` — one row per sensor that publishes to MultiViz. `probe`
  is always `''` now; an earlier version linked a 2-channel sensor per probe
  (`'1'`/`'2'`), and migration 005 merged those into one row.
- `waveform_settings` — one row per `device_id`: the saved on-request
  request (type/probe/ODR/duration, `saved_at`) and whether it's enabled
  (`request_armed`, kept from the earlier one-shot design; migration 004
  disarmed old rows so an upgrade never starts continuous requests on its own).
- `publish_log` — the last 50 events per device behind the Historical popup:
  `overall` / `waveform` (published; `detail` notes an incomplete
  waveform), `error` (a sensor error frame that was skipped; `detail` holds
  the sensor's message — migration 006) and `ultrasound` (a type 127
  ultrasound waveform that was skipped).
- `waveform_probe_status` — per (`device_id`, `probe`): last request sent,
  last waveform received. Still has unused
  `dest_addr`/`auto_*`/`*_option_key` columns from an earlier version of this
  app that configured destination address and Auto Waveform Data itself
  (removed in favor of linking to the sensor's own settings page) — left in
  place rather than dropped, since `001-init.sql` already shipped.

## Platform touchpoints (matches `capabilities`)

- `data:read` — reads `atrium.devices`, `atrium.sensor_meta`,
  `atrium.gateway_config`.
- `telemetry:subscribe` — `sensor_data`: publish trigger, request trigger,
  and waveform-received tracking.
- `secrets` — encrypts the broker password at rest; decrypted ingest-side to
  open the connection.
- `mqtt:connect` — `ctx.services.mqttConnections`, this app's own broker
  connection (`mqttConnections.open("multiviz", …)`), ingest-side only.
- `sensor:config` — `ctx.services.sensorConfig`: the Sensor Basic Hardware
  Settings popup reads the getting-started settings (smart threshold(s), skip
  count, `sampling_interval` / `auto_raw_interval` /
  `auto_raw_destination_address`, shown as Data Transmission Interval, Auto
  Waveform Transmission Interval and Auto Waveform Destination Address — only keys
  `getOptions()` lists for the sensor) with `get()` (reported/desired +
  `sync_status`) and saves them with `setDesired()` (whitelisted keys,
  range-checked first; delivered at the sensor's next check-in). Also reads
  `atrium.gateway_config.modem_mac` for "Use this Atrium".
- `radio:fft` — `ctx.services.fft.sendRequestNow` (Regular) and
  `fft._transmit` (Custom/Smart, undocumented — see Known gaps); also
  registers a capture claimer for linked sensors.

## Configuration

Set up via the app's own UI:

1. **Overview** — broker connection status with a **Configure** popup
   (broker URL/port/credentials/topic root from MultiViz's Setup Integration
   wizard, Test connection, Connect/Disconnect, Save), linked/not-linked
   counts, and the **Linked Sensors** table (newest link first; a sensor
   just linked from Manage Sensors is highlighted for 5 s, tagged "Newly
   linked"): a Report switch per link that
   pauses MQTT publishing without unlinking (takes effect immediately — the
   UI pokes the ingest daemon's `links/reload` route), last seen / last MQTT
   report, Last Seen on Atrium, Last Report MultiViz, and per-row Configure
   (gear icon: Sensor Basic Hardware Settings popup, with Reset to current
   values; the full settings stay on Atrium's Sensor Configuration tab),
   Historical, Details, On-request Waveform Data (icon shows the request status) and
   Remove (asks for confirmation).
2. **Manage Sensors** — every vibration sensor on the gateway with its
   Linked / Linked · Paused / Not linked state, and the form to link one
   (a 2-channel sensor is linked whole). A new link starts with its Report
   switch OFF, and a popup suggests configuring the sensor first (for a V3
   type 80/81, a popup explaining what's different about it). Linked
   sensors drop out of the picker; removing a link puts them back.
3. **On-request Waveform Data** popup (per sensor, from the Overview) —
   choose Regular/Custom (Regular only for 80/81) and the probe (Smart is
   implemented but hidden in the UI for now, unless a Smart request is already
   saved), Save, then Enable/Disable. It notes that a Gen4 sensor already
   sending waveforms automatically (Auto Waveform Transmission Interval)
   doesn't need it. Destination address and auto waveform transmission are
   set from the Configure popup (Gen4) or Node-RED (80/81).

Tooltips render through a portal into `document.body`
(`components/Tooltip.jsx`): a CSS-only `::after` tooltip gets clipped by the
scrolling tables and the modal body.

## Limitations

- Requesting a waveform after every transmission costs sensor battery and
  airtime; the On-request Waveform Data popup says so. A Gen4 sensor already
  sending waveforms on its own (Auto Waveform Transmission Interval) doesn't
  need it.
- Sensor error frames and type 127 ultrasound waveforms are not sent to
  MultiViz; each is noted in the sensor's Historical popup.
- Types 80 / 81 can't be configured from Atrium; use Node-RED, or contact NCD
  technical support.
- Custom and Smart waveform requests rely on a platform internal and are
  disabled automatically if a platform update removes it; Regular requests
  are unaffected.
