# Auto Lubrication System — Changelog

Staged into the App Center as `apps/auto-lube/<version>/CHANGELOG.md`; the entry
for a version is what operators read on the Apps page before updating.

## 0.20.0

- **Scheduled dosing is now set in days, not hours.** Hourly dosing was far too frequent for a
  grease point, so the interval is entered as whole **days** (1–365). The value is still stored on
  the node in hours under the hood, so existing schedules keep working; the control, the current-
  schedule banner and the "next dose" countdown all read in days.

## 0.19.1

- **Simpler scheduled-dosing control.** Dropped the enable checkbox — the interval and doses fields
  are always shown. **Save schedule** turns it on (or updates it); **Cancel schedule** turns it off.

## 0.19.0

- **Scheduled dosing now counts from when you turn it on.** Previously the interval was measured
  from the node's last lube, so switching on "every 1 h" when a dose happened hours ago fired one
  immediately. Now the clock starts when you save the schedule (and resets from each scheduled dose),
  so "every 1 h" means the first dose an hour from now, then hourly. Migration 017.

## 0.18.2

- **Scheduled dosing is clearer to manage.** The *Manual control* schedule section now shows the
  **current schedule** in plain words (interval, doses, when the next dose is due, last dose) with a
  one-click **Cancel schedule** button. **Save schedule** always responds and confirms right next to
  the button, and the "next due" time now reads correctly for a future dose (no more "0s ago").

## 0.18.1

- **Scheduled dosing is easier to find.** The time-based control in *Manual control* now has its own
  heading and accent rule, and its **Save schedule** button matches the primary *Request doses* button.

## 0.18.0

- **Dose on a schedule.** *Manual control* now has **"Dose automatically on a schedule"**: set an
  interval in hours and how many doses each time, and the gateway issues the manual lube for you —
  no one has to click it. It is the ordinary manual command, just sent automatically, so it works on
  any gateway that can already send a manual lube. Use it with the node in **Manual** mode so the
  schedule is the only thing dosing.
  - Each scheduled dose still lands at the node's next report (it is asleep until then), and one
    outstanding command at a time still holds — a manual dose pushes the next scheduled one out too,
    so the two can't double up. A dispenser the last report flagged unhealthy is skipped until it
    clears. Migration 016.

## 0.17.0

- **Choose how commands reach the node.** *Settings → Command delivery* sets how manual lube
  and counter-reset commands are sent:
  - **Auto** (the default): direct first, then over the mesh if that isn't delivered.
  - **Direct only**: no route discovery. Lands in well under a second, but only reaches nodes
    within one radio hop of the gateway.
  - **Mesh only**: with route discovery. Reaches nodes behind repeaters, but finding the route
    can take longer than the node listens after a report.

  This needs a gateway that lets apps choose the delivery; on one that doesn't, the gateway's
  own default is used and the app says so. Migration 015.
- **See when each command went out.** In *Manual control*, each command now shows how long
  after the node's report (or Fly check-in) it was sent and how it was delivered (direct or
  over the mesh, and how long that took). It also shows any attempt that failed and why, and
  how long the node took to send its lube report, e.g. *"sent 0.20 s after the report ·
  delivered direct in 0.27 s · lube report 3.95 s later"*.

## 0.16.7

- **"Doses delivered" at the bottom of the node page is now "Lubrication log".** It lists
  every dose the node reported (automatic, scheduled and manual), unlike *Manual control*,
  which lists only the requests made from the app. The *Doses delivered* chart keeps its
  name.

## 0.16.6

- **Pending settings are marked in place.** A setting you changed that the node hasn't
  applied yet now shows a yellow hourglass next to its name, with the value you asked
  for already in the field. Hover the hourglass for the current and new values and when
  you asked. It disappears once the node applies the change. This replaces the "changes
  waiting for delivery" banner.

## 0.16.5

- **A newly added node shows its settings straight away.** Its report interval, baseline
  and lubrication settings are now copied from the gateway as soon as the node is added
  (or re-enabled). Before, that waited for the next 5-minute sweep. Until then, the node
  page showed no report interval and the node's state stayed unknown.

## 0.16.4

- **Colour-coded lube outcomes.** In *Manual control*, each command's outcome is
  **yellow** while it's queued or on its way to the node, **red** if anything went
  wrong (not delivered, expired, a dispenser fault, or fewer doses than requested), and
  **green** only when the node confirms every dose with a healthy dispenser.

## 0.16.3

- **Dispenser status now works with the sensor library of 2026-10-15.** That library
  reports the dispenser as `healthy`, `lube_empty`, `powered_off` or `error_undefined`,
  and the app shows them as *Healthy*, *Cartridge empty* and *Dispenser fault* (no
  signal, or an undefined combination). 0.16.2 tried to read the raw frame instead, but
  the gateway removes it before apps see it, so an empty cartridge still showed as
  healthy.

## 0.16.2

- **The dispenser's real status after every lube.** The app now reads the dispenser's
  two status lines straight from the node's lube report and says what they mean:
  *Healthy*, *Cartridge empty* (both lines high), or *Dispenser fault* (no signal, or
  an undefined combination). Before this, the sensor library reported an empty
  cartridge as **healthy**. A fault stops the rest of the burst, so a manual lube now
  says why, e.g. "Requested 1 dose(s), 0 completed — stopped: Lubricant container
  empty". It no longer just says "burst cut short". Migration 014.
- **Fixed: lube commands failed by mistake.** The "no lube report followed" check from
  0.16.1 counted 10 minutes from when the lube was *requested*. A command retried for a
  while then got marked failed while it was still being sent. It now counts from when
  the node's radio confirmed delivery.
- A queued command shows why it's waiting when an attempt didn't land.

## 0.16.1

- **Manual lube and counter-reset commands also go out at the node's Fly check-in,**
  the one moment it's sure to be listening. Before, they went out only just after a
  report. A node on a fast report rate goes straight back to sleep after each report,
  so those commands kept failing with "Control response timeout" and retrying.
  Whichever chance comes first sends the command, and it is only ever sent once.
- **Fixed: stale commands are closed out again.** A SQL error in the expiry sweep
  ("command expiry error" in the log) meant that a lube command the node received
  but never acted on stayed "sent" indefinitely, and that counter resets with no lube
  report after a week stayed open. Both now close as described in 0.13.0.

## 0.16.0

- **Kurtosis, and "Damage suspected".** The node now reports kurtosis, a measure of how
  impulsive the ultrasound signal is. In Auto mode, when the level is above the trigger
  **and** kurtosis is above the node's kurtosis baseline + margin, the rise is impulsive
  (impacts, spalling): damage rather than a lack of grease. The node doesn't lubricate
  it. The app now shows that as **Damage suspected** and raises a critical *Possible
  machine damage* alert, instead of *Elevated*.
- **Kurtosis on the node page:** a Kurtosis tile with the node's limit, and a Kurtosis
  metric on the history chart with the limit drawn as a line. The dose-response details
  also show how kurtosis changed after each dose.
- **Filter mode.** *Lubrication settings* has a new **Filter mode** setting: the band the
  ultrasound sensor listens in (8–32, 10–32 or 12–32 kHz). Needs the sensor library of
  2026-10-10 or later.
- **Temperature reads correctly again** (with the matching sensor library), after two
  firmware layout changes moved it around.
- **Note:** the node currently reports kurtosis as **0**, which isn't a possible value
  (kurtosis is at least 1). The dashboard shows the value as sent and says so, but the
  damage check and the dose response ignore a 0 and fall back to the level alone, until
  the firmware sends real values.

## 0.15.0

For the luber firmware's payload update (October 2026). **The gateway's sensor library must
be updated at the same time**: an older library misreads every report from the updated
firmware.

- **Lubrication mode.** The *Automatic lubrication* on/off switch is replaced by a **Mode**
  setting, matching the firmware:
  - **Auto** doses when the ultrasound level rises above the trigger.
  - **Time** doses on the node's own schedule.
  - **Manual** never doses on its own.

  The app shows a node in Manual mode as *Manual mode* and one in Time mode as *Scheduled*.
  Only in Auto mode is the level judged against the trigger. Existing settings carry
  across: on became Auto, off became Manual.
- **Scheduled doses.** Lube reports now say which mode the node was in, so doses made by Time
  mode are tagged *Scheduled* in the history, alongside *Automatic* and *Manual*. Scheduled
  doses don't count towards Auto mode's consecutive-lube limit.
- **Settings renamed and added:** *Threshold above baseline* is now **Delta above baseline**,
  the firmware's own name. There's a new **Fly timeout** (1–10 s): how long the node listens
  for commands and settings after each report.
- **New report field.** The node's report now carries a `lube_cycles` value. It's stored
  and available on the history chart as *Lube cycles (report field)*. The app doesn't act on
  it until its meaning is confirmed.
- **Known issue at the time:** temperature read close to 0 °C. It turned out to be kurtosis
  being read as temperature, and was fixed in 0.16.0 with the matching sensor library.

## 0.14.0

Two tools against over-greasing, which damages a bearing as surely as starving it.

- **Dose response, for every dose.** The node's dose history has a new *Response*
  column comparing the ultrasound level just before each dose with the level once the
  grease has worked in (20 minutes or more after it):
  - *Level fell*: the dose was needed and it helped.
  - *No change*: no measurable change (single reports wobble by about 1 dBµV, so a
    change has to be at least 2 dBµV to count).
  - *Level rose*: the level went **up** after greasing, the signature of over-greasing.
    The row also flags it when the temperature rose at the same time, which makes it
    more likely.
  - *Measuring…*: the dose is less than 20 minutes old.
- **Dose budget and alert.** Set a maximum number of doses per 24 hours, as an app-wide
  default in *Settings* and per node under *Edit details* (size it to the bearing).
  When a node delivers more than that in a rolling 24 hours, manual doses included, the
  app raises *Dosing above budget*. The alert clears by itself once it's back under.
  The node's dose tile shows doses in the last 24 hours against the budget. There's no
  budget until you set one.

## 0.13.1

- **"Lifetime doses: -1" is now shown as "Not set".** A node whose dose counter
  has never been started reports it as all ones, which the gateway's sensor library
  currently turns into -1. The app now recognises it, says the counter is not set,
  and keeps it off the dose and lubricant charts. Values already stored as -1 are
  cleared on upgrade.
- **Record a cartridge before the node has a dose count.** It's saved straight away
  as *waiting for the node's dose count*, and measuring starts from the first count
  the node reports. Nothing is estimated before then.
- **Lubricant remaining starts at full.** Each cartridge now appears on the chart at
  100% at the moment it was fitted, so a newly recorded cartridge shows up straight
  away instead of leaving the chart blank.
- **Zoom on every chart.** Drag across the ultrasound, dose or lubricant chart to zoom
  into that span; the chart re-fetches it at full detail, so a 90-day view zoomed to an
  afternoon shows the individual readings. *Reset zoom* returns to the range.
- **Reset the dose counter from the app.** *Lubrication settings* has a *Reset dose
  counter* action (firmware 3 command `0x5B`). It's highlighted when the counter isn't
  set, and on a working node it asks you to confirm first, because it erases the
  node's lifetime count. The node confirms the reset in its next lube report.

## 0.13.0

**For luber firmware 3. Nodes on firmware 1–2 are no longer decoded.** A node still
on old firmware shows as "firmware N is not supported" until it's updated.

- **Readings in dBµV.** Each report now shows the ultrasound RMS, peak and
  peak-to-peak levels (in dBµV and µV), crest factor, temperature and the three
  strongest frequencies. All of them are available on the node's history chart.
  The 4–20 mA loop readings (dB, mA) are gone with the old firmware.
- **Lubrication judged against the node's own baseline.** Firmware 3 decides to
  lubricate when the level rises a set amount above a baseline. The app shows each
  node as *Normal*, *Elevated* (it should be lubricating), *Not responding* (still
  elevated after the allowed number of automatic lubes in a row), or *Auto lube off*.
  The chart draws the baseline and the trigger level.
- **New settings.** The settings panel now has the baseline, the trigger threshold, the
  consecutive-lube limit, dose on-time, the kurtosis settings, the deadband, and an
  on/off switch for automatic lubrication. The deadband is in mg. The values shown for the
  threshold, the auto-lube switch and the deadband need the gateway's sensor library from
  2026-10-03 or later; older libraries read them from the wrong bytes.
- **Commissioning captures a dBµV baseline** and suggests it as the node's
  baseline setting.
- **Dispenser health comes from the lube report.** Firmware 3 reports the dispenser
  as healthy or not healthy and no longer separates an empty cartridge from a wiring
  fault, so the app's wording covers both.
- **Manual lube uses the new firmware-3 command.** The *reset attempt counter*
  control is gone, because firmware 3 has no such command. A *Not responding* node
  clears when its level comes back down.
- **Alerts:** *Lubrication not helping*, *Dispenser not healthy*, *Sensor has no
  signal*, *Node offline* and *Cartridge running low*. Alerts that only applied to
  the old firmware (loop broken, hearing nothing, too noisy, out of tries, cartridge
  empty) are no longer raised.
- **Automations:** `node.health` now carries `dbuv` and `temperature_c` instead of
  `db`. Its `lubrication_state`, `dispenser_status` and `reading_fault` values have
  changed to match firmware 3, so check any automation that matches on them.

## 0.12.0

- **Ask an AI assistant about your lubrication fleet.** On a gateway running
  platform 2.6.0 or later, an assistant connected over MCP (with a token granted
  the **Apps data** scope) can now read this app's own view of the fleet rather
  than guessing from raw telemetry: every node's status and cartridge level; how
  a node is set up, including the commissioning baseline, the thresholds it
  holds and whether IMPULSE mode was confirmed; day-by-day ultrasound and doses
  delivered; when the fitted cartridge will run dry; and which alerts are open
  and whether their emails went out. Those answers use *your* thresholds,
  cartridge records and alert rules. Nothing is exposed unless the operator
  grants the scope, and on an older gateway the app works exactly as before.

- **Automations that stay on as things get worse.** The `node.health` and
  `cartridge.level` events gain four yes/no fields meant for automation
  conditions: `attention_or_worse` and `fault_or_worse`, and `warn_breached` and
  `critical_breached`. A condition such as *status is attention* stops matching
  the moment a node escalates to fault, which switched the automation off just
  as the problem deepened; these fields stay "true" through an escalation.
  An offline node counts as a fault, because a node that has stopped reporting
  cannot be confirmed to be lubricating. Existing automations are unaffected —
  switch them to the new fields to get the new behaviour.

- **Removing a node now releases automations on its cartridge.** Removing a
  node already told automations its health was "disabled"; it now also closes
  out its cartridge level (reported as `unknown`), so an automation watching a
  low cartridge cannot stay latched on a node that is no longer managed.

## 0.11.0

- **Lubricant remaining chart.** Under the dose chart on each node's page: the
  percent of lubricant left over time, replayed from the node's dose counter
  against your cartridge service history, with a projected run-out date for
  the cartridge fitted now.

## 0.10.0

- **Longer chart ranges.** Both node charts gain 30-day, 90-day and All ranges.
  Long ranges are condensed on the gateway rather than cut short, so the newest
  readings are always shown. "All" means everything the gateway still keeps,
  which is bounded by its telemetry retention setting.

## 0.9.x

- Publishes `node.health` and `cartridge.level` on the inter-app bus, so an
  operator can wire lubrication state into automations on the Automations page.
- The manual-lube cooldown is timed by the gateway's clock rather than the
  browser's.
