import { assertMidi, parseSpelledPitch, pitchClass, toMidi } from './pitch';
import { LETTERS, MusicError, NATURAL_PC, type Accidental, type DisplaySpellingMap, type Quality, type SpelledPitch, type Triad } from './types';

export function generateTriad(root: SpelledPitch, quality: Quality): Triad {
  const rootMidi = toMidi(root);
  if (quality !== 'major' && quality !== 'minor') throw new MusicError('INVALID_QUALITY','Only major and minor triads are supported');
  const rootIndex = LETTERS.indexOf(root.letter);
  const offsets = [0,quality === 'major' ? 4 : 3,7];
  return [0,2,4].map((letterOffset,index) => {
    const absoluteIndex = rootIndex + letterOffset;
    const letter = LETTERS[absoluteIndex % 7];
    const octave = root.octave + Math.floor(absoluteIndex/7);
    const midi = rootMidi + offsets[index];
    assertMidi(midi);
    const accidental = midi-(12*(octave+1)+NATURAL_PC[letter]);
    if (accidental < -2 || accidental > 2) throw new MusicError('UNSUPPORTED_SPELLING','The triad requires an accidental beyond double flat or sharp');
    return { letter, accidental:accidental as Accidental, octave };
  }) as unknown as Triad;
}

export function spellForTask(midi: number, targetRoot: SpelledPitch, targetQuality: Quality, displayMap: DisplaySpellingMap): SpelledPitch {
  assertMidi(midi);
  const member = generateTriad(targetRoot,targetQuality).find(pitch=>pitchClass(toMidi(pitch)) === pitchClass(midi));
  if (member) {
    const octave = (midi-NATURAL_PC[member.letter]-member.accidental)/12-1;
    const result = { ...member, octave };
    if (!Number.isInteger(octave) || toMidi(result) !== midi) throw new MusicError('INVALID_DISPLAY_MAP','Could not restore the contextual spelling octave');
    return result;
  }
  if (!displayMap || typeof displayMap !== 'object' || !Object.hasOwn(displayMap,midi)) throw new MusicError('INVALID_DISPLAY_MAP','The order map is missing this MIDI value');
  try {
    const value = displayMap[midi];
    const pitch = typeof value === 'string' ? parseSpelledPitch(value) : value;
    if (toMidi(pitch) !== midi) throw new Error('MIDI mismatch');
    return { ...pitch };
  } catch {
    throw new MusicError('INVALID_DISPLAY_MAP','The order map spelling does not match its MIDI key');
  }
}
