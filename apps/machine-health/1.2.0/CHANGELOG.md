# Changelog

## 1.2.0

- **MQTT publishing.** A new **Settings → MQTT** section lets you publish
  AssetPulse data to the gateway's shared MQTT broker. Enable MQTT and set a
  topic template for each stream — **Summary Data**, **Waveform Data**, **AI
  Analysis Reports**, and **Alerts**. Topics support `::Token::` replacement
  (e.g. `main_building/3rd_floor/::Gateway_Id::/::Asset_Name::/::Sensor_Id::`),
  so messages are routed with your own asset, gateway, and sensor names. Leaving
  a topic blank disables publishing for that stream. Requires the operator to
  grant AssetPulse in the gateway's **Settings → MQTT Client**.
- **Test AI provider.** The AI & Reports settings now include a **Test** button
  that validates the configured AI provider, model, and API key before you save,
  so misconfigured credentials are caught up front.

## 1.1.1

- Overview page now refreshes in place on its 30-second tick instead of tearing
  down to a full-page "Loading…" state, so the AI insight banner and recent
  activity no longer flicker. A subtle "updating…" indicator shows during a
  background refresh, and the last good overview is kept if a background refresh
  fails.

## 1.1.0

- Asset setup and management.
- Continuous vibration monitoring with plain-language health insights.
