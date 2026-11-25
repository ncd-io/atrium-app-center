# AssetPulse Lite — Changelog

## 1.0.0

First App Center release. The app is unchanged from 0.2.1.

- Collects a vibration sensor's raw waveform when a reading reaches a level you
  set, as often as you allow, and again at a Critical level that can also send
  an email.
- A two-probe sensor is one entry with thresholds per probe, and one request
  can collect both probes.
- Every setting and every waveform is available over an HTTP REST API with an
  API token, to an AI assistant, as CSV, and optionally over MQTT.
- Requires Atrium 2.9.3.
- User guide: https://ncd.io/blog/assetpulse-lite-atrium-app-user-guide/

The entries below are the development versions that led to it.

## 0.2.1

- **Requires Atrium 2.9.3.** Earlier platforms could not send a custom command
  on a threshold, and before 2.9.2 did not credit the second waveform of a
  both-probes request to probe 2. The app used to install on them and fall back
  quietly; it now declares the platform it was tested against.

## 0.2.0

A dual-probe sensor (type 111) is now one sensor with thresholds per probe.

- **Added once, not once per probe.** Name, location, minimum time between
  collections, alert recipients and the waveform request are set once and
  shared by both probes. The sensor screen has **Probe 1** and **Probe 2** tabs
  below the waveform request, each with that probe's thresholds and history.
- **What a threshold collects** on a dual-probe sensor is now **both probes**
  by default, with one command, standard or custom. The alternatives are only
  the probe that crossed its level, or always probe 1 or probe 2.
- **One minimum time between collections per sensor.** A collection triggered
  by one probe holds off the other as well. Critical still ignores it.
- **API changes.** `threshold.set`, the telemetry read and
  `PUT /sensors/{id}/thresholds/{metric}` take `probe` (required on a
  dual-probe sensor, optional on a single-probe one). `sensor.add` no longer
  takes `probe`. `waveform_probes` is `both`, `triggering`, `1` or `2`. Sensors
  report `probes` instead of `probe`, each threshold carries its `probe`, and
  the list's `values` are keyed by probe. Captures gain `trigger_probe`, alerts
  gain `probe`. On a dual-probe sensor the `threshold.state` entity key
  includes the probe.
- **Action results always parse.** The platform cuts an action's result at
  2,000 characters. `sensor.add` and `sensor.update` returned the full setup,
  which on a dual-probe sensor was longer than that and arrived as cut-off
  JSON. They now return the sensor's settings and the configuration of each
  threshold that is set; the full setup is the `sensor_setup` read.
- **Upgrade.** Sensors added in 0.1.0 keep their thresholds, history and what
  they collect. A dual-probe sensor that was added twice becomes one entry.

## 0.1.0

First version. The gated waveform collection of AssetPulse as its own free app,
with no on-gateway analysis, so it runs on every gateway model including the
EG5100 and the container deployment.

- **Sensor-based setup.** Add a vibration sensor (types 110, 111, 114) and
  optionally give it a name, a location and the machine it is installed on.
  There is no asset or drivetrain model.
- **Waveform Collection threshold** per metric (velocity, RMS acceleration,
  acceleration max, temperature): a routine trigger with its own on/off switch
  and level, replacing the "Warning" threshold that customers were setting
  between a machine's idle and running values to collect a waveform per run.
- **Minimum time between collections** per sensor, in hours and minutes. At 0 a
  waveform is collected once per crossing; otherwise at most once per period
  while the metric stays at or above the level.
- **Critical threshold** per metric. Collects a waveform regardless of the
  minimum time, sends an email, or both, once per episode.
- **Capture log** recording why each waveform was collected, with CSV download.
  Waveforms that arrive for a watched sensor without this app asking are logged
  as "other".
- **Getting data out:** REST routes for the capture list and the samples (JSON
  and CSV), and optional MQTT publishing of each stored waveform.
- **Full HTTP and MCP surface:** nine declared reads and six actions
  (`sensor.add`, `sensor.update`, `sensor.remove`, `threshold.set`,
  `waveform.capture`, `settings.update`), so everything the screens do can be
  done by a customer's own software with an API token, or by an AI assistant.
- **Automations:** publishes `threshold.state` per sensor and metric, with
  monotone `collection_breached` and `critical_breached` fields.
- **What a threshold collects** is set per sensor: the watched probe or both
  probes of a dual-probe sensor (type 111), and the sensor's standard waveform
  or a custom command with a sample rate and a duration. Both are settable from
  the sensor screen, the REST routes, the `sensor.add` / `sensor.update` actions
  and per request on `waveform.capture`. Two probes of one sensor due on the
  same report are requested with one command. A custom command needs the
  sensor in Smart mode and a platform build that can send one on a threshold;
  otherwise the standard waveform is collected and the capture says why.
