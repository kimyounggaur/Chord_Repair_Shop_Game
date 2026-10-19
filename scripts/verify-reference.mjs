import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [designPath, jsonPath] = process.argv.slice(2);
assert.ok(designPath && jsonPath,
  'Usage: node scripts/verify-reference.mjs docs/design.md src/content/orders.v1.json');
const designBytes = readFileSync(designPath);
const match = designBytes.toString('utf8').match(
  /<!-- ORDER_FIXTURES_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- ORDER_FIXTURES_END -->/
);
assert.ok(match, 'ORDER_FIXTURES block missing');
const reference = JSON.parse(match[1]);
const actual = JSON.parse(readFileSync(jsonPath, 'utf8'));
assert.deepEqual(actual, reference, 'Extracted content differs from design');

const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = 'CDEFGAB';
const mod = n => ((n % 12) + 12) % 12;
const midi = spelling => {
  const m = /^([A-G])(bb|##|b|#)?(-?\d+)$/.exec(spelling);
  assert.ok(m, `Invalid spelling: ${spelling}`);
  const accidental = m[2] === 'bb' ? -2 : m[2] === 'b' ? -1
    : m[2] === '#' ? 1 : m[2] === '##' ? 2 : 0;
  const value = 12 * (Number(m[3]) + 1) + NATURAL[m[1]] + accidental;
  assert.ok(Number.isInteger(value) && value >= 0 && value <= 127);
  return value;
};
const triad = (root, quality) => {
  const m = /^([A-G])(bb|##|b|#)?(-?\d+)$/.exec(root);
  assert.ok(m);
  const rootMidi = midi(root), rootIndex = LETTERS.indexOf(m[1]);
  const offsets = quality === 'major' ? [0, 4, 7] : [0, 3, 7];
  return [0, 2, 4].map((step, i) => {
    const letter = LETTERS[(rootIndex + step) % 7];
    const octave = Number(m[3]) + Math.floor((rootIndex + step) / 7);
    const accidental = rootMidi + offsets[i] - (12 * (octave + 1) + NATURAL[letter]);
    assert.ok(accidental >= -2 && accidental <= 2);
    const sign = accidental < 0 ? 'b'.repeat(-accidental) : '#'.repeat(accidental);
    return `${letter}${sign}${octave}`;
  });
};
const sort = xs => [...xs].sort((a, b) => a - b);
const fields = [
  'schemaVersion', 'contentVersion', 'id', 'title', 'root', 'quality',
  'initial', 'target', 'initialMidi', 'targetMidi', 'editableSlots',
  'allowedMidi', 'registerMode', 'spellingRequired', 'inversion',
  'primaryConcept', 'hintPolicy', 'reflection', 'displaySpellingMap'
].sort();
const expected = [
  ['CR01', 'C4', 'major', [60, 63, 67], [60, 64, 67], 'major-third', 0],
  ['CR02', 'C4', 'minor', [60, 64, 67], [60, 63, 67], 'minor-third', 0],
  ['CR03', 'F4', 'major', [65, 68, 72], [65, 69, 72], 'major-third', 0],
  ['CR04', 'G4', 'minor', [67, 71, 74], [67, 70, 74], 'minor-third', 1],
  ['CR05', 'G4', 'major', [67, 70, 74], [67, 71, 74], 'major-third', 0],
  ['CR06', 'F4', 'minor', [65, 69, 72], [65, 68, 72], 'minor-third', 0],
  ['CR07', 'C4', 'major', [60, 64, 66], [60, 64, 67], 'fifth', 0],
  ['CR08', 'F4', 'minor', [64, 68, 72], [65, 68, 72], 'root', 0]
];
function verifyOrders(orders) {
  assert.equal(orders.length, 8);
  assert.equal(new Set(orders.map(o => o.id)).size, 8);
  orders.forEach((o, i) => {
    const e = expected[i];
    assert.deepEqual(Object.keys(o).sort(), fields);
    assert.equal(o.schemaVersion, 1);
    assert.equal(o.contentVersion, '1.0.0');
    assert.equal(o.id, e[0]); assert.equal(o.root, e[1]); assert.equal(o.quality, e[2]);
    assert.deepEqual(o.initialMidi, e[3]); assert.deepEqual(o.targetMidi, e[4]);
    assert.equal(o.primaryConcept, e[5]);
    assert.equal(o.reflection.answerIndex, e[6]);
    assert.equal(o.initial.length, 3); assert.equal(o.target.length, 3);
    assert.deepEqual(o.initial.map(midi), o.initialMidi);
    assert.deepEqual(o.target.map(midi), o.targetMidi);
    assert.deepEqual(o.target, triad(o.root, o.quality));
    const offsets = o.quality === 'major' ? [0, 4, 7] : [0, 3, 7];
    assert.deepEqual(o.targetMidi.map(n => n - midi(o.root)), offsets);
    assert.deepEqual(o.allowedMidi, [60, 74]);
    assert.equal(o.registerMode, 'exact'); assert.equal(o.spellingRequired, false);
    assert.equal(o.inversion, 0);
    assert.equal(o.hintPolicy, i < 2 ? 'guided' : 'optional');
    assert.deepEqual(o.editableSlots, i < 2 ? [1] : [0, 1, 2]);
    assert.notDeepEqual(sort(o.initialMidi), sort(o.targetMidi));
    for (let slot = 0; slot < 3; slot++) {
      assert.ok(o.initialMidi[slot] >= 60 && o.initialMidi[slot] <= 74);
      assert.ok(o.targetMidi[slot] >= 60 && o.targetMidi[slot] <= 74);
      if (!o.editableSlots.includes(slot)) assert.equal(o.initialMidi[slot], o.targetMidi[slot]);
    }
    assert.deepEqual(Object.keys(o.displaySpellingMap).map(Number).sort((a,b) => a-b),
      Array.from({ length: 15 }, (_, n) => n + 60));
    for (const [key, value] of Object.entries(o.displaySpellingMap)) assert.equal(midi(value), Number(key));
    assert.deepEqual(Object.keys(o.reflection).sort(), ['answerIndex', 'options', 'prompt']);
    assert.equal(o.reflection.options.length, 3);
    assert.ok(Number.isInteger(o.reflection.answerIndex) && o.reflection.answerIndex >= 0 && o.reflection.answerIndex < 3);
    assert.ok(o.title.length > 0 && o.reflection.prompt.length > 0);
    assert.ok(o.reflection.options.every(x => typeof x === 'string' && x.length > 0));
    assert.equal(Math.min(...o.targetMidi), midi(o.root));
  });
}
verifyOrders(actual);
assert.equal(midi('B#3'), 60); assert.equal(midi('Cb4'), 59);
assert.equal(midi('D#4'), midi('Eb4'));
assert.equal(440 * 2 ** ((69 - 69) / 12), 440);
assert.deepEqual(sort([64, 67, 72].map(mod)), sort([60, 64, 67].map(mod)));
assert.notDeepEqual(sort([60, 64, 64].map(mod)), sort([60, 64, 67].map(mod)));

// Negative controls: the verifier must reject intentional corruptions.
for (const mutate of [
  xs => { xs[0].targetMidi[1] = 65; },
  xs => { xs[3].target[1] = 'A#4'; },
  xs => { delete xs[0].displaySpellingMap['74']; },
  xs => { xs[0].editableSlots = []; },
  xs => { xs[7].reflection.answerIndex = 2; }
]) {
  const clone = structuredClone(actual); mutate(clone);
  assert.throws(() => verifyOrders(clone));
}

// Reference ensemble arithmetic only; the app's exported event builder needs its own tests.
const orderIds = ['CR01','CR02','CR03','CR06','CR05','CR04','CR08','CR07'];
const beat = 60 / 80, bar = 4 * beat, release = 0.12;
const byId = new Map(actual.map(o => [o.id, o]));
const events = [];
const pattern = [[0, 0, 1.4], [0, 2, 1.4], [1, 1, 0.8], [1, 3, 0.8],
  [2, 0.5, 0.3], [2, 1.5, 0.3], [2, 2.5, 0.3], [2, 3.5, 0.3]];
orderIds.forEach((orderId, barIndex) => {
  const notes = byId.get(orderId).targetMidi;
  const rows = barIndex === 7 ? [[0,0,3.5],[1,0,3.5],[2,0,3.5]] : pattern;
  for (const [roleIndex, offset, duration] of rows) {
    const at = barIndex * bar + offset * beat;
    const gateEnd = at + duration * beat;
    const audibleEnd = gateEnd + release;
    assert.ok(audibleEnd <= (barIndex + 1) * bar - 0.01 + 1e-9);
    events.push({ orderId, barIndex, roleIndex, midi: notes[roleIndex], at, gateEnd, audibleEnd });
  }
});
assert.equal(events.length, 59); assert.equal(8 * bar, 24);
const finalFifth = events.find(e => e.barIndex === 0 && e.at === 3.5 * beat);
assert.ok(Math.abs(bar - finalFifth.audibleEnd - 0.03) < 1e-9);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
console.log(JSON.stringify({
  status: 'REFERENCE_DATA_PASS', orders: actual.length, ensembleEvents: events.length,
  contentVersion: '1.0.0', bodySeconds: 24, transportEndSeconds: 24.4,
  designSha256: hash(designBytes), extractedJsonSha256: hash(readFileSync(jsonPath)),
  scope: 'Reference content/math only. Game implementation, device audio, accessibility, storage and learning outcomes NOT tested.'
}, null, 2));

