# Filter Monitor

Air filter health from differential pressure: how clogged each HVAC or
industrial filter is, how much life is left in it, and when it needs changing.

## What it does

- **A card per filter** showing used life as a percentage, a colour-coded meter
  between the filter's clean and replacement pressures, the live pressure drop
  across the element, and a plain-language verdict.
- **Knows the difference between a clean filter and a stopped fan.** Pressure
  drop rises with air speed as well as with dust, so a reading taken while the
  fan is off says nothing about how dirty the element is — and read naively it
  looks like a clean filter. Each filter has an airflow floor; readings below it
  are left out of scoring, the filter is marked **idle**, and it holds the last
  verdict measured while air was moving.
- **Learns each filter's clean pressure** from its own first hours of running
  data, rather than trusting a datasheet figure that assumes an airflow your
  unit may not run at. An operator who knows the real number can type it in.
- **Pressure trend** over 24 hours, 7 days or 30 days, with the clean and
  replacement thresholds drawn in and the spread behind the average, so you can
  see how fast an element is loading and judge when it will need changing.
- **Add-filter wizard** that polls the sensor live while you are standing at the
  unit, so you can confirm the tubes are on the right way round before saving —
  and offers a one-click fix if they are reversed. Both thresholds can be
  captured from the sensor itself, which cancels out its resting offset.
- **Tells you when a sensor goes quiet.** A filter whose sensor has missed three
  reports keeps its last verdict but stops showing it in a confident colour, and
  says how long it has been silent.
- **Alerts** by email when a filter first reaches its replacement pressure.
- **Works with other apps and AI assistants:** publishes each filter's status on
  the gateway's app bus, so "filter needs replacing" can be wired to an email or
  a beacon on the Automations page; offers a **Mark replaced** action other apps
  can trigger; and lets an AI assistant connected to the gateway read filter
  health and pressure history.

## Supported sensors

| Type | Sensor | Firmware |
|---|---|---|
| 21 | Differential Bidirectional Pressure Sensor | 15 or newer |
| 20 | Precision Pressure & Temperature (pA) | 6 or newer |
| 131 | Wireless Differential Pressure Sensor Gen4 | any |

One tube goes upstream of the filter and one downstream, so the sensor reads the
pressure drop across the element directly.

The firmware floors are where each sensor starts reporting a pressure with its
unit attached. Below them the only pressure in the frame is a raw number whose
unit depends on the chip fitted and is not discoverable, so the app declines the
sensor rather than guessing — a wrong unit would put a wrong percentage in front
of a maintenance decision. Filter Monitor also warns when a filter's replacement
pressure is beyond what its sensor can measure.

## Requirements

- Atrium platform **2.6.0** or newer.
- One of the supported sensors per filter, paired with the gateway and plumbed
  across the element.

## Configuration

Add each filter through the wizard: name and location, filter type, the clean
and replacement pressures, then the sensor. **Settings** covers the display unit
(inches of water or Pascals), how far back readings are considered, how long a
new filter learns its clean baseline, and how many readings a verdict is
smoothed over.

Marking a filter replaced resets its life, timestamps the change in its service
history, and starts re-learning the clean baseline if it was learning one.

## Licensing

Filter Monitor is **free**. No license is needed to install or use it.
