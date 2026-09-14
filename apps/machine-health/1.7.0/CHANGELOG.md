# Changelog

## 1.7.0

- **Route AI reports through a company AI proxy.** AI Reports settings now starts
  with a **Connection** choice: *Direct to AI provider*, or *Through an AI proxy
  (AI gateway)* — for sites whose policy is that all AI traffic goes through an
  approved gateway. Choosing the proxy asks for its base URL, which API it
  presents (OpenAI Responses, OpenAI Chat Completions or Anthropic Messages), the
  model route your proxy administrator gave you, and the proxy's own token. Any
  extra headers live under **Advanced**. Tested end to end against TrueFoundry.

  The key field is the **proxy's** token, not the model vendor's — the proxy holds
  the vendor credential. It is still encrypted on this gateway and never
  displayed again, outbound calls still follow the gateway's proxy settings, and
  nothing about what is sent changes: structured evidence only, never raw
  waveforms.

  **Needs a platform that supports it**; on an older gateway the Connection choice
  isn't offered and AssetPulse works exactly as before.
- Reports now ask the provider for strict JSON output where the API supports it,
  so fewer responses need the lenient repair pass.
- **Test connection** now saves the form before testing, so it exercises what is
  on screen rather than the last-saved settings. It also allows the model a longer
  reply — a reasoning model spent the previous 5-token cap thinking and returned
  nothing, which read as a failed connection on a working setup.

## 1.6.0

- **AI-agent access to asset setup and alarm limits.** An assistant connected to
  the gateway over MCP can now read how your machines are configured, not just
  what AssetPulse concluded about them. Three reads are declared: the asset
  roster, one asset's **mechanical setup** — the drivetrain in running order with
  each component's parameters, every monitoring point's mounting and axis
  orientation, and each bearing's part number, geometry and BPFI/BPFO/BSF/FTF
  fault orders — and one asset's **telemetry alarm thresholds** with the notify
  and waveform actions each level performs — **including thresholds you have
  switched off**, which the Telemetry view hides. A limit that is configured but
  disabled fires nothing, and an agent reporting that is more use than one that
  sees an empty list.

  This is the interpretation context vibration data needs: bearing fault orders
  and shaft speed are what turn a peak frequency into a named fault. Until now an
  agent could see AssetPulse's alerts and assessments but nothing about the
  machine behind them, so it could not check its own reasoning against the setup
  you entered.

  Two new routes serve these: `GET /asset-setup/:asset_id`, which returns
  configuration only — no captures, assessments, reports or alerts — so reading
  it stays cheap, and `GET /asset-alarms/:asset_id`, which reports every
  threshold on an asset with its enabled flag and per-level actions.

  **Nothing is exposed until you allow it.** The reads are reachable only by an
  API token or connected app you grant the **App data** (`apps:data`) scope, on a
  gateway running platform **2.6.0 or newer**. On an older gateway this release
  behaves exactly like 1.5.1.

- **New automation action: Set a telemetry alarm threshold.** AssetPulse now
  offers `thresholds.set` alongside Capture Waveform, Acknowledge Alerts and
  Send Health Email — so an alarm limit can be wired to something else happening
  on the gateway, or set by an assistant that has just read the current limits.
  It sets one metric's Warning and Critical levels on one monitoring point, and
  what each level does when it fires.

  Absolute, like every AssetPulse action: it writes the values given rather than
  nudging them, so an automation re-asserted after a reboot lands on the same
  configuration. Leaving a level empty clears it, so a critical-only alarm is
  just critical with warning blank. Omitting one of the notify or waveform flags
  keeps its current setting, so saving values alone never switches off an action
  already attached to a level. Setting Critical below Warning is refused —
  alerts fire at the highest breached level, so the warning level would never
  fire on its own.

  The Automations action list and the Telemetry view's threshold editor now save
  through the same code, so the two cannot drift on what any of that means.

## 1.5.0

- **Download Waveform on the Health tab** — next to **View Waveform**, and in
  the waveform window itself. Downloads the capture being viewed as a single
  `.zip`: the raw time-domain samples as CSV (`time_s, x_g, y_g, z_g`) plus a
  JSON sidecar with the asset, drivetrain, sensor, bearing and capture context
  needed to analyse it in another tool. Stepping through history with Older /
  Newer moves the download with it, so a past capture no longer has to be
  reached through the per-point card to be exported.

## 1.4.0

- **Step through waveform history** — the View Waveform window now has
  **‹ Older** / **Newer ›** buttons, so adjacent captures can be compared
  without closing the window, clicking the neighbouring dot on the Severity
  Trend, and reopening. The buttons walk the same captures those dots
  represent, skipping any without a stored waveform, and grey out at the oldest
  and newest ones. Stepping also moves the selected point on the Severity
  Trend, so the assessment behind the window stays on the capture being viewed.
  The chosen metric, traces and frequency zoom carry across each step — which
  is what makes two captures actually comparable.

## 1.3.0

**Requires gateway platform 2.4.0 or newer.** AssetPulse 1.3.0 will not install
on an older gateway — stay on 1.2.0 until the gateway is updated.

### Automations (inter-app bus)

AssetPulse can now take part in gateway automations, in both directions. It
publishes what it knows and exposes things it can do; you connect them to the
rest of the gateway on the **Automations** page. AssetPulse never talks to
another app directly — every crossing is a binding you create.

**Publishes (use as a "When"):**

- **Metric crossed a threshold** — where one metric on one monitoring point
  stands against its Warning / Critical thresholds. Match on `warning_breached`
  / `critical_breached` for "at this level or worse" — they stay true as a
  reading escalates, so an automation holds instead of releasing when the machine
  gets worse. `metric_state` gives one band exclusively when that's what you
  want. Tracked separately per monitoring point and metric.
- **Asset health changed** — an asset's severity band, running state, open
  alert count, and the latest AI assessment text and recommended action. Tracked
  per asset.

**Can do (use as a "Then"):**

- **Capture a vibration waveform** — request a raw capture from a monitoring
  point now. It runs through the severity engine like any other capture, so the
  asset's health is re-evaluated from it.
- **Acknowledge threshold alerts** — clear an asset's open alerts, optionally
  only Warning or only Critical.
- **Send asset health email** — send an asset's configured email now, using its
  own recipients, templates and latest AI report. Recorded in the asset's
  notification history.

State is republished periodically, so an automation reconciles on its own after
a gateway restart or a dropped message rather than staying stuck.

### Also

- **Settings → Automations** — a new card listing everything AssetPulse offers
  the bus, plus each asset's currently published health.
- Deleting an asset or monitoring point, or switching a threshold off, now
  clears its automation state instead of leaving an automation latched on
  something that no longer exists.

## 1.2.0

- **MQTT publishing** — publish Summary, Waveform, AI Report and Alert streams
  to the gateway's shared MQTT broker, with per-stream topic templates using the
  `::Token::` convention. Configure under **Settings → MQTT**. Requires the
  operator to grant AssetPulse in the gateway's MQTT Client settings.
- **AI settings** — added a connection **Test** button and **Clear key**.

## 1.1.1

- Overview refreshes in place instead of reloading the view.

## 1.1.0

- Compatibility with the sandboxed app host and scoped per-app tokens.
