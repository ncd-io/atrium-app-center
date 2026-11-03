# Changelog

## 1.0.0

- **First App Center release.** No functional change from 0.10.3.
- Requires Atrium 2.7.1. Learning a type 33's current threshold needs Atrium
  2.8.0; on an older platform the wizard says so, and the threshold can be set
  by hand under Advanced.

## 0.10.3

Type 119 input filter fixed too (Travis, 2026-10-15): debounce 1000 ms, `interrupt_timeout` 0 (firmware `Wireless_motor_uptime_monitor`, which also builds the 108 and 123: debounce restarts on every edge, so shorter flickers never become a report; `interrupt_timeout` is the counter-ignore window there as well). The wizard hides the speed choice for it. Where the choice remains (108, 123, 132, 133), `interrupt_timeout` is now labelled for what it does — the sensor's own cycle counter — not as a wait between reports.

## 0.10.2

Type 33 input filter is fixed, not a choice (Travis, 2026-10-15; confirmed in the firmware source, `NCD_Applications/applications/wireless_current_detect_oee_sensor`): debounce 1000 ms always (a plain per-edge filter; a CT's current is steady), and `interrupt_timeout` 0 — on this firmware it's `u16_ctr_ignore_timeout`, which only stops the sensor's own cycle counter counting more than once per window and holds back no transmissions, so it saves no battery. The wizard hides the speed choice for it; battery is the check-in interval's job. Threshold search step corrected to the firmware's pot formula (1.25 A per 100 A of clamp, the clamp rating = pot step 80, 0 and 1 A the same step).

## 0.10.1

From the first live type 33 run (b00e, 2026-10-15): the type 33's debounce is 10–1000 ms in firmware (its option list says 65000; it kept 200 when sent 2000), so the profile carries `limits` that cap the presets, the Custom field and the advanced editor. Review shows the threshold even when the search already left it set. A value the sensor refuses (not_kept / not_accepted) shows the gateway's message with Back to settings instead of waiting silently. Setup complete shows "Running above N A".

## 0.10.0

Type 33 (AC current detect) setup learns its threshold. The sensor only says whether the current is above its threshold, so with the machine running Shop Floor tries thresholds one after another, the sensor rebooting after each (platform 2.8.0 `sensorConfig` reboot), and finds the highest that still trips (binary search, `backend/ctsearch.js`; re-tests the result to catch a changing load). Then the same with the machine stopped or idling, and suggests a threshold between the two, in whole amps, adjustable. The CT size is read from the sensor. Search reports stay out of run time and skip the duplicate filter (a rebooted sensor repeats its packets). Cancel restores the original threshold. Reset-button video: placeholder until it exists. Push-on-change is left alone when already non-zero.

## 0.9.0

Live state: a stop shows on the screens as soon as the sensor reports it (it used to wait out "ignore stops shorter than"). That setting is now "Wait before telling other apps it stopped" and only delays the asset.running "stopped" message (and stopped-too-long never fires inside it). Every start counts as a cycle.

## 0.8.0

Cycle counts (machine starts) on tiles (Settings toggle), the detail page's period cards, a Run time / Cycles switch on the history chart, the reads and the asset.state event. Floor Service view: a card per machine with hours since service, hours to next, estimated due date and days to service, filtered by due now / due within 7 days / not due. Estimated due dates show "(in N days)". Sensor reports chart: full screen and a time zoom bar (as in AssetPulse). Chart tooltips readable (light text).

## 0.7.0

Service hours: "Service every N hours of run time" on the machine with an hours-since-service odometer, estimated due date from the last 30 days' average, Service panel on the machine page with Reset service hours and a service log (migration 005; replaces 0.6's milestone reminders — an existing interval carries over). New event `asset.running` (start/stop). Actions `service.reset` (replaces service.mark-done), `machine.create`, `machine.update`, `settings.update`; five reads for API tokens and AI assistants (`mcp:tools`).

## 0.6.1

Alerts: stopped too long (window: any time / any shift / one shift; email, red tile, bus event; clears on start) and service reminders (every N h on total or since-added hours; email, badge, bus event; mark done in the UI or by the service.mark-done action). Bus: asset.state (published immediately on state changes), asset.stopped_too_long, asset.service_due.

## 0.5.3

Edit page: green "Sensor configured" panel with what the sensor is set to; "Advanced — edit the sensor's settings directly" (every setting from the sensor's own option list, validated, network settings excluded, delivered and tracked like the wizard's).

## 0.5.1

Settings page (tiles, shifts, production day, groups, lost sensors) with a live tile preview; "also apply these shifts to today's run time" re-sorts today's rollups (backend/rollup.js).

## 0.4.1

Day view run time from the daily rollup (covers days before the hourly rollup existed).

## 0.4.0

Machine detail page: hero, shift selector, period cards, history chart (per hour/day/week/month/year), day view (timeline, the sensor's own reports with running shaded, at a glance, activity), sensor panel with a Configured check. Hourly run-time rollup (migration 003).

## 0.3.3

Check step has no button to press early; a red "running but not detected?" link appears after 15 s. Reset and threshold steps sized to fit the dialog (instruction above the video, video capped; compact chart).

## 0.3.2

Wizard in a dialog (fixed size, full screen on phones; main action bottom-right, Cancel setup bottom-left; closing keeps the run); draggable threshold line with a handle; "you can turn it off now" on the threshold step; check step = "turn it on now" → Setup complete when seen running, or "The machine is running" → not detected → Adjust threshold level.

## 0.3.1

Wizard reworked from Travis's walk-through: confirm off → reset (auto) → off readings (auto) → start machine → running readings (≥ 3) → threshold on a bar chart with a movable line → plain-language settings (responsiveness presets for the sensor's debounce/interrupt timeout, check-in interval, ignore stops in minutes, starting hours); proper Cancel setup button; chart lazy-loaded.

## 0.3.0

Floor view, add/edit machine, sensor-setup wizard UI (magnet-reset video); groups API; live input from de-duplicated reports.

## 0.2.0

Run-time counting engine and rollups; asset CRUD, /floor and totals API.

## 0.1.0

Scaffold: sensor profiles, vibration calibration, setup-wizard backend.
