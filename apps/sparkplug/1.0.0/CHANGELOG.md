# Changelog

## 1.0.0

- **First App Center release.** Validated against Ignition at customer sites.
  No functional change from 0.3.0 beyond the fix below.
- Devices page: folder names with spaces ("2 Channel Vibe") wrap at the spaces
  instead of breaking mid-word, and status chips no longer wrap.
- The Sparkplug hosts list is cleared whenever the connection is reconfigured,
  so a host seen on a previous broker is no longer listed after moving to a new
  one.
- Requires Atrium 2.8.0.

## 0.3.0

Renamed from **Ignition** (`ignition`) to **Sparkplug Transmitter**
(`sparkplug`) after customer feedback: it speaks Sparkplug B to any host, and
"Ignition" is Inductive Automation's product name. Device folders now follow
the sensor's Atrium name, falling back to the MAC (`device_folders` = `mac`
restores the old behaviour); characters MQTT Engine refuses in a folder name
are dropped or replaced, and colliding names get the MAC's last four digits.
A rename in Atrium moves the device: DDEATH on the old folder, DBIRTH on the
new. Connection screen fields now top-align.

## 0.2.1

Fixes from the first run against a real Ignition 8.3.10 / MQTT Engine
5.0.5. Gateway metrics moved from `Node Info/` (reserved by MQTT Engine, which
refused them) to `Gateway/`; `Health/Battery %` renamed `Battery Percent` ('%'
is illegal in an Ignition tag name); a host's retained STATE no longer causes a
second birth on every connect; after an unexpected drop the history replay
starts three keepalives (90 s) back, because the gateway takes that long to
notice a dead connection and QoS 0 data sent meanwhile was lost.

## 0.2.0

Own broker connection (`mqtt:connect`, platform 2.8.0): broker form and
Test connection in the app; NDEATH as the connection's Will; bdSeq per
connection (a rebirth on the same connection reuses it); graceful NDEATH on
daemon shutdown and when the broker or edge node changes; binary NCMD decoding;
primary host offline drops the connection so the broker announces the death.

## 0.1.0

Prototype. Sparkplug B edge node on the shared MQTT client; UDT and flat
layouts; health and staleness; outage history replay; Connection / Devices /
Diagnostics pages.
