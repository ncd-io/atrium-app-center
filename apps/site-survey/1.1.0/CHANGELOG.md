# Changelog

## 1.1.0

- **RF Environment — measure the noise the site competes with.** A new **Scan
  Noise Floor** button sweeps the gateway's own DigiMesh radio and reports the
  noise floor, the loudest channel, how many channels are busy, and a
  channel-by-channel chart across the scanned range.

  A signal strength on its own does not say whether a link will work. A −80 dBm
  link against a −105 dBm noise floor has 25 dB of margin and is healthy; the
  same −80 dBm against a −85 dBm floor drops packets however the antenna is
  turned. Those two look identical in a signal reading and have completely
  different fixes, so without this an installer reorients an antenna that was
  never the problem.

  The floor is reported as the **median** channel rather than the mean or the
  minimum — DigiMesh hops across the band, so a link competes with the typical
  channel, and a mean is dragged around by a single interferer. The loudest
  channel is reported separately, because one hot channel is a different and
  often fixable problem from a raised floor.

  Each sensor also gains a **margin over noise** figure in its expanded row.
  Margin is deliberately kept out of the row's overall colour: a sensor's level
  would otherwise change the moment somebody ran an unrelated measurement, and a
  link that has not changed should not appear to have.

  **The radio cannot hear sensors while a scan runs**, so a scan is always
  started by the operator — never scheduled, and never offered as an automation
  action. The gateway refuses one while a link test is on the air.

  **Needs a platform that provides the radio noise-scan service.** Where the
  gateway does not offer it, the RF Environment panel is simply hidden and
  everything else in the app works exactly as before.
- **Link tests now honour the packet count and size** set in Survey Settings,
  instead of always testing with the platform default.
- Settings loaded from the gateway are now merged over the defaults rather than
  replacing them, so a saved payload that predates a threshold no longer leaves
  that threshold undefined — which previously painted every row red instead of
  failing visibly.

## 1.0.0

- First release. One page listing every whitelisted sensor's mesh link,
  colour-coded green / yellow / red against configurable thresholds, replacing
  the per-sensor Sensor Dashboard → View Map → Refresh Mesh Map loop. When the
  list is green the installation is done; red rows say which sensors need an
  antenna turned, a move, or a repeater.
- A **Status** column carries the whole request lifecycle — Not tested, Waiting
  for check-in, Tracing route, Link testing, Complete, Partial, Failed — so a
  queued test on a sleeping sensor is never shown as one that is on the air.
- Summary strip with Good / Marginal / Poor / Untested counts and a
  plain-language verdict; clicking a count filters the list.
- Expanding a row shows a card per link leg plus the route, and **Survey
  Settings** configures the link-test parameters and every threshold pair.
