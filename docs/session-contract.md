# Session contract

S03 reference: design sections 3, 6, 12.1–12.2, 14, 16.2–16.3 and promptpack M00/S03. This document describes the implementation interface; execution status belongs in `handoffs/S03.md`.

`createSession(order, attemptId, seed)` creates an introduction for one parsed, validated Order. The caller supplies a fresh attempt ID for a new order or explicit practice. `reduceSession(state, event, order)` returns `{state, commands}` and never executes audio, browser, storage, or clock operations. Invalid/forbidden events return the same state with an empty command list. Notes are MIDI values; grading is delegated through `executeGradeCommand` to S02 `gradeMidi`.

Independent state axes are `app`, `learning`, `audio`, `storage`, and `screen`. A storage/audio failure does not reset learning. `HIDDEN` cancels audio and requests immediate save; `RETURN` never requests sound. Restoring a pending check returns to editing and drops its request; the next check uses a new sequence number. Restoring active audio yields a nonplaying state.

## Events and commands

Editing events: `START_ORDER`, `SELECT_SLOT {slot}`, `SELECT_PITCH {midi, repeat?}`, `EDIT`, `UNDO`, `RESET`, `CHECK`. A real note change increases `revision`, keeps at most 50 note/selection snapshots, invalidates a pending grade, cancels audio, and requests a debounced save. Selecting a slot or the same note does not increase revision. Locked slots, out-of-range/noninteger MIDI, and repeated key events cannot edit notes.

`CHECK` emits `GRADE {request, notes}`. Request identity is the complete `{orderId, attemptId, revision, submissionId}` tuple. The command executor produces `GRADE_READY {request, grade}`. Every field must match the active request. Duplicate checks while checking reuse that request; duplicate results are ignored. Only a correct/incorrect grade sets `evidence.firstSubmission`, once. Invalid/incomplete results cannot create a learner failure.

Help events: `HINT {area: 'repair'|'reflection', level: 1|2|3, revealsReflectionAnswer?}`, `DEMO`, `RETURN_FROM_DEMO`, `KEEP_DEMO`, `EXPOSE_REFLECTION_ANSWER`. The UI must set `revealsReflectionAnswer: true` whenever a tutorial/help message directly reveals the upcoming answer. A demonstration always records level-three repair help and exposure, saves an independent return snapshot, and requires an explicit return/keep choice. Undo/reset never restore evidence.

Reflection events: `ANSWER {questionId, optionId}`, `SKIP`, `SHOW_EXPLANATION`, `CONTINUE`. Question IDs are `${orderId}:reflection`. Stable option IDs are `${orderId}:option:${originalIndex}`, not displayed positions. The seeded permutation is stored in the session. `reflectionOptions(state, order)` maps that exact order to UI labels. `canShowExplanation` is false on first repair success and true after answer, skip, or an explicit explanation request. The first actual answer and latest answer are separate; prior skip/exposure/help remains recorded.

`CONTINUE` emits exactly one `COMPLETE {receipt}` and moves to completed. Its idempotency tuple is `{orderId, contentVersion, completionId}` with a deterministic completion ID derived from order/content/attempt. Wrong answers, skipping, and assistance do not block completion. The adapter must atomically save attempt/progress/draft cleanup and enforce receipt idempotency. `NEW_PRACTICE {attemptId, seed}` creates an introduction with fresh evidence while the old completed attempt remains the caller's record.

Other commands are `CANCEL_AUDIO`, `FOCUS {target}`, and `SAVE {immediate, reason}`. Save reasons distinguish edit, evidence, settings, and hidden requests. Settings changes are not hints. Adapters execute commands after accepting the corresponding state, not from inside a reducer or a render.

## Evidence and progression

`AttemptEvidence` stores `evidenceStatus`, immutable `firstSubmission`, monotonic `finalSuccess`, independent maximum repair/reflection help levels, monotonic `answerRevealedBeforeFirstAnswer`, first/latest reflection answers, and the skip flag. Independent repair requires known evidence, first submission correct, no repair help, and a nonguided order. Independent concept confirmation separately requires first answer correct, no reflection help/exposure/skip, known evidence, and a nonguided order. Accessibility, input mode, reduced motion, and mute do not affect either result.

`completedOrderIds`, `isEnsembleUnlocked`, and `canOpenOrder` use unique valid order receipts. All eight CR01–CR08 must be complete to unlock the ensemble. First progress is sequential; after all eight, every order is revisitable. Completing only CR08 or duplicating another receipt never unlocks the ensemble.

## Serializable draft

`serializeSession(state)` returns JSON; `restoreSession(jsonOrUnknown, order)` returns `{ok:true,state}` or `{ok:false,error}`. The schema contains version/order/content/attempt IDs, note revision and notes, selected slot, all state axes, grade/request sequence, completion ID, evidence, reflection seed/permutation/phase, bounded undo, separate demo snapshot, and settings. The validator rejects unsupported versions, extra keys, dangerous keys, oversized strings/arrays, invalid notes/IDs/enums and inconsistent phase data. It does not delete or mutate rejected input.

Missing legacy evidence is recovered as `evidenceStatus: 'unknown'`; missing help evidence is never interpreted as proof of independence. Attempt ID, valid evidence, question phase, option order and demo return state survive reload. Audio is never restarted by restoring a draft.

Note `revision` is note-only. S08 must maintain a separate global profile revision/checkpoint sequence so two equal-note-revision help/answer writes cannot overwrite newer evidence. Storage must additionally enforce monotonic same-attempt evidence on writes. This pure domain module does not claim IndexedDB durability, multitab ownership, actual audio listening, or physical-device validation.
