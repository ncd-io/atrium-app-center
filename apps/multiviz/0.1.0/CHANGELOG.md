# Changelog

## 0.1.0

- **First App Center release.** Initial version: broker connection, sensor
  linking, processed-data bridge, continuous on-request waveform data
  (Regular/Custom/Smart).
- Supersedes this app's original ISA-95 asset-mapping design (MultiViz maps on
  its own side); renamed from "Viking" to "MultiViz".
- The MultiViz bridge needs Atrium 2.8.0 (`mqtt:connect`); on older platforms the
  app installs but the bridge stays disabled until the gateway is upgraded.
