# Changelog

## 1.0.0

- **First App Center release.** No functional change from 0.7.1.
- Requires Atrium 2.6.0. Reads the Differential Bidirectional Pressure Sensor
  (type 21, firmware 15+), the Precision Pressure & Temperature pA sensor
  (type 20, firmware 6+) and the Wireless Differential Pressure Sensor Gen4
  (type 131). Older type 21 firmware is declined rather than guessed at — only
  firmware 15 reports a unit-typed pressure.

## 0.7.1

Fixes from the hardware test on gateway AFE6, where the app was run against a
bench duct rig with a type 21 sensor and a Dwyer Magnehelic teed across the same
ports.

- **Fixed: a filter went blank for about half an hour after every shutdown.**
  The rig was switched off overnight; in the morning, with the fan running
  again, every filter read "No data — not enough running readings yet". The
  evaluation window is six hours, so an overnight stop empties it, and scoring
  started again from zero. Most air handlers stop nightly or at weekends, so
  this would have happened on every site, every morning. The element does not
  load while the fan is off, so the last verdict is still the best information:
  it is now held and marked **re-checking** until fresh readings can confirm it.

- **Fixed: the pressure trend charted readings from before the filter existed.**
  Commissioning — bench-testing a sensor, dipping it in a water column — puts
  pressures through the chart that a filter never sees; 173 in. w.c. was
  recorded, which squashed the clean and replacement lines onto each other and
  made the chart useless. The trend now starts no earlier than the filter was
  created, and the y-axis is scaled to the element in front of you rather than
  to every value ever recorded. Where a filter has had more than one element, a
  button switches between all of them and the current one.

- **Fixed: a filter at its replacement pressure could still read "Due soon".**
  The card showed "1.45, replace at 1.45" and 99.9% used, because the stored
  values differed by less than the displayed unit resolves. The verdict is now
  decided at the precision shown, and a percentage just below the threshold
  shows one decimal rather than rounding to a flat "100%".

- **Thresholds can be captured from the sensor.** Every pressure sensor rests at
  some offset — the one on the rig sat at +0.04 in. w.c. — so a clean pressure
  typed from a reference gauge made a clean filter read 5.6% used. Taking both
  numbers from the same sensor that does the scoring cancels the offset exactly.
  The wizard's sensor step now has **Clean** and **Replace at** buttons that
  capture the live reading, and the thresholds step says why this is worth doing.

- **The live pressure is always shown.** It used to be replaced by an em dash
  until a filter could be scored, which is exactly when an installer is trying
  to confirm the tubes are on. The card now leads with the live value and says
  what it is waiting for, with a count.

- **The sensor's measuring range is now known for the AMS5812.** No full scale
  was derived for that chip, so the range check quietly skipped every type 21
  sensor: a part fitted with the wrong range read 3x low, then 67x high, with no
  warning. The suffixes are tenths of a psi.

- **"Last reading" named two different things** — a pressure and a time. The
  time is now **Last heard**, matching the rest of Atrium.

- **The trend has 1 h and 6 h ranges.** At 24 h the buckets are six minutes
  wide, so a bench test drew one or two points.

- Life used is clamped on the chart; a single bad sample was able to report
  five-figure percentages.

- The README documents the bench-testing traps: set **Median over** to 1 when
  stepping a rig through loading states by hand, and take thresholds from the
  NCD sensor rather than a reference gauge.

## 0.7.0

- **Two more sensors are supported.** Alongside the Differential Bidirectional
  Pressure Sensor (type 21, firmware 15+), the app now drives the **Wireless
  Differential Pressure Sensor Gen4** (type 131, any firmware) and the
  **Precision Pressure & Temperature (pA)** sensor (type 20, firmware 6+). All
  three report a differential pressure with its unit attached, which is what lets
  one app read them identically; each has its own firmware floor and sensors
  below it are listed with the reason rather than hidden.

- **The Gen4's measuring range is read from its telemetry.** It reports its range
  on every data frame rather than in a configuration check-in, so the app knows
  which Honeywell ADP part is fitted — and therefore whether a filter's
  replacement pressure is within what the sensor can measure — as soon as the
  sensor reports, without any pairing step.

- **The pressure trend opens as a window** over the dashboard, from a **View
  trend** button. The buttons on each card — View trend, Edit, Mark replaced,
  Remove — are now always visible, and clicking the card itself no longer does
  anything, so nothing is hidden behind a click you had to guess at.

- **Sensor temperature is shown on the trend window.** All three sensors report
  it. It is context only and plays no part in the filter calculation, which its
  tooltip says.

- A sensor range warning no longer reappears for a newly created filter when the
  same sensor has already shown readings beyond the range it claims.

- **The controls and severity counts stay on screen while the list scrolls**, so
  the counts remain usable as filters however many filters there are. An **All**
  count sits at the front of the row as an explicit way back to the full list.

- **A full-screen button** widens the dashboard to use the whole frame. Where the
  browser permits it the page also goes genuinely full screen; where it does not
  — which includes the gateway's own sandboxed frame — the widened layout still
  applies, so the button always does something.

- **Warnings moved off the cards into a notice button.** Cards were growing to
  different heights depending on whether anything was wrong; an amber warning
  icon now appears beside the other actions, and opens a window carrying the
  filter's name, its sensor address and the full text.

- **Fixed: adding a filter opened its pressure trend by itself.** The trend now
  opens only from View trend.

- The pressure trend window shows the sensor's address under the filter name.

## 0.6.0

- **Fixed: a filter could stay on "Replace now" after being marked replaced.**
  Readings taken before the element went in were still being scored, so the old
  filter's high pressures out-voted the new one's for hours. Only readings from
  the current element are scored now. The same fix means a filter created today
  ignores whatever the sensor reported while it was being commissioned.

- **"In service since" can be edited**, with a "Start fresh now" button beside
  it. This is how to discard test or commissioning data: nothing recorded before
  that moment is ever scored. The app does not store telemetry of its own — the
  readings belong to the gateway and are kept under its own retention settings —
  so moving this date is the way to draw a line under old data rather than
  deleting anything.

- **The pressure trend marks where the element was replaced**, so a step down in
  the line explains itself.

- **Fixed: marking a filter replaced raised two false warnings** — that the
  sensor had stopped reporting, and that the replacement pressure was outside the
  sensor's range. Both facts belong to the sensor rather than to the filter
  element, and both were being discarded along with the old verdict. A
  freshly replaced filter now simply says it is waiting for its first reading.

- **"Installed" moved to the filter card**, beside "last reading", and shows how
  long the current element has been in service.

- **The smoothed pressure is labelled correctly.** It was shown as "avg of last
  5" but has always been the median — the middle reading, which is what stops one
  odd value moving a maintenance decision. It now says so, and the number of
  readings it spans is adjustable from the toolbar.

- **Differential pressure leads with the value the percentage uses**, with the
  latest reading beneath it.

- **The pressure trend marks every element change in view**, not only the most
  recent, and service history scrolls after three entries instead of growing the
  panel.

- **"% of filter life used" explains itself** on hover — what it measures, what
  it is calculated from, and when it updates.

## 0.5.0

- **A Data Timeout Limit can now be set per filter**, in the setup wizard and
  when editing: if no data arrives within it, the filter is flagged as having
  stopped reporting. Left empty it follows the sensor's own
  reporting interval — three missed reports, so a sensor reporting every 10
  minutes is flagged after 30 — which is the right behaviour for almost everyone
  and adapts automatically if the transmission rate is changed. Set it yourself
  when the reporting interval recorded against the sensor is out of date, or when
  a longer grace period suits the site.

- **Tooltips now open wherever there is room** — below the icon normally, beside
  it when the window is short. They previously always opened downward and could
  run off the bottom of a small window.

- **Removed "checked" from the cards and the pressure trend.** "Last reading" is
  the field that matters; when the app last recalculated was noise.

- **The pressure trend panel now shows only what it adds** — the thresholds, the
  baseline, the pressure chip, the install date and how much data backs the
  chart. Everything it used to repeat is on the card behind it.

- **The sensor's address is on the filter card**, under the location, rather than
  buried in the trend panel — it identifies the filter rather than explaining the
  chart. The Data Timeout Limit sits under "last reading", next to the number it
  governs.

## 0.4.0

- **"Last reading" is now on every filter card**, next to "checked". They are
  different facts: the app keeps recalculating on schedule even when a sensor has
  gone silent, so "checked 5m ago" said nothing about whether data was still
  arriving. A filter that has missed three expected reports is now marked stale,
  its card drops the confident colour, and it says how long it has been quiet and
  what to check.

- **Each card carries its status colour down its left edge**, so a wall of
  filters can be read at a glance without opening anything.

- **Differential pressure shows both numbers**: the live reading, and underneath
  it the average the percentage was actually calculated from.

- **Airflow says it describes the last reading**, not this instant, and its
  tooltip lists what Running, Idle and Unknown each mean.

- **The setup wizard warns when a filter's pressures sit outside the sensor's
  stated measuring range** — as a warning, not a block. The range comes from
  configuration the sensor reported at a past check-in and is occasionally out of
  date, so refusing to continue on its word would stop a legitimate setup. If the
  sensor has actually reported beyond its claimed range, the claim is treated as
  disproved and nothing is said.

- **Fixed a range warning that came back overnight.** Whether a sensor has ever
  exceeded its stated range is now remembered rather than being re-derived from
  the last few hours, so the evidence no longer expires with the readings that
  provided it.

- The inter-app bus event now carries `stale` and `last_reading_ts`, so an
  operator can wire "this filter's sensor went quiet" to an alert.

## 0.3.0

- **"Airflow" now describes the present.** It was answering "did anything in the
  last six hours move air?", so a filter kept reporting Running for hours after
  its fan stopped. It is now decided by the sensor's latest reading.

- **The differential pressure shown is the live reading.** It was the average
  across the whole evaluation window, which meant it could not reflect what the
  sensor had just reported — with fifty readings in the window, a real change had
  to out-number all of them before anything moved on screen.

- **The percentage now follows recent readings.** It is taken from the middle of
  the last five readings taken while air was moving, rather than from the whole
  window. Still smoothed enough that one spike cannot change a verdict, but it
  now responds within a few reports instead of hours. The filter's detail panel
  shows both numbers — the live reading and the value the percentage came from —
  each with an explanation.

- **The pressure trend opens on the last 24 hours** instead of 7 days, and now
  has a legend: what the orange line is, what the shaded band around it means,
  and which dashed line is "clean" and which is "replace at".

- A sensor range warning no longer appears and disappears as the fan stops and
  starts; whether the sensor has ever read beyond its stated range is judged
  across the window rather than from the instantaneous value.

## 0.2.0

- **Requires sensor firmware 15 or newer.** Only firmware 15 reports a
  differential pressure with its unit attached. On older firmware the raw
  pressure value's unit depends on which pressure chip is fitted and cannot be
  read from the data, so the app would have had to guess — and a wrong guess puts
  a wrong percentage in front of a maintenance decision. Sensors that can't be
  used now appear in the list with the reason instead of quietly going missing.

- **The sensor's pressure chip and measuring range are read automatically**, from
  what the sensor reports at each check-in, and shown when picking a sensor and
  on the filter's detail. Where the range is in known units the app also warns if
  a filter's replacement pressure sits beyond what the sensor can physically
  measure.

- **Readings now appear as they arrive.** Previously a new reading could sit for
  up to five minutes before the dashboard reflected it, including the "checked"
  time. The verdict is now recomputed as soon as the sensor reports.

- **Filters can be edited.** Name, location, size, thresholds and alert address,
  without removing and re-adding.

- **Explanations where the decisions are made.** The rating standards (MERV,
  ISO 16890, EN 779, HEPA/ULPA) are described in the wizard, and every figure on
  the pressure trend has a short note on what it means.

- Smaller things: the whole filter card opens its trend, not just the header; the
  trend closes with a button, a click outside or Escape; the wizard closes the
  same way; the trend's time axis shows minutes; and sensors are identified by
  the last four bytes of their address rather than the full one, since the
  leading bytes are identical across every radio on a site.

## 0.1.0

First release.

- **Monitor air filters by differential pressure.** Link an NCD Differential
  Bidirectional Pressure Sensor (type 21) across a filter and the app reports how
  much of the element's usable life has been consumed, colour-coded from clean
  through to replace-now.

- **Readings are only scored while air is actually moving.** Pressure drop
  depends on airflow as well as on how dirty a filter is, so a reading taken with
  the fan off would otherwise look like a brand-new filter. Each filter has an
  airflow threshold; below it the app reports the system as idle and holds the
  last severity it measured under airflow instead of showing a falsely clean
  result.

- **Clean baselines are measured, not assumed.** By default a new filter learns
  its own clean pressure from its first hours of running airflow, which is more
  accurate than a datasheet figure that assumes a design airflow your unit may
  not run at. If you know the real number you can enter it instead.

- **Guided setup with a live plumbing check.** The add-filter wizard covers
  naming, filter class (MERV, ISO 16890, EN 779 and HEPA presets with typical
  clean and replacement pressures), thresholds and sensor linking. The sensor
  step shows the live reading as you connect the tubes, and because the sensor is
  bidirectional it detects a reversed pair and offers to correct it with one
  click — before the filter is saved.

- **Email when a filter is due.** One message per filter the first time it
  reaches its replacement pressure, via the gateway's configured SMTP server.

- **Works with automations and with an AI assistant.** Publishes each filter's
  current state to the inter-app bus, so you can wire "filter needs replacing" to
  an email, a beacon or anything else on the Automations page. Provides a "mark
  as replaced" action, and exposes filter health and pressure trends to an
  assistant connected over MCP, answered against the thresholds you configured
  rather than a generic rule.

Requires platform 2.6.0.
