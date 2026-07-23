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

## Requirements

- Atrium platform **2.1.0** or newer.
- Gateway model **EG5120** (the vibration analysis is CPU-intensive and is not
  supported on the EG5100).
- One or more NCD vibration sensors paired with the gateway.

## Licensing

AssetPulse is a **licensed app**. You can install it from the App Center at any
time, but it stays locked until a signed license bound to your gateway is
entered on the app's License screen. Contact NCD to obtain a license.

## Permissions

- `data:read` — reads telemetry from the platform database (read-only).
