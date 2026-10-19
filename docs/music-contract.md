# Music API contract

The music domain is pure TypeScript and does not depend on DOM, React, audio, storage, or Korean UI copy. Import through `src/domain/music/index.ts`.

- `SpelledPitch`: readonly `{letter, accidental, octave}`, with uppercase A–G, accidental −2…2, and an integer written octave. `parseSpelledPitch` accepts `^([A-G])(bb|##|b|#)?(0|-?[1-9]\d*)$`, no whitespace, leading zero, plus sign, or Unicode accidentals. Computed MIDI must be 0…127. Thus B##-2 is valid MIDI 1, B#3 remains written octave 3, and Cb4 remains written octave 4.
- `formatPitch(pitch, 'ascii'|'unicode' = 'ascii')` emits canonical storage or display spelling. `toMidi` never replaces spelling octave. `pitchClass` supports every safe integer, including negative inputs. `midiToFrequency(69) === 440`.
- `generateTriad(root, quality)` returns a readonly tuple in root/third/fifth role order. It selects diatonic letters before accidentals. An accidental outside ±2 throws `UNSUPPORTED_SPELLING`; MIDI overflow throws `INVALID_MIDI`.
- `analyzeInterval(from,to)` supports ascending simple and compound intervals. It returns separate `diatonicNumber`, `semitoneDistance`, `quality`, and `alteration` relative to the major/perfect baseline. Multiple augmentation/diminution is represented by the integer alteration; callers must not label all such intervals singly augmented/diminished. Descending or reversed-letter intervals throw `UNSUPPORTED_INTERVAL`.
- `analyzeVoicing(pitches,root,quality)` requires three pitches; roles follow target pitch classes, never slot positions. Membership compares multisets. Actual minimum MIDI determines inversion. Invalid membership returns null inversion/bassRole/closePosition, avoiding a fictitious inversion label. `closePosition` means span below 12 semitones and is independent from inversion.
- `spellForTask(midi,root,quality,displayMap)` gives target-member spelling priority over the map and restores the written octave algebraically. For other notes the map must contain a valid spelling matching the MIDI key. General grading does not use this normalization.
- Errors are `MusicError` with stable `code`: `INVALID_PITCH`, `INVALID_MIDI`, `INVALID_QUALITY`, `UNSUPPORTED_SPELLING`, `UNSUPPORTED_INTERVAL`, `INVALID_VOICING`, `INVALID_DISPLAY_MAP`.

UI input remains MIDI 60…74; this does not narrow the pure music model or broaden the audio engine's planned range.

## Content and grading APIs

`loadOrders(): readonly Order[]` and `parseOrdersJson(text): readonly Order[]` come from `src/content/loader.ts`; the parsed `Order` type is exported there and from `src/content/types.ts`. All returned objects and arrays are deeply frozen. JSON remains the sole authored answer source: raw pitches are strict strings, returned pitches are `SpelledPitch`. `validateOrders(unknown)` handles already-decoded raw objects. It is not a string import API: callers receiving JSON must use `parseOrdersJson`, which rejects duplicate keys (including Unicode-escaped equivalent property names), excessive size/depth, malformed JSON, missing/extra schema fields, unsupported versions, and invalid order invariants. `ContentError` supplies `code` and `path` for the content-error screen. No source fixture was altered.

Import these from `src/domain/grading/index.ts`:

```ts
grade(slots: readonly VoiceSlot[], target: ChordTarget): Grade
orderToTarget(order: Order): ChordTarget
gradeChord(input: readonly (SpelledPitch | string | null)[], order: Order): Grade
gradeMidi(input: readonly (number | null)[], order: Order): Grade
```

`gradeChord` assigns synthetic slot IDs but preserves the supplied spelling. `gradeMidi` is the keyboard adapter, validates the order's 60…74 input bounds, and applies `spellForTask`. Use general `grade` to validate real slot IDs, or to exercise pitch-class / optional inversion / explicit spelling future fixtures. Empty slots are represented by `null`; wrong slot count and duplicate IDs are invalid data. Invalid target or non-null pitch takes priority over another empty slot.

Boolean fields are observations, not a list of enabled requirements: `registerCorrect` compares exact MIDI even in pitch-class mode, and `spellingCorrect` observes spelling even if spelling is not required. `inversionCorrect` is false for invalid membership; with valid membership and `inversion:null`, it is true because any bass is allowed. Invalid/incomplete input returns all observation booleans false because analysis cannot be completed. Final correctness requires membership, exact register only when configured, inversion only when requested, and spelling only when required.

Stable code priority: `INVALID_DATA`, then `INCOMPLETE`; for wrong members, missing root/third/fifth in that order followed by `MEMBERS_MISMATCH`; for correct members, `REGISTER_MISMATCH`, `INVERSION_MISMATCH`, `SPELLING_MISMATCH` for applicable failed conditions; otherwise `CORRECT`. UI should show the first educational cause and treat invalid data as an app/content error. No exploration counts, help use, text strings, or UI slot order participate in grading.
