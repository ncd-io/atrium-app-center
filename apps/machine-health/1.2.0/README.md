# AssetPulse

Predictive maintenance for rotating equipment: set up assets, monitor vibration,
and get plain-language health insights.

## What it does

- Organize your plant into **assets** (motors, pumps, fans, gearboxes) and pair
  each with a vibration sensor.
- Continuously monitors vibration and surfaces developing faults before they
  cause unplanned downtime.
- Turns the analysis into **plain-language health insights** so you don't need a
  vibration analyst to act on the data.
- Optionally **publishes to MQTT** — stream summary telemetry, waveform captures,
  AI reports, and alerts to your own broker on operator-defined topics.

## Requirements

- Atrium platform **2.3.1** or newer (MQTT client support for apps was added in
  2.3.1).
- Gateway model **EG5120** (the vibration analysis is CPU-intensive and is not
  supported on the EG5100).
- One or more NCD vibration sensors paired with the gateway.

## Licensing

AssetPulse is a **licensed app**. You can install it from the App Center at any
time, but it stays locked until a signed license bound to your gateway is
entered on the app's License screen. Contact NCD to obtain a license.

## Configuration

- **AI & Reports** (optional) — configure an AI provider, model, and API key to
  generate plain-language reports. Use the **Test** button to validate the
  provider before saving.
- **Notifications** (optional) — email maintenance staff on severity increases;
  requires SMTP configured on the gateway.
- **MQTT** (optional) — enable MQTT publishing and set a topic template per data
  stream (Summary, Waveform, AI Reports, Alerts). Topics support `::Token::`
  replacement (asset name, gateway id, sensor id, etc.); leave a topic blank to
  disable that stream. The gateway's broker connection is configured in the
  platform's **Settings → MQTT Client**, where the operator must also grant
  AssetPulse permission to publish.

## Permissions

- `data:read` — reads telemetry from the platform database (read-only).
- `telemetry:subscribe` — receives live sensor frames for alert evaluation.
- `radio:fft` — requests and analyzes raw vibration waveforms.
- `notify:email` — sends fault/alert emails via the gateway mailer.
- `net:external` — reaches the configured external AI provider for reports.
- `secrets` — stores the AI provider API key encrypted at rest.
- `mqtt:client` — publishes on the gateway's shared MQTT client (the operator
  must also grant AssetPulse in **Settings → MQTT Client**).
