# Storage contract v1

`chord-repair-shop`, IndexedDB1, stores `meta/profile`, `settings/main`, `attempts/attemptId`, `progress/orderId`, `draft/active`, `backup/previous`. `schemas.ts` is the executable strict contract. Content version1.0.0 is separate from DB version.

Only SAVE/COMPLETE commands enter the controller. Detached snapshots receive increasing checkpoint sequence numbers; note revision and durable profile revision are distinct. Edit/settings saves use300ms debounce and1s max wait. Evidence and completion save immediately. The writer queue and transaction revision/token checks reject stale data. Success means transaction.oncomplete. Completion writes attempt/progress/settings and clears the matching draft atomically; duplicate completion does not increment rewards. Navigation on a completed session keeps the draft clear; next boot opens the order list with the first unfinished order selected.

Recent100 detailed attempts plus at most8 per-order summaries preserve the first attempt's evidence and latest result. Same-attempt first answers, hints, exposure, skips and final success cannot regress. Missing supported legacy evidence becomes unknown. Future/unknown versions are rejected; no automatic destructive migration.

One writer owns a15s lease, renewed every5s only while visible. Hidden/pagehide flush and release are best effort. Reload keeps sessionStorage tab identity; duplicating a tab may copy that identity, but transaction revision comparison still rejects its stale write. Separate tabs acquire atomically. An expired different owner requires explicit takeover. BroadcastChannel conveys hints only; all writes verify the DB lease and revision. No channel is required for safety.

Import checks File.size before reading, rechecks UTF-8 bytes <=262144, rejects invalid JSON/depth/arrays/accessors/prototype keys and validates all records and cross-record links. A preview requires explicit replacement confirmation. The prior valid profile becomes backup in the same transaction. Cancel does nothing. Export excludes live draft/undo/audio/owner data and preserves first evidence. Diagnostic recovery export is separately named and not importable.

Corruption never deletes the database. Recovery uses a validated backup or an explicitly confirmed new start; unchanged raw-record comparison protects recovery even with corrupt metadata. Failed transactions preserve durable data. Failed/unavailable storage keeps current learning and export available. No cloud sync, tracking, persistent-storage permission or automatic retry loop exists.

Evidence: `S08-check.log`187tests, `S08-storage-verified.log`17 focused tests before the final corrupt-meta regression, actual Chromium `S08-browser-first.log`7checks and `S08-recovery-confirmed.log`2checks. Fake IndexedDB fault injection is separate from native browser tests. Physical Safari/mobile quota and suspend behavior remain NOT RUN.
