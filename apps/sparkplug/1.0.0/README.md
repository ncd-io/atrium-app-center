# Sparkplug Transmitter

Turns the gateway into a Sparkplug B edge node, so Inductive Automation
Ignition and other Sparkplug hosts build tags for every sensor automatically.

## What it does

- Publishes each sensor as its own **Sparkplug B device**, with birth and death
  certificates and typed metrics. Ignition (through the MQTT Engine module)
  discovers the sensors, creates their tags and tracks whether each one is
  online. There is no custom parsing or topic mapping to maintain.
- Folders each device by the sensor's **name in Atrium**, or its radio MAC if it
  has none. Renaming a sensor in Atrium moves it to its new folder.
- Builds **one UDT per sensor type**, with engineering units where they are
  certain. A plain-folder layout is available instead.
- Adds a **Health** folder to every sensor: battery, signal strength, last seen,
  and a **Stale** flag after three missed reports, so one set of Ignition alarms
  covers every sensor.
- Every sensor appears with real values as soon as the session starts, even one
  that reports hourly.
- Readings stored while Ignition or the broker was unreachable are **replayed as
  history** with their original timestamps (up to 24 hours by default).
- New sensors can be published automatically as they join the gateway.

## Requirements

- Atrium platform **2.8.0** or newer.
- An MQTT broker the gateway can reach, and a Sparkplug B host such as Ignition
  with the MQTT Engine module.

## Configuration

Everything is set on the app's **Connection** page: the broker (host, port, TLS,
credentials, optional CA certificate and client ID) with a **Test connection**
button, the Sparkplug group ID (default `NCD`), the edge node ID (default: the
gateway's name), an optional primary host ID, the tag layout, the history replay
window, and whether new sensors are published automatically. Nothing needs to be
set elsewhere in Atrium.

The **Devices** page chooses which sensors are published. **Diagnostics** shows
the session (births, frames sent, history replayed, publish failures), the
Sparkplug hosts seen on the broker, the last error, and each sensor type's UDT.

## Licensing

Sparkplug Transmitter is **free**. No license is needed to install or use it.
