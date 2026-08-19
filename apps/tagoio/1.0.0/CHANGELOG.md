# Changelog

## 1.0.0

- Initial release.
- Connect a gateway to a TagoIO profile with a single profile token.
- Enable sensors individually; each becomes a TagoIO device, created and kept in
  sync automatically.
- Live telemetry reporting, with automatic backfill of any gap using the
  readings' original timestamps.
- Two-way sensor configuration: change report intervals, thresholds and modes
  from a TagoIO dashboard, applied over the radio and acknowledged only once the
  sensor confirms them.
- **Set up in TagoIO** builds the cloud-side dashboard, widget, analysis and
  action for configuration, and keeps them current as sensors are enabled.
- Optional battery and signal reporting, so account data usage can be reduced.
