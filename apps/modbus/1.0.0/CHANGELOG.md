# Changelog

## 1.0.0

First App Center release. Requires **Atrium 2.10.0**. The network listener and the serial
port are now the gateway platform's, and a review's findings are fixed. Installed and
tested on a gateway by NCD; validation on customer RS-485 buses and with customer PLC and
SCADA clients is in progress.

**What you will notice**

- **Modbus TCP accepts private addresses only, by default.** Modbus has no login, so a
  gateway with a public address (a cellular connection, for instance) no longer serves the
  register map to the internet because the server was switched on. A new setting, *Who may
  connect*, has "Private addresses only" (default) and "Any address", which shows a
  warning. If your client is on a public or carrier-NAT address, choose "Any address" and
  list the client under Allowed clients.
- **A mistyped allowed-clients entry is rejected when you save.** 0.1.0 read `10.0.0.5/`
  as "everyone" and saved it as `10.0.0.5/0`. If you typed such an entry, it still means
  everyone: check your list. The list now also takes IPv6 addresses and ranges.
- **COM2 is no longer changed behind your back.** 0.1.0 re-applied COM2's RS-485 settings
  at start-up and every 5 minutes, silently undoing a change made in the Robustel
  dashboard, and its Apply worked even with Modbus RTU off. Now the port's mode is set
  only when you save Modbus RTU settings (RTU switched on, or its baud rate, parity or
  stop bits changed) or press Apply, and never while Modbus RTU is off. If COM2 is changed
  elsewhere, Overview and Settings say what is wrong and offer Apply.
- **The serial port is chosen by the gateway.** The typed-in device path is gone; Modbus
  RTU uses the gateway's RS-485 port for apps (COM2 on an EG5100 / EG5120), and the sensor
  radio's port can never be opened. On a host where Atrium does not manage the port (a USB
  adapter in a container) Settings tells you to set its mode on the host; where there is no
  RS-485 port it says so and Modbus RTU stays off.
- **Saving applies at once** instead of within 5 seconds. Changing a Modbus TCP setting
  reopens the listener, so connected clients are disconnected and reconnect.
- **A listener that could not open is shown**, with the reason (port in use, a listen
  address the gateway does not have, a port the gateway uses itself) on Overview and
  Settings, and retried.
- **On a fresh install a sensor's values appear with the first report of its type**, not
  from history: until then its block has a full header and no values. Layouts already
  learned are kept across upgrades and restarts.

**Fixed**

- One client can no longer monopolize the gateway: each TCP connection is limited to 16
  requests per event-loop turn and 200 per second (beyond that it is slowed, nothing is
  dropped) and to 128 KiB of waiting requests. New "Slowed" and "Closed idle" counters in
  Diagnostics.
- The start-up scan of every sensor's reading history is gone. Last values are now read
  after start, one sensor at a time, each as an indexed lookup by sensor, measurement and a
  bounded time window.
- A settings change arriving while the previous one was still being applied could start an
  interface twice. Changes are now applied one at a time.
- A failed start (a busy database at boot, for instance) left the server off until the
  gateway's services were restarted. It is now retried, after 5 s and then at growing
  intervals.
- Every timer and callback the app runs inside the gateway's ingestion service is
  contained, so an error in the app cannot stop sensor ingestion.
- Values the platform stores as numbers are now served the same way from live reports:
  on/off values read 1 / 0 (they were "no value" before, so a register primed from history
  was never updated live).
- Modbus RTU: Read / Write File Record (0x14, 0x15) addressed to the gateway now get
  exception 01 instead of no answer.
- Removing a sensor id that does not exist no longer creates a row for it.
- A sensor that was whitelisted while every slot was taken now gets the next slot that
  frees (with auto-assign on). Sensors you removed yourself stay off the map.
- A word order that is not one of ABCD / CDAB / BADC / DCBA is always refused.
- The Overview and Sensors pages no longer run one database query per sensor every 5 s.

**Documentation**

- The README now says prominently that a sensor type's value registers are in the order
  each gateway first received them, so the same sensor type can have different register
  offsets on two gateways: take the map from each gateway. The note beside the CSV export
  and the `register_map` read say so too.
- float32 values are exact only up to 16,777,216: totalizers and counters above that lose
  their low digits over Modbus.

**For reviewers**

- Capabilities `net:listen` and `serial:rs485`; `listens: [{ "id": "tcp" }]`. The package
  contains no `net`, `tty`, `child_process` or `fs` use; `backend/mb/serial.js`,
  `backend/com2.js` and `backend/robustel/com2.lua` (the root helper) are removed, as are
  the `rtu_device` setting and the `radio_devices` list.
- Settings are saved through a daemon route (`POST /api/apps/modbus/ingest/settings`; POST
  because the daemon's CORS preflight does not allow PUT, which the sandboxed frame needs) so
  the allow-list is checked with `listeners.checkAllow()` and `serial.configure()` can run
  on a save; the API side keeps reads and slot assignment.
- New table `modbus_waiting` (migration 003); new setting `tcp_scope`.
- Tests in `modbus-dev/tests/`.

## 0.1.0

First version.

- Dependency-free Modbus server in the ingest daemon, one register image served over
  Modbus TCP (Ethernet), Modbus RTU (RS-485), or both.
- Function codes 01–06, 15, 16, 43/14 and (RTU) 08; spec limits, check order and exception
  codes; read-only except the optional new-data acknowledge.
- A fixed 100-register block per sensor slot: status, sensor type, MAC, last report, age,
  sequence number, battery, RSSI, heartbeat, and up to 40 float32 values in a per-type,
  grow-only order. Gateway block with a word-order test pattern.
- Single-unit or unit-per-sensor addressing; ABCD / CDAB / BADC / DCBA word order;
  offline values held or NaN; optional new-data handshake (coil N / offset 10).
- TCP: port 502 with an automatic fallback port, listen address, unit-ID rules, connection
  limit closing the least recently active connection, idle timeout, keep-alive, allow-list.
- RTU: length + CRC framing with silence fallback, broadcast, other-slave traffic, noise
  resync, echo suppression, response delay. (Its own serial I/O and its COM2 management
  through a root helper, re-applied every 5 minutes, were replaced in 1.0.0.)
- Raw (time-domain) frames skipped for every waveform-capable family (vibration, ultrasound,
  current monitors, noise), so none of their numbers become mapped values; such sensors
  are labelled "Overall values only" on Sensors and in the register map.
- A fresh install starts with the Modbus server off (migrations/002 keeps it on for installs
  that already had data).
- The Modbus server switch overrides both interfaces: off disables and locks Modbus TCP
  and Modbus RTU; on restores the interfaces that were selected, with their settings.
- UI: overview, sensors and slots with the register map as a pop-up (live values, how
  to read it) and CSV export, settings in boxes (server, TCP, RTU, register map, new-data
  flag), diagnostics. Two MCP reads (`server_config`, `register_map`).
