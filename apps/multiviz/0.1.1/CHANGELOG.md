# Changelog

## 0.1.1

- **First App Center release.**
- Requires Atrium 2.8.0 (`minPlatformVersion`), which the MultiViz bridge needs
  for its own MQTT connection. 0.1.0 installed on older platforms with the
  bridge disabled.
- README rewritten for customers; development and submission notes moved to
  `multiviz-dev/`. No code changes.

## 0.1.0

Initial version: broker connection, sensor linking, processed-data bridge,
continuous on-request waveform data (Regular/Custom/Smart). Superseded this
app's original ISA-95 asset-mapping design (MultiViz maps on its own side) and
renamed from "Viking" to "MultiViz".
