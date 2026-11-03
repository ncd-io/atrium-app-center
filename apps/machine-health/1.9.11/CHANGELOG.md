# Changelog

## 1.9.11

- **Installs on a container deployment.** AssetPulse can now be installed on
  Atrium running in a container, as well as on the EG5120. It remains
  unavailable on the EG5100.
- **AssetPulse is free.** No license is needed to install or use it; this has
  been true since 1.8.0 and is the first App Center release to reflect it.
- Severity's machine-off floor is now learned from line velocity, the same
  measure severity is scored on, so the gap between line and ISO overall
  velocity (mostly the sensor's own electronics) is no longer read as a fault.

## 1.9.10

- **Captures can be held out of a monitoring point's machine-off reference.** The
  reference is what sub-synchronous findings are judged against, so anything
  wrong in it suppresses real findings as "ambient" — the opposite of what it is
  for. The engine already refuses captures it can recognise as unsuitable (a
  machine that was actually running, or one whose sensor had filtering
  disabled), but some it cannot: a capture taken with the sensor unmounted looks
  exactly like a normal quiet one. There is now an exclusion list for those.
- Unusually loud captures are dropped from the reference automatically, so a
  passing forklift does not raise the floor for every later reading.
- Requires Atrium 2.6.12.

## 1.9.9

- **The ISO velocity now says how much of it is the machine.** Double
  integration weights low frequencies heavily, so site vibration below about
  25 Hz can dominate the figure on a quiet machine — on the bench rig the same
  band reads 1.0-1.9 mm/s with the motor stopped. Each assessment now reports
  the velocity split into shaft-synchronous and non-synchronous, and where the
  point has learned a machine-off floor, the ISO term is flagged when the
  running reading does not stand clear of it. Nothing is subtracted: the
  reading is what it is, and the zone is unchanged. What changes is that a
  reading dominated by the site is no longer presented as machine condition.
- The report writer is told what the split means, so it stops reading a zone as
  machine condition when most of the energy is not the machine.
- Requires Atrium 2.6.11.

## 1.9.8

- **The machine-off reference now has to span time.** It was a median over the
  most recent stopped captures, which on a shop floor describes whichever few
  minutes those captures happened to cover. Ambient here moved by nearly 2x
  within two hours, and low-frequency content that dominated one morning was
  gone by that evening — so a genuine-looking peak cleared an afternoon-only
  reference that a full-day reference suppresses. Stopped captures are now
  spread across the retention window, the reference is the 85th percentile
  rather than the middle, and one spanning less than four hours is not trusted.
- Every finding judged against the reference says how many captures it rests on
  and how long they span.
- Requires Atrium 2.6.10.

## 1.9.7

- **Learns what the room is doing, so the room stops being diagnosed.** A
  bearing that is not turning has no cage frequency, yet captures taken with the
  motor stopped were reporting a "6203 FTF" peak at 18.3 Hz — ambient building
  vibration handed a bearing's name. Captures where the machine is detected as
  stopped now contribute a low-band ambient profile for that monitoring point,
  and anything found below running speed must stand clear of it before it can
  count toward severity. Where a point has no stopped captures yet the gate
  cannot be evaluated, and affected findings are reported as ambiguous rather
  than counted — an unanswerable question is not a pass.
- Requires Atrium 2.6.9. On an older platform the profile is simply unused.

## 1.9.6

- **The AI report is told what the engine's severity is made of.** The engine no
  longer derives severity from the ISO zone alone (Atrium 2.6.8), so the prompt
  no longer describes it as "the ISO 10816 velocity severity" — it now reads the
  new `severity_terms` block, which lists every term and what each contributed,
  including the ones that contributed nothing. Where the sensor's low-pass
  filter truncated the velocity band, the ISO term carries a caveat saying so,
  and the model is instructed to weigh the spectral evidence above the zone in
  that case.

## 1.9.5

- **Fixes 1.9.4 on the gateway.** The filter cutoff was read for every capture
  and always came back empty, so analysis kept reporting half the sample rate as
  usable bandwidth exactly as before. The lookup needed the sensor id and the
  query feeding it did not return one. A failed lookup is now logged rather than
  silently treated as "this sensor has no filter configured" — the two are not
  the same, and conflating them is what hid this.

## 1.9.4

- **Analysis now knows where the sensor's low-pass filter sits.** AssetPulse
  reads the sensor's reported filter setting and passes the real cutoff to the
  analysis, which previously assumed usable bandwidth ran to half the sample
  rate. On the default filter coefficient the true cutoff is a quarter of the
  sample rate — half what was assumed — so the spectrum between the two was
  filter roll-off being presented as signal.

  Most visible where it matters: if your sensor filters below 1000 Hz, the ISO
  10816 velocity band is truncated and the zone reads healthier than the machine
  is. The assessment now says so instead of reporting the zone as if it were a
  compliant measurement.

  The cutoff is worked out from each capture's **measured** sample rate rather
  than the configured one, because a sensor keeps running its old settings until
  its next sync — which can be hours after you change them.

  **Needs platform 2.6.4.** On an older gateway the setting is read but ignored.

## 1.9.3

- **You can now clear a monitoring point's vibration baseline.** Each point
  learns a healthy reference from its first few captures and then freezes it,
  grading everything afterwards against that figure. Freezing is what makes a
  rising trend meaningful — and it is also why clearing needs to be possible.
  The reference is a vibration amplitude, so anything that changes what the
  sensor measures invalidates it without the machine having changed: a new
  full-scale range, a different output data rate, re-mounting the sensor, or
  simply having learned the reference while the machine was not running
  normally.

  Until now the only way out was deleting the monitoring point, which threw away
  its captures and alarm limits too. **Asset → Setup → Vibration Baselines**
  shows each point's state — established, still learning, or not started — with
  a Clear button per point and a Clear all for the sensor-settings case. The
  point relearns from its next captures.

  Clearing affects future captures; the asset keeps showing its last
  "vs. baseline" figure until the next one is analysed.

## 1.9.2

- **The per-capture fault list is gone.** It came from a heuristic detector
  whose confidences were not meaningful — on a healthy benchtop rig it reported
  nine simultaneous faults at 75–100%, identically at two different shaft
  speeds. AssetPulse already excluded it from the severity score and stripped it
  out of the AI report prompt; it is now gone from the app's data as well, and
  the app no longer writes it back to the platform.

  Nothing is lost. The asset's severity band, its ISO 10816 zone, the kinematic
  diagnoses and the AI assessment were always the real analysis, and they were
  being crowded out by a list of confident-looking findings that nothing in the
  product actually believed.

  **Needs platform 2.6.2** to disappear everywhere: on an older gateway the
  sensor page keeps its own Detected Faults card, which AssetPulse cannot reach.

## 1.9.1

- **Adding a component to an existing asset duplicated the rest of the
  drivetrain.** Reported from the field: an assistant adding a fan to a
  configured machine ended up with a second copy of every component after it.
  A component was being recognised by its *position* in the chain, so inserting
  anything shifted everything downstream and none of it matched what was already
  there — so it was all added again.

  A component is now recognised by identity instead: by `component_id` if the
  caller supplies one (read back from the asset's setup, which is the exact and
  preferred way), otherwise by its type and name, otherwise by type in order.
  Inserting or re-ordering is now safe.

- **Re-ordering the drivetrain silently did nothing.** The same code never
  wrote the new order back, so a re-sent chain kept its old sequence. It now
  re-orders as sent. A component you leave out of the chain is still kept — it
  is moved to the end and reported back to the caller rather than being deleted.

## 1.9.0

- **An assistant can now read the prompt behind a health report, and write the
  guidance that shapes the next one.** Two reads and one write:

  - **Read the exact prompt.** The verbatim `system` and `user` text AssetPulse
    sends to your AI provider for one monitoring point — the cleaned evidence,
    the drivetrain and bearing context, the machine-off guidance, your own
    clauses, and the required output contract, in the order the model receives
    them. When a report says something you disagree with, this is how you find
    out what it was actually told. Defaults to the latest assessment; an older
    one can be inspected by id.
  - **Read the clause library.** Every guidance clause on the gateway with its
    content and enabled flag, plus which ones apply to a given asset, in the
    order they reach the model.
  - **Write a clause.** Create or update a clause and attach it to an asset in
    one call. Clauses are identified by **name**, so re-sending a name updates
    that clause — including for every other asset already using it, since the
    library is shared. Detaching and disabling are both supported, and they are
    different: a detached clause stops applying to that asset, a disabled one
    stays attached everywhere but is skipped when any prompt is built.

  The loop this closes: read the prompt behind a report the customer disputed,
  see what context was missing, write it in, and every future report on that
  machine has it. Writing needs the **apps:actions** scope on the API token, and
  every write is recorded in the gateway's app audit log.

## 1.8.2

- **Delete asset, and three other delete buttons, did nothing when clicked.**
  AssetPulse's UI runs inside a sandboxed frame, and browsers refuse the native
  confirmation pop-up there — it reports "cancelled" without ever asking you.
  Every one of these buttons treated that as "the user said no" and quietly did
  nothing, with no error and nothing in the logs. Affected **Delete asset**
  (Setup tab), **Remove** on a monitoring point, **Delete** on a drivetrain
  component, and **Delete** on an AI report clause.

  All four now confirm inline — the button turns into "Yes, delete" / "Cancel"
  in place — so you can see what you are confirming and the action actually
  runs. Nothing else about what they delete has changed.

## 1.8.1

- **The asset-creation call is now fully described to an assistant.** On a
  gateway running platform 2.6.1 or later, AssetPulse hands the assistant a
  complete description of what "create an asset" takes — every field, which
  values are allowed, the drivetrain list and the bearing block inside it. Before
  this the assistant was told only that the call takes "an asset specification"
  and had to work out the rest from prose, which it usually got right and
  occasionally did not. A call that does not fit is now refused by the gateway
  before AssetPulse sees it, with a message saying which field was wrong.

  No change on a 2.6.0 gateway: the description is simply ignored there and
  setup works exactly as it did in 1.8.0.

## 1.8.0

- **AssetPulse is now free.** The app no longer requires a license. Updating to
  this version unlocks it on any gateway it is installed on — nothing to enter,
  nothing to activate, and existing licenses simply stop being consulted. Its
  AI-agent reads become visible too: an unlicensed app's API answers 402, so a
  gateway that had AssetPulse locked was not offering any of its tools to a
  connected assistant at all.
- **An AI assistant can now set an asset up, not just read one.** Connected over
  MCP, an assistant can be told about a machine in conversation — or shown a
  photo of its nameplate — and turn that into a configured, monitored asset.
  Three new reads and two new writes make that possible:

  - **Read: how to describe a machine.** Every value AssetPulse accepts — machine
    types, ISO machine groups with their velocity zones, power bands, mount
    locations, the drivetrain component types and the parameters each one
    contributes to fault-frequency calculation — plus a worked example. These
    used to exist only as dropdowns in the setup wizard, which is no help to
    something with no dropdowns.
  - **Read: which sensors are available.** Every whitelisted vibration sensor and
    which monitoring points already claim it, including per-probe, so a
    dual-probe sensor with one side spare reads as exactly that.
  - **Read: bearing lookup.** Resolve a bearing part number to its geometry and
    its BPFI/BPFO/BSF/FTF fault orders, straight from a nameplate or a parts
    list.
  - **Write: create or update an asset.** One call takes the whole machine — the
    drivetrain in running order, the sensors watching it, the bearings under
    them. Assets are matched **by name**, so re-sending the same description
    updates that machine rather than creating a second one, and it never deletes:
    anything already on the asset that the description does not mention is left
    alone, so a learned vibration baseline or a threshold you tuned survives.
  - **Write: seed ISO alarm limits.** Puts the Warning and Critical velocity
    limits implied by the asset's ISO 10816 machine group on all of its
    monitoring points at once, using the same zone boundaries the severity engine
    grades captures against. Limits you have already set are skipped, not
    overwritten.

  Both writes need the **apps:actions** scope on the API token, which an operator
  grants deliberately when issuing it; every call is recorded in the gateway's
  app audit log. Without that scope an assistant can still read everything above
  and tell you what it would create.
- **Bearing lookup now resolves sealed and shielded part numbers.** "6205-2RS"
  and "6205-2Z" — the two commonest suffixes on a real parts list — were
  returning no match where the plain "6205Z" form worked, because the trailing
  digit in "2RS" was being read as part of the bearing number.

## 1.7.0

- **Route AI reports through a company AI proxy.** AI Reports settings now starts
  with a **Connection** choice: *Direct to AI provider*, or *Through an AI proxy
  (AI gateway)* — for sites whose policy is that all AI traffic goes through an
  approved gateway. Choosing the proxy asks for its base URL, which API it
  presents (OpenAI Responses, OpenAI Chat Completions or Anthropic Messages), the
  model route your proxy administrator gave you, and the proxy's own token. Any
  extra headers live under **Advanced**. Tested end to end against TrueFoundry.

  The key field is the **proxy's** token, not the model vendor's — the proxy holds
  the vendor credential. It is still encrypted on this gateway and never
  displayed again, outbound calls still follow the gateway's proxy settings, and
  nothing about what is sent changes: structured evidence only, never raw
  waveforms.

  **Needs a platform that supports it**; on an older gateway the Connection choice
  isn't offered and AssetPulse works exactly as before.
- Reports now ask the provider for strict JSON output where the API supports it,
  so fewer responses need the lenient repair pass.
- **Test connection** now saves the form before testing, so it exercises what is
  on screen rather than the last-saved settings. It also allows the model a longer
  reply — a reasoning model spent the previous 5-token cap thinking and returned
  nothing, which read as a failed connection on a working setup.

## 1.6.0

- **AI-agent access to asset setup and alarm limits.** An assistant connected to
  the gateway over MCP can now read how your machines are configured, not just
  what AssetPulse concluded about them. Three reads are declared: the asset
  roster, one asset's **mechanical setup** — the drivetrain in running order with
  each component's parameters, every monitoring point's mounting and axis
  orientation, and each bearing's part number, geometry and BPFI/BPFO/BSF/FTF
  fault orders — and one asset's **telemetry alarm thresholds** with the notify
  and waveform actions each level performs — **including thresholds you have
  switched off**, which the Telemetry view hides. A limit that is configured but
  disabled fires nothing, and an agent reporting that is more use than one that
  sees an empty list.

  This is the interpretation context vibration data needs: bearing fault orders
  and shaft speed are what turn a peak frequency into a named fault. Until now an
  agent could see AssetPulse's alerts and assessments but nothing about the
  machine behind them, so it could not check its own reasoning against the setup
  you entered.

  Two new routes serve these: `GET /asset-setup/:asset_id`, which returns
  configuration only — no captures, assessments, reports or alerts — so reading
  it stays cheap, and `GET /asset-alarms/:asset_id`, which reports every
  threshold on an asset with its enabled flag and per-level actions.

  **Nothing is exposed until you allow it.** The reads are reachable only by an
  API token or connected app you grant the **App data** (`apps:data`) scope, on a
  gateway running platform **2.6.0 or newer**. On an older gateway this release
  behaves exactly like 1.5.1.

- **New automation action: Set a telemetry alarm threshold.** AssetPulse now
  offers `thresholds.set` alongside Capture Waveform, Acknowledge Alerts and
  Send Health Email — so an alarm limit can be wired to something else happening
  on the gateway, or set by an assistant that has just read the current limits.
  It sets one metric's Warning and Critical levels on one monitoring point, and
  what each level does when it fires.

  Absolute, like every AssetPulse action: it writes the values given rather than
  nudging them, so an automation re-asserted after a reboot lands on the same
  configuration. Leaving a level empty clears it, so a critical-only alarm is
  just critical with warning blank. Omitting one of the notify or waveform flags
  keeps its current setting, so saving values alone never switches off an action
  already attached to a level. Setting Critical below Warning is refused —
  alerts fire at the highest breached level, so the warning level would never
  fire on its own.

  The Automations action list and the Telemetry view's threshold editor now save
  through the same code, so the two cannot drift on what any of that means.

## 1.5.0

- **Download Waveform on the Health tab** — next to **View Waveform**, and in
  the waveform window itself. Downloads the capture being viewed as a single
  `.zip`: the raw time-domain samples as CSV (`time_s, x_g, y_g, z_g`) plus a
  JSON sidecar with the asset, drivetrain, sensor, bearing and capture context
  needed to analyse it in another tool. Stepping through history with Older /
  Newer moves the download with it, so a past capture no longer has to be
  reached through the per-point card to be exported.

## 1.4.0

- **Step through waveform history** — the View Waveform window now has
  **‹ Older** / **Newer ›** buttons, so adjacent captures can be compared
  without closing the window, clicking the neighbouring dot on the Severity
  Trend, and reopening. The buttons walk the same captures those dots
  represent, skipping any without a stored waveform, and grey out at the oldest
  and newest ones. Stepping also moves the selected point on the Severity
  Trend, so the assessment behind the window stays on the capture being viewed.
  The chosen metric, traces and frequency zoom carry across each step — which
  is what makes two captures actually comparable.

## 1.3.0

**Requires gateway platform 2.4.0 or newer.** AssetPulse 1.3.0 will not install
on an older gateway — stay on 1.2.0 until the gateway is updated.

### Automations (inter-app bus)

AssetPulse can now take part in gateway automations, in both directions. It
publishes what it knows and exposes things it can do; you connect them to the
rest of the gateway on the **Automations** page. AssetPulse never talks to
another app directly — every crossing is a binding you create.

**Publishes (use as a "When"):**

- **Metric crossed a threshold** — where one metric on one monitoring point
  stands against its Warning / Critical thresholds. Match on `warning_breached`
  / `critical_breached` for "at this level or worse" — they stay true as a
  reading escalates, so an automation holds instead of releasing when the machine
  gets worse. `metric_state` gives one band exclusively when that's what you
  want. Tracked separately per monitoring point and metric.
- **Asset health changed** — an asset's severity band, running state, open
  alert count, and the latest AI assessment text and recommended action. Tracked
  per asset.

**Can do (use as a "Then"):**

- **Capture a vibration waveform** — request a raw capture from a monitoring
  point now. It runs through the severity engine like any other capture, so the
  asset's health is re-evaluated from it.
- **Acknowledge threshold alerts** — clear an asset's open alerts, optionally
  only Warning or only Critical.
- **Send asset health email** — send an asset's configured email now, using its
  own recipients, templates and latest AI report. Recorded in the asset's
  notification history.

State is republished periodically, so an automation reconciles on its own after
a gateway restart or a dropped message rather than staying stuck.

### Also

- **Settings → Automations** — a new card listing everything AssetPulse offers
  the bus, plus each asset's currently published health.
- Deleting an asset or monitoring point, or switching a threshold off, now
  clears its automation state instead of leaving an automation latched on
  something that no longer exists.

## 1.2.0

- **MQTT publishing** — publish Summary, Waveform, AI Report and Alert streams
  to the gateway's shared MQTT broker, with per-stream topic templates using the
  `::Token::` convention. Configure under **Settings → MQTT**. Requires the
  operator to grant AssetPulse in the gateway's MQTT Client settings.
- **AI settings** — added a connection **Test** button and **Clear key**.

## 1.1.1

- Overview refreshes in place instead of reloading the view.

## 1.1.0

- Compatibility with the sandboxed app host and scoped per-app tokens.
