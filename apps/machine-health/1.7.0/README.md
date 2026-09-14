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
- **Waveform history and export** — step through past captures with ‹ Older /
  Newer › to compare them directly, and download any capture as a `.zip`
  containing the raw time-domain samples as CSV plus a JSON sidecar with the
  asset, drivetrain, sensor and bearing context needed to analyse it elsewhere.
- **Takes part in gateway automations** — publishes asset health and threshold
  crossings that other apps can react to, and offers actions they can trigger:
  capture a waveform, acknowledge alerts, send a health email, or set an alarm
  threshold.
- **Answers questions from an AI assistant** connected to the gateway — the
  asset roster, how each machine is built, and what its alarm limits are.
- Optionally **publishes to MQTT** — stream summary telemetry, waveform captures,
  AI reports, and alerts to your own broker on operator-defined topics.

## Requirements

- Atrium platform **2.4.0** or newer.
- Gateway model **EG5120** (the vibration analysis is CPU-intensive and is not
  supported on the EG5100).
- One or more NCD vibration sensors paired with the gateway.

Two features need a newer platform and are simply not offered on an older one —
AssetPulse installs and runs either way:

- **AI-agent access** (the reads below) needs platform **2.6.0**.
- **Routing AI reports through an AI gateway** needs a platform that supports it.

## Licensing

AssetPulse is a **licensed app**. You can install it from the App Center at any
time, but it stays locked until a signed license bound to your gateway is
entered on the app's License screen. Contact NCD to obtain a license.

## Configuration

- **AI & Reports** (optional) — generate plain-language reports from an AI
  provider. Start by choosing the **Connection**: *Direct to AI provider*, or
  *Through an AI proxy (AI gateway)* for sites whose policy is that all AI
  traffic goes through an approved gateway. A proxy asks for its base URL, which
  API it presents (OpenAI Responses, OpenAI Chat Completions, or Anthropic
  Messages), the model route your proxy administrator gave you, and the proxy's
  own token — not the model vendor's, since the proxy holds that credential. Any
  extra headers live under **Advanced**. **Test** validates the configuration
  before you save.

  Whichever connection you choose, the key is encrypted on the gateway and never
  displayed again, outbound calls follow the gateway's proxy settings, and what
  is sent is structured evidence only — never raw waveforms.
- **Notifications** (optional) — email maintenance staff on severity increases;
  requires SMTP configured on the gateway.
- **MQTT** (optional) — enable MQTT publishing and set a topic template per data
  stream (Summary, Waveform, AI Reports, Alerts). Topics support `::Token::`
  replacement (asset name, gateway id, sensor id, etc.); leave a topic blank to
  disable that stream. The gateway's broker connection is configured in the
  platform's **Settings → MQTT Client**, where the operator must also grant
  AssetPulse permission to publish.
- **Automations** — **Settings → Automations** lists everything AssetPulse
  offers the gateway bus, plus each asset's currently published health. You wire
  those to other apps on the platform's **Automations** page.
- **AI-agent access** (optional, platform 2.6.0+) — AssetPulse's reads are
  reachable only by an API token or connected app you grant the **App data**
  (`apps:data`) scope. Nothing is exposed until you grant it.

## Permissions

- `data:read` — reads telemetry from the platform database (read-only).
- `telemetry:subscribe` — receives live sensor frames for alert evaluation.
- `radio:fft` — requests and analyzes raw vibration waveforms.
- `notify:email` — sends fault/alert emails via the gateway mailer.
- `net:external` — reaches the configured AI provider or AI gateway for reports.
- `secrets` — stores the AI provider or proxy key encrypted at rest.
- `mqtt:client` — publishes on the gateway's shared MQTT client (the operator
  must also grant AssetPulse in **Settings → MQTT Client**).
- `events:publish` — announces asset health and threshold state on the gateway's
  inter-app bus.
- `actions:provide` — lets an automation trigger a waveform capture, an alert
  acknowledgement, a health email, or a threshold change.
- `mcp:tools` — opts AssetPulse into AI-agent access, so the reads listed above
  can be called by an assistant you have granted the **App data** scope.
