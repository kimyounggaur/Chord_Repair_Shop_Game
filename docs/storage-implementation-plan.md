# S08 storage implementation plan

Status: preparation only. No persistence implementation or test PASS is claimed. Parent will authorize implementation after S07. This file is the only change assigned to this preparation task.

## Sources and current dependencies

- Read `docs/design.md` §§13.3, 14, 15, 16, 18, 19 and `docs/promptpack.md` M00, S08, appendix D.4.
- Required coverage: REQ19–22, STORE01–15, SEC01/02/04; preserve LEARN03/04 and STATE03/06/07.
- `docs/implementation-status.md` and an S07 handoff were not yet present when this plan was prepared. Their absence is expected during parallel preparation, not evidence of completed gates.
- `fake-indexeddb` 6.2.6, Vitest 5.0.5, Playwright 1.64.1 are already declared. Do not add a persistence dependency merely for convenience.
- S03 is now delivered at `docs/session-contract.md` and `src/domain/session/index.ts`; its exports were reviewed against `src/app/App.tsx` and `src/ui/services.ts`. Do not introduce DOM, IndexedDB or storage concerns into the music/session domain.

## API and ownership

The initial proposed boundaries are deliberately small:

```ts
// schemas.ts: unknown -> discriminated validated value, no mutation
validateProfileSnapshot(value: unknown): ValidationResult<ProfileSnapshot>;
validateExport(value: unknown): ValidationResult<ProgressExportV1>;

// db.ts: open and transaction lifecycle only
openDatabase(factory?: IDBFactory): Promise<IDBDatabase>;

// repository.ts: the single writer for durable profile mutations
loadProfile(): Promise<LoadResult>;
saveCheckpoint(input: Checkpoint, expectedRevision: number, owner: OwnerToken): Promise<CommitResult>;
completeAttempt(input: Completion, expectedRevision: number, owner: OwnerToken): Promise<CommitResult>;
saveSettings(input: Settings, expectedRevision: number, owner: OwnerToken): Promise<CommitResult>;
replaceProfile(input: ValidatedImport, expectedRevision: number, owner: OwnerToken): Promise<CommitResult>;
restoreBackup(expectedRevision: number, owner: OwnerToken): Promise<CommitResult>;

// tab-coordinator.ts: hints and lease commands, never a replacement for commit checks
acquireWriter(): Promise<LeaseResult>;
renewWriter(owner: OwnerToken): Promise<LeaseResult>;
takeOverExpiredWriter(expectedLease: LeaseIdentity): Promise<LeaseResult>;
releaseWriter(owner: OwnerToken): Promise<void>;

// import-export.ts: preparation is read-only; repository performs confirmed replacement
prepareImport(file: File): Promise<ImportPreviewResult>;
createExport(profile: ValidProfile): ExportResult;
```

Names may follow existing conventions once S07 lands. Every public asynchronous method resolves a typed result or is caught at the UI boundary. Never let an unhandled rejection stop play. A repository status subscription exposes `clean | dirty | saving | failed | memoryOnly`, last successful revision, failure reason, read-only reason and export availability. Game completion and save completion remain independent.

### Confirmed UI/runtime integration requirements

The reviewed S04 `AppProps` has `initialOrder`, `initialSession`, `services`, `onSessionChange` and `onComplete`. `WorkbenchServices.onCommand(command, state, order)` receives every reducer command after the corresponding state is accepted. Root agreed to the following integration path, with UI reconciliation assigned to its owner during S07/S08:

1. A boot/runtime wrapper loads/validates the profile before mounting App, resolves the bundled order from restored `session.orderId` and checks its contentVersion, then passes matching initialOrder and initialSession. Never combine a CR02–CR08 restored draft with the default CR01 order. Initial props initialize state only; confirmed import/recovery must explicitly replace the running state or remount with a new profile-generation key after stopping audio.
2. Rendered screen must come from `SessionState.screen`. The currently separate local App screen (`initialSession ? workbench : home`) diverges from serialized screen. Navigation/enable/start paths need SET_SCREEN. SET_SCREEN currently emits no SAVE, so the UI/domain integration must emit an appropriate persistence checkpoint on screen changes without treating them as learning help. Do not solve this with an independent persisted screen that can disagree with the session.
3. The storage runtime bridge handles **only SAVE and COMPLETE** from onCommand. `onSessionChange` is an observation hook, not an autosave hook: it also reports SET_AUDIO/SET_STORAGE and would otherwise create writes and feedback loops for transient statuses. `onComplete` can update UI receipts, but it must not perform a second storage completion when onCommand already does so.
4. Capture a detached validated state/order and increment an internal monotonic checkpointSequence synchronously when a SAVE/COMPLETE command arrives. Enqueue that immutable capture; do not read a later mutable stateRef when a timer fires. The controller may coalesce edit checkpoints but must retain every new irreversible evidence fact in its latest snapshot.
5. CHECK emits SAVE then GRADE, and App executes GRADE_READY recursively. After recursion, the outer GRADE command callback still carries the earlier checking snapshot. Ignoring GRADE/CANCEL_AUDIO/FOCUS at the persistence bridge is therefore mandatory; saving every command would regress an already accepted result. DEMO may emit both debounced and immediate SAVE for the same accepted state; the immediate checkpoint supersedes its pending debounce.
6. COMPLETE carries exactly `{orderId, contentVersion, completionId}` in `receipt`. It is emitted once from reflection.explanation after successful repair; the accepted state is already completed. The bridge handles it as an immediate atomic completion, never as a generic draft SAVE. Invalidating a pending debounce prevents a later checkpoint from recreating the cleared completed draft.
7. Runtime status/ownership must be observable by App so it can dispatch SET_STORAGE without re-persisting that status and disable editing for a nonowner. Existing initial props do not provide this subscription by themselves. Add the smallest typed subscription/control bridge alongside the eventual audio runtime; keep recovery/import UI outside the pure reducer.
8. The `settings/main` record is canonical across screens and new attempts. A valid draft may contain an older settings copy; load reconciles it to the validated main settings, and successful settings transactions update both main and an active draft consistently. Do not let a restored draft overwrite a newer settings record.

These are implementation prerequisites, not code changes made in this planning task. S04 is still active at review time; root and the UI owner were notified of the screen/order/callback hazards. Re-check the final S07 App before implementing the adapter because its progression/receipt props will evolve.

## IndexedDB layout and exact record schemas

Database `chord-repair-shop`, IndexedDB version **1**. All six stores use explicit keys, with no auto increment and no other application's namespace.

| Store / key | Stored value and invariant |
|---|---|
| `meta` / `profile` | Exact object: schemaVersion, contentVersion, revision, updatedAt, writerLease. Schema version is 1; content version is checked against supported bundled versions; global revision is a nonnegative safe integer. Lease is null or an exact ownerId/token/expiresAt record. |
| `settings` / `main` | Exact bounded enums/booleans/finite volume number from final UI settings contract. Settings never affect learning evidence. |
| `attempts` / attemptId | Exact current attempt evidence and final notes/concept result, identified by attemptId, orderId, contentVersion, timestamps and completed completionId when present. Do not persist the entire UI state here. |
| `progress` / orderId | Exact completion state, completedContentVersion, latestAttemptId/completionId and a bounded historic evidence summary for this order. Keep summary in this existing store rather than create an undocumented seventh store. |
| `draft` / `active` | Exact envelope containing the validated serialized session snapshot, including its attemptId/contentVersion/note revision and checkpoint sequence. The session validator must inspect the complete snapshot. |
| `backup` / `previous` | Exact prior known-good profile snapshot: settings, bounded attempts, progress and optional draft; includes source profile revision/version. Excludes its own backup and transient writer lease. |

Meta additions for transactional writer coordination are implementation metadata, not a change to educational evidence. IndexedDB version and exported data schema version are separate concepts even when both initially equal 1. A DB upgrade creating stores does not imply a content migration.

Confirmed S03 exports: `SessionState`, `AttemptEvidence`, `SessionSettings`, `SessionCommand`, `CompletionReceipt`, `serializeSession(state)`, `restoreSession(serializedOrUnknown, order)` and `evidenceDoesNotRegress(previous, next)`. The session's exact fields are schemaVersion, orderId, contentVersion, attemptId, revision, app, learning, audio, storage, screen, notes, selectedSlot, undo, demoSnapshot, pendingGrade, submissionSequence, lastGrade, completionId, evidence, reflection and settings. Keep the outer draft envelope distinct from these keys.

`AttemptEvidence` exact keys are evidenceStatus, firstSubmission, finalSuccess, maxRepairHintLevel, maxReflectionHintLevel, answerRevealedBeforeFirstAnswer, firstReflectionAnswer, latestReflectionAnswer, reflectionSkipped. Missing legacy evidence is the only explicitly supported relaxation of the current exact session schema. A new current-version write must contain the complete evidence object.

Current domain constraints that persistence must retain:

- attemptId is nonempty and at most 128 characters; do not impose the earlier proposed 96-character identifier limit and reject legitimate existing sessions. submissionId/completionId are bounded to 256. Derived submissionId is `${attemptId}:${submissionSequence}` and completionId is `${orderId}:${contentVersion}:${attemptId}`.
- revision and submissionSequence are nonnegative safe integers. First-submission revision cannot exceed current note revision. Shuffle seed is an integer from 0 to 4294967295 inclusive.
- notes are exactly three integer MIDI values in the loaded order's bounds. Locked slots equal that order's original values. selectedSlot is null or an editable slot. Each undo/demo entry has exactly notes and selectedSlot; undo has at most 50 entries.
- pendingGrade is null except in checking; a checking request has exactly the current orderId, attemptId, revision and derived submissionId. completed requires the deterministic completionId; other learning states require null.
- reflection has exactly phase (`question | explanation`), seed and optionIds. optionIds is a unique complete permutation of `${orderId}:option:${originalIndex}`. Answer objects contain exactly optionId/correct, with correctness checked against the bundled stable option ID.
- hint maxima are integers 0–3. firstSubmission is null or exactly status (`correct | incorrect`), revision and submissionId. First/latest concept answers are null or exact optionId/correct objects. All present evidence flags are booleans. Known reflection/completed evidence requires a repaired chord and a first submission. Known explanation requires an answer, skip or earlier exposure. A demo snapshot requires editing plus level-three help/exposure.
- settings has exactly mute:boolean, volume:finite number 0–1, inputMode:`keyboard | pads`, reducedMotion:boolean and notation:`letters | solfege`. Confirmed default volume is **0.35**.
- lastGrade is null or the exact S02 Grade shape; its enums, flags, at-most-ten codes and at-most-three roles are validated by restoreSession. No arbitrary strings or grade-shaped open dictionaries are accepted.

Use `restoreSession` for final domain validation/normalization after validating the outer record and safe JSON tree. Do not rely on its lenient missing-evidence migration for normal newly produced writes. `evidenceDoesNotRegress` guards immutable first fields, assistance, exposure, skip and success; checkpointSequence must additionally order later concept answers and phase changes because those fields are not all monotonic booleans.

Do not persist live AudioContext, scheduled nodes, timers, event handlers or DOM references. On restore, an interrupted `checking` state becomes editing with pending request cleared; active audio becomes paused/locked with no automatic playback. Preserve attempt identity, reflection permutation, first answers, help and exposure. A demo snapshot may restore edit notes but must never erase assistance evidence.

## Strict validation and supported migration

1. Reject non-plain objects at every object boundary. For in-memory/IDB inputs, only Object.prototype or null prototypes are acceptable; create validated output field by field. Inspect own property names and reject symbols/accessors before reading untrusted object properties.
2. Reject own keys `__proto__`, `prototype`, `constructor` recursively, including unknown nested values. Do not spread/assign unvalidated input. JSON.parse is parsing only, not schema validation.
3. Enforce exact required and allowed keys at every object; no generic unknown catch-all objects. Validate tuples by exact length, lists by maximum count, finite numbers and safe integers, enum membership, string lengths, known order IDs CR01–CR08 and cross-record identity links.
4. Use the confirmed session identifier limits above and bounded content-version strings (proposed maximum 64, checked against actual bundled content). Use integer epoch timestamps. Do not execute or render HTML, URLs or code in strings. Generated IDs should use the established UUID format; imported IDs must obey the domain's accepted limits and cross-record relationships.
5. Validate notes against order bounds and permutation against exactly the known stable option IDs. Do not trust imported correctness booleans where consistency can be recomputed from bundled content, but never manufacture historical first-attempt evidence.
6. Missing evidence is not `false`. A specifically recognized legacy shape can be migrated to `evidenceStatus: unknown` with null/unknown first-result fields. Malformed values in a present evidence field remain invalid. Unknown evidence cannot qualify as independent achievement.
7. Only explicitly supported source schema/content versions may migrate. Reject future schema versions with an actionable message; never silently downgrade. Unknown content versions keep their records isolated from current achievement and need a defined supported migration before they are playable.
8. Validate current read, backup read, migration output, every write and import. A function returning a typed value is not by itself validation evidence.

## Write ordering, CAS and evidence preservation

Maintain three different concepts:

- `SessionState.revision`: note state revision; it does not advance just because the learner requests a hint or answers a question.
- `checkpointSequence`: monotonic local snapshot sequence for accepted session changes, including evidence-only changes. The controller captures it with an immutable snapshot before enqueueing.
- `meta.revision`: global durable profile revision incremented once per successful profile mutation transaction, including settings and import.

Serialize all local profile writes through one queue. Evidence-changing events (HINT, CHECK, ANSWER, SHOW_EXPLANATION, SKIP, demo exposure) flush the newest snapshot immediately. A pending edit debounce must be superseded/cancelled so that it cannot later persist older evidence. Notes and settings use 300 ms trailing debounce with a first-dirty deadline of 1 second; continued activity cannot postpone the deadline indefinitely. Hidden/pagehide requests a best-effort flush in addition to these normal paths.

For each transaction, read profile meta, required current draft/attempt and relevant progress inside one `readwrite` transaction. In the request success callback, compare expected profile revision, writer owner/token/expiry, current attempt identity, checkpoint sequence and same-attempt evidence monotonicity. Then issue all puts/deletes in that same active request flow. Do not perform fetch, timers, unrelated promises or asynchronous validation inside an active transaction.

Use `transaction.oncomplete` as the only success signal. `request.onsuccess` only confirms one request, and the transaction can still abort. Capture errors from request, transaction error/abort, database open, blocked/versionchange and serialization.

Same-attempt guard rejects lower note/checkpoint revisions, removal or alteration of an existing first submission/first concept answer, lowered max hint level, true-to-false exposure/skipped/finalSuccess, or unknown-to-known evidence promotion unsupported by explicit trusted migration. An old attempt cannot overwrite an active newer attempt via a delayed callback. Store guards supplement the domain reducer; they do not reinterpret music results.

Completion reads the relevant progress and checks `{orderId, contentVersion, completionId}` for idempotency. Its single transaction saves the attempt, updates progress/summary, clears only the matching active draft, records the preceding known-good backup and advances meta. Duplicate completion returns the existing committed result without duplicate reward/summary increments. An abort leaves all stores unchanged. UI retains successful repair even if this commit fails.

Take the backup from the last **validated** durable snapshot, never by copying a newly discovered corrupt record over a valid backup. Replace/import/recovery must also CAS against the latest revision and token. Never retry a stale snapshot by merely changing its expected revision; reload/reconcile or offer export and refresh.

## Two-tab policy

The actual lock is stored with meta and acquired by a read/compare/write IDB transaction. Two simultaneous openers cannot both win. Owner IDs/tokens come from cryptographically strong browser randomness; they are local conflict identifiers, not credentials, and are excluded from export.

Proposed policy: 15-second lease, renew every 5 seconds only while visible and the editor is active. A hidden/pagehide owner attempts a flush and release, then stops renewal. A crashed tab expires naturally. A tab becoming visible rechecks ownership before permitting edits. Lease expiry grants eligibility for the explicit “이 탭에서 이어서 편집” action; no stale/secondary tab silently takes over and writes. Ownership takeover reloads durable data before accepting new changes.

BroadcastChannel `chord-repair-shop` sends bounded versioned metadata only: owner changed / revision committed / release. It carries no session or personal data. Validate messages, treat them solely as refresh hints, and re-read IDB before changing write authority. The UI disables editing in a secondary tab and presents refresh/export/takeover choices. Spoofed or stale messages cannot grant ownership.

Without BroadcastChannel, the same lease and CAS checks remain mandatory. Before foreground editing and on failed commit, re-read IDB; optional visible-only polling improves UI feedback. A tab must not knowingly continue accepting durable edits after lease loss. Keep its unsaved snapshot exportable, without silently overwriting durable progress.

## Recovery and memory-only behavior

Boot reads raw records without modifying them, validates current state, validates the previous snapshot if needed, identifies a supported migration, and only after the chosen recovery action commits a validated replacement atomically. Never call deleteDatabase in response to corruption.

Recovery UI offers: use previous valid record (with age/version summary), export readable current records, or start fresh. If both current and backup are invalid, report which parts are readable and that a full recovery is unavailable. A diagnostic export is distinct from a valid importable progress export and is created only on user request; raw unsafe objects must not be rendered as HTML or passed into a valid progress importer.

“Start fresh” confirms that it deletes this game's learning records only. Preserve settings by default; make settings deletion a separate explicit choice. Do not clear other applications, unrelated localStorage or the browser as a whole. A failed reset transaction preserves the previous records.

Unavailable IndexedDB or quota/security failure switches to memoryOnly; an unexpected abort first reports failed and offers bounded retry. Maintain a complete validated in-memory profile, a persistent banner, an export button and a once-per-session clear warning that closing the browser may lose changes. Retrying is an explicit action, not a loop. Corruption/conflict is not treated as permission to overwrite. Never request persistent storage automatically or add cloud/network transfer.

## Bounded attempts and import/export

Retain at most the latest 100 detailed attempts, ordered deterministically by completedAt/updatedAt and attemptId tie-break. Compact older details into at most eight per-order summaries, keyed by contentVersion support policy. Each summary preserves the earliest attempt's identity and evidence (including unknown status), assistance/exposure counts, total attempts/completions and the latest achievement with its content version. Never count duplicate completion or infer independent success from absent evidence. Summary counters are nonnegative safe integers with bounded schema keys.

Filename: `chord-repair-progress-v1.json`. Payload contains exactly schemaVersion, contentVersion, settings, progress and bounded attempt summaries/details. Exclude draft, undo, playback state, device identifiers, owner tokens, audio buffers and contact data. Export serialization uses UTF-8 byte length (`TextEncoder`), not JavaScript character count. Limit is 262,144 bytes inclusive; refuse oversize data with a concrete explanation instead of silently discarding first evidence. Fixed bounds should make normal compliant exports comfortably smaller.

Import checks `File.size <= 262144` **before** calling text/arrayBuffer. Re-check decoded UTF-8 bytes, parse JSON with caught syntax errors, reject dangerous keys and excessive nesting/node counts, then exact schema validation and cross-record consistency. Reject over-100 detailed attempts, over-eight current-order progress/summary entries, duplicate IDs/order IDs, non-finite values and unsupported versions. Boundary tests cover exactly 262144 and 262145 bytes, including Korean UTF-8 text.

Preparation returns a readable count/version/replacement summary without writing. Cancel changes nothing. Confirmation stores the current validated profile in backup and replaces all relevant profile stores in one CAS/lease-checked transaction; it does not merge. Import preview is invalidated if another tab changes the profile before confirmation. A failed confirmed import leaves the old durable profile intact.

## Test order and evidence

Write small failing tests before implementation; record observed command output and exit codes once executed. Suggested files align with S08 prompt, with real browser tests distinct from fake IDB:

| Suite | Required cases |
|---|---|
| `tests/integration/persistence-schema.test.ts` | Exact nested keys/tuples, prototype keys at every level, malformed booleans vs missing legacy evidence, bounds, future schema/content versions, known ID consistency. |
| `tests/integration/persistence-repository.test.ts` | Normal write/reload; request success then transaction abort; all-store completion atomicity/idempotency; lower revision; same note revision newer hint; superseded attempt; backup never overwritten by corruption. |
| `tests/integration/persistence-scheduling.test.ts` | 300 ms debounce and 1-second maxWait; immediate evidence flush; stale queued edit after immediate hint; settings serialization; pagehide best-effort only. |
| `tests/integration/persistence-import.test.ts` | Size before File.text read, UTF-8 boundary, JSON syntax, excessive arrays/depth, malicious keys, first evidence retained after 100 attempts, cancellation, preview revision conflict, replace abort rollback. |
| `tests/integration/persistence-tabs.test.ts` | Concurrent acquisition, owner/token validation, stale revision with valid-looking message, crash expiration, explicit takeover, hidden tab stops renewal, absent BroadcastChannel. |
| `tests/e2e/recovery.spec.ts` | Real Chromium IDB reload at question/explanation/hint/first-wrong/demo stages; unknown legacy record; corrupt current/valid backup; both corrupt; reset confirmation; persistent memoryOnly/export UI. |
| `tests/e2e/recovery-tabs.spec.ts` | Two real pages on same origin: simultaneous opens, read-only loser, closed owner, expired lease takeover, unnotified stale writer rejected. |

Use injected IDBFactory, clock and channel factory in unit/integration boundaries, with `fake-indexeddb` instances isolated per test. Do not describe those tests as real-browser IndexedDB checks. Real-browser test setup uses the existing 5486 development or 4486 preview ports only. Keep real Safari/iOS storage suspension, quota behavior and device tests explicitly NOT RUN until exercised on those platforms.

After implementation, run targeted failing/regression cases, the repository typecheck and required checks, then actual browser flow. Update `docs/storage-contract.md`, `docs/handoffs/S08.md` and implementation status with exact results. This plan does not mark S08 PASS and does not advance a stage gate.
