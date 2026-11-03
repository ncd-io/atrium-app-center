# Shop Floor

Machine run time for plant managers and shop foremen: what is running right
now, and how much each machine has run.

## What it does

- **Floor view:** one tile per machine, grouped into tabs, showing whether it is
  running, stopped or has lost its signal, live as the sensor reports it.
- **Run time and cycles** for each machine per shift, day, week, month, quarter,
  year and all time, with a history chart and a day view (timeline and the
  sensor's own reports). Run time comes from the sensor's own uptime counter, so
  lost reports don't lose time.
- **Setup wizard** that configures the run-detection sensor for you:
  - For vibration sensors, it measures a threshold from the machine's own raw
    accelerometer data, with the machine off and then running.
  - For AC current sensors (type 33), it finds the current threshold by testing
    it with the machine running and stopped, then suggests one between the two.
- **Service hours:** an hours-since-service odometer with an estimated due date,
  a Service view listing what is due, and a service log.
- **Alerts:** an email and a red tile when a machine has been stopped too long,
  and an email and a badge when service is due.
- **Works with other apps and AI assistants:** publishes machine state, running
  and alert events on the gateway's app bus, offers actions other apps can
  trigger, and lets an AI assistant connected to the gateway read the floor and
  run-time history.

This is deliberately not OEE: it measures how long machines run, not
availability, performance and quality.

## Supported sensors

Type 2 (two-channel contact), 33 (AC current detect), 108 (machine uptime
monitor), 119 (machine runtime hour meter), and 123, 132 and 133 (production
counters).

## Requirements

- Atrium platform **2.7.1** or newer.
- Learning a type 33's current threshold needs platform **2.8.0**. On an older
  platform the wizard says so, and the threshold can be set by hand under
  Advanced.
- One or more of the supported sensors paired with the gateway.

## Configuration

Add each machine and bind it to one input of a sensor, then run the setup
wizard. **Settings** covers tile options, shifts, the production day, groups,
and how long before a silent sensor is reported as lost.

## Licensing

Shop Floor is **free**. No license is needed to install or use it.
