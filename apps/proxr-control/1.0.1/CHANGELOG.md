# Changelog

## 1.0.1

**Fixed — schedules could stop firing until the ingest service restarted.**

A schedule's in-flight guard could be stranded on a stale object. While a
scheduled command was in flight, the 15-second controller/schedule reload
rebuilt each schedule entry as a new object and copied the `running` flag
forward; the command's completion handler then cleared the flag on the old
object that had already been replaced. The schedule was skipped from then on,
and every later reload copied the stuck flag forward again — only restarting
`atrium-ingest` cleared it.

Schedule entries are now updated in place, so the in-flight guard is always set
and cleared on the same object the scheduler reads.

Any schedule whose command overlapped a reload could be affected; longer-running
sequences were the most exposed. Schedules an exact multiple of 15 seconds apart
shared the same timer phase and so could stick within a short span of each other.

## 1.0.0

Initial release.
