# Mobile audio verification

Automated Chromium tests use native Web Audio with synthetic pagehide/visibility events. They verify explicit gesture unlock, one context, original/current/comparison/arpeggio, cancellation on edit/undo/reset/navigation, rapid requests, pointer cancellation, frozen-clock source disposal, and no automatic playback on return. Evidence: `../evidence/S06-resume-browser.log` and S06 JSON traces.

Actual iOS Safari and Android Chrome on physical devices, phone interruptions, screen locking, Bluetooth route changes, hardware latency and human listening: **NOT RUN**. Offline waveform tests are signal checks, not hearing or loudness measurements. Start device volume low. A device returning from interruption must require an explicit listening action; if playback fails, continue silently and offer retry.

S11 final clean also verifies native Chromium and Firefox: 74 OfflineAudioContext renders each, full 24.4s ensemble, cancellation and recovery. Windows WebKit has no native AudioContext/OfflineAudioContext APIs in this installed build; 15 audio cases are explicitly outside its execution scope. Final production 20-minute native run completed 356 cycles. These are software signal/behavior checks, not human listening or physical mobile results.
