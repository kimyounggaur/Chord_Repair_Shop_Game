# Audio contract

S05 implemented 2026-10-19 against design 9.3, 10.1–10.2, 10.4–10.5, 13.1 and promptpack S05. S06 transport integration is a separate stage. Audio owns no learning state, grading answer, content Order, or persistence record.

## Engine and app integration

Construct one `AudioService` outside React render. Its constructor creates no AudioContext. Call `enable()` or `previewNote(midi)` from an explicit user gesture. `enable()` returns a Promise<boolean> indicating the context is running and the request is still current, never proof that a person heard sound. Browser unsupported and resume rejection remain visible and leave visual learning possible.

Stable arrow methods: `previewNote`, `stopAll`, `status`, `message`, `getSnapshot`, `subscribe`, `setVolume`, `setMuted`, `getDiagnostics`. `enable()` must be called with its instance or a bound wrapper. `subscribe(listener)` returns an idempotent unsubscribe and `getSnapshot()` returns an immutable stable snapshot until a field changes. Snapshot fields are `{phase,message,volume,muted,generation}`. The root app syncs only volume/mute settings and owns UI rerendering and session SET_AUDIO. A stable services adapter prevents effect cleanup on every render.

`DEFAULT_SETTINGS.volume` has been corrected by the session owner to `.35`. User volume is applied once at the mixer master, not multiplied by another `.35`. Setting preferences or subscribing never creates/resumes a context. Mute is a separate ramp to zero. Explicit engine `dispose()` removes nodes/listeners/subscribers and closes its live owned context. React StrictMode listener cleanup must unsubscribe/unbind rather than permanently dispose the shared service.

`getDiagnostics()` is read-only and contains phase/currentTime/generation, musicalVoices, peakVoices, contextCreations, cumulative scheduledEvents, pendingRequests, listenerBindings, subscriptions, fallback, volume/muted and contextState. Counts contain no learning records or device identifier. The optional diagnostic latency getter is not a hardware latency measurement. No production debug UI or network reporting is added.

## Synthesis and node lifetime

Config version 1: reference amplitudes `[1,.18,.08]`, attack `.008`, decay `.070`, sustain `.55`, release `.120`, standard gate `.9`, initial master `.35`. Frequency calls S01 `midiToFrequency`; Nyquist-or-higher harmonics are omitted and the remaining amplitudes sum to one. A musical voice is one note containing its complete harmonic source group. Partial oscillators do not count as independent musical voices.

The current conservative mixer choice is a fixed `.8 / 24` peak scale per normalized voice. This reserves headroom for the maximum 24 registered voices, including scheduled and fading voices, and keeps original/current gain identical without occupancy pumping. It differs from the optional dynamic-reservation proposal in the preparation document. With user master at most one, the analytic triangle-inequality bound is `.8` (−1.938 dBFS); actual offline worst peak was below this. This intentionally prioritizes a simple gain invariant. Perceived loudness is unverified and should be checked at low device volume. The `.35` value is not an acoustic safety guarantee.

Each replay allocates new Oscillator/Gain nodes and starts each source exactly once at absolute AudioContext time. Natural end disconnects all partial sources/gains and removes the voice after all partials end. Preview starts at currentTime + `.020`, gate `.350`, release `.120`; a missing pointerup cannot sustain it. S11 moved the lead from10ms to20ms within the design's5–20ms range after reproducing loss across a16ms clock step. An already running context schedules synchronously; a late rejected preview displays a retry notice and never replays a stale queue. Finite/nonnegative validation rejects invalid durations and note metadata before nodes are created.

Native cancelAndHoldAtTime is feature detected. The fallback evaluates the tracked ADSR or current cancellation ramp, cancels future automation, holds that value, then ramps linearly to zero. A shorter repeated stop must evaluate the existing fade rather than the original ADSR. No exponential ramp to zero is used. Future sources stop before their scheduled start and are disconnected; duplicate stop/dispose is safe.

## Groups, priority and cancellation

`NoteEvent` fields: `{id,groupId,midi,at,gate,velocity,priority,generation,timbre?}`. IDs must be unique in a submitted batch and not reuse an active ID. `scheduleGroup(events)` validates the full group before creating nodes. Every event is immutable and carries current generation. No hidden target chord is accepted by any engine API.

Priority is compare > normal/ensemble > preview. Groups are all-or-nothing. At the 24 voice cap, older preview voices are eligible for 8 ms eviction; a comparison voice is never partially stolen to admit lower-priority sound. Fading voices remain counted until ended. Pending incoming groups have no nodes yet. A group that is predictably earlier than the required eviction completion returns false synchronously. If browser callback delay makes an accepted pending group late, the engine stops and reports paused/retry rather than silently dropping it or bursting late notes. A caller must handle false as failed admission.

`stopAll()` increments generation, clears pending admission, cancels future sources, fades active voices in 10 ms and updates status. `cancelGeneration(generation, fade)` can cancel a specific generation. Pending resume promises are shared but every request rechecks generation/visibility/running state before scheduling. Context closed requires a new explicit enable input; returning to a page does not automatically resume.

S06 owns comparison timing, full transport priority, scheduler, hidden/pagehide save bridge and lifecycle listeners. The engine already exposes `pause()`, `returned()`, `finish(generation)`, clock/timer injection and status hooks for that integration.

## Actual S05 evidence

- Engine tests cover config/frequency/Nyquist/envelope/invalid duration, registry/partial cleanup, stop idempotence, preview automatic end, group cap/priority/admission deadline, independent clocks, volume native/fallback, lazy singleton/subscription lifecycle, resume token/reject, closed context, sine fallback, pause failure and dispose close.
- `tests/e2e/audio-engine.spec.ts` runs the real voice and mixer factories inside browser OfflineAudioContext. Chromium 156.0.8078.4 executed 62 renders at 44.1/48 kHz, .35/1 master, six triads, 24 aligned notes, mute/volume-zero and frequency/harmonic checks. Worst observed peak −2.3035876198 dBFS; maximum MIDI60–74 frequency error .000087 Hz. This is numerical software output evidence.
- Actual browser clicks requested C4/E♭4/E4/G4. The single context stayed at one creation, each musical voice returned to zero, and dispose cleared listeners. No human listening, physical mobile device, acoustic output safety, external latency or Bluetooth claim follows from these checks.
- Detailed command results and limitations are in `handoffs/S05.md`. Intermediate harness navigation failure is retained; same-origin isolated harness rerun passed.
