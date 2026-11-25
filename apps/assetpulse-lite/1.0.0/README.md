# AssetPulse Lite

Collects a vibration sensor's raw waveform when a reading reaches a level you set, and stores it on the gateway for you to download or pull into your own analysis software.

## What it does

- **A waveform while the machine runs.** Set a **Waveform Collection** level between a machine's idle and running readings, and the app asks the sensor for its raw waveform when a report reaches it.
- **As often as you choose.** A per-sensor **Minimum time between collections** limits it to once per period, or leave it at 0 to collect every time the level is crossed.
- **A Critical level.** A second, higher level collects a waveform straight away, whatever was collected earlier, and can send an email.
- **Two-probe sensors as one sensor.** A two-channel sensor is one entry with thresholds per probe, and one request can collect both probes.
- **Standard or custom waveforms.** Use the sensor's own waveform settings, or set the sample rate and duration for each request.
- **A log of why.** Every capture records the reading that triggered it, with CSV download.

AssetPulse Lite does no analysis of its own. It does not calculate an FFT, grade severity or write a report. For analysis on the gateway, see AssetPulse.

## What it needs

- **Atrium 2.9.3 or newer.** Any gateway model, including the EG5100, and the container deployment.
- A supported vibration sensor, whitelisted on the gateway: the Smart Vibration Sensor Gen4 (type 114), the Vibration & Temperature Sensor Gen4 (type 110) or the 2-Channel Vibration & Temperature Sensor Gen4 (type 111).
- Each sensor managed by one gateway only. Two gateways managing the same sensor make waveform requests fail.
- For Critical alert emails, a mail server set under the gateway's Settings, SMTP.
- No license. The app is free.

## Getting started

1. Open the app and click **Add sensor**. Pick the sensor and, if you like, name it.
2. On the sensor's page, look at the **Velocity** chart and enter a **Collect at** level between the idle and running readings. Switch the threshold on and click **Save**.
3. The next report at or above the level collects a waveform. It appears under **Recent captures**, with **Download CSV**.

The full walkthrough is in the [AssetPulse Lite User Guide](https://ncd.io/blog/assetpulse-lite-atrium-app-user-guide/).

## Use from your own software

Everything on the screens is available over HTTP with an API token. Create one under the gateway's **Settings, Users & Security, API Tokens** with the scopes `apps:data` (to read) and `apps:actions` (to change settings and request waveforms).

Reads are `GET` requests under `/api/apps/assetpulse-lite`:

- `/sensors` lists the watched sensors, their latest readings and thresholds.
- `/sensors/{sensor_id}` is one sensor's full setup.
- `/available-sensors` lists the vibration sensors on the gateway.
- `/sensors/{sensor_id}/telemetry` is the recent history of one metric of one probe.
- `/captures` is the capture log, and `/captures/{capture_id}` one capture.
- `/captures/{capture_id}/waveform` returns the samples as `x`, `y` and `z` arrays in g, with the sample rate.
- `/alerts` lists Critical alerts, and `/settings` the app's settings.

Changes are `POST` requests to `/api/bus/actions/assetpulse-lite/{action}` with a JSON body of `{"params": {...}}`:

- `sensor.add`, `sensor.update` and `sensor.remove` manage the watched sensors and what a threshold collects.
- `threshold.set` sets the Waveform Collection and Critical levels for one metric. On a two-probe sensor it takes `probe`.
- `waveform.capture` requests a waveform now.
- `settings.update` changes the app's settings.

```
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "http://$GW/api/bus/actions/assetpulse-lite/threshold.set" \
  -d '{"params": {"sensor_id": 1, "metric": "velocity", "collect_enabled": true, "collect_level": 2}}'
```

Every parameter, response field and error is in the **HTTP REST API** section of the [user guide](https://ncd.io/blog/assetpulse-lite-atrium-app-user-guide/).

## Also works with

- **Automations.** The app publishes **Vibration metric crossed a level** for each sensor, probe and metric, and its six actions can be the "Then" of an automation.
- **AI assistants.** An assistant connected to the gateway can read the sensors and captures and change thresholds.
- **MQTT.** Each collected waveform and each Critical alert can be published through the gateway's MQTT client.

## Good to know

- A sensor only reports when its own settings tell it to. The app acts on the reports it receives, so a machine that starts and stops between two reports is not seen.
- Each waveform costs sensor battery. The minimum time between collections is the control for that.
- A custom waveform command is applied by the sensor only when its Mode setting is Smart. In any other mode the standard waveform is collected, and the capture says so.
- The waveform samples are stored by the gateway and follow its data retention setting.
