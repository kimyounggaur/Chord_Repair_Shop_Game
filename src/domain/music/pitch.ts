import { MusicError, NATURAL_PC, type Accidental, type Letter, type SpelledPitch } from './types';

export function assertMidi(midi: number): void {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) throw new MusicError('INVALID_MIDI','Expected an integer from 0 through 127');
}

/** Deliberately accepts signed integer pitch-class inputs, including negative values. */
export function pitchClass(value: number): number {
  if (!Number.isSafeInteger(value)) throw new MusicError('INVALID_MIDI','Pitch class requires a safe integer');
  return ((value % 12) + 12) % 12;
}

export function toMidi(pitch: SpelledPitch): number {
  if (!pitch || typeof pitch !== 'object' || typeof pitch.letter !== 'string' || !Object.hasOwn(NATURAL_PC,pitch.letter) || !Number.isInteger(pitch.accidental) || pitch.accidental < -2 || pitch.accidental > 2 || !Number.isSafeInteger(pitch.octave)) {
    throw new MusicError('INVALID_PITCH','Expected letter A–G, accidental -2…2, and integer spelling octave');
  }
  const midi = 12*(pitch.octave+1)+NATURAL_PC[pitch.letter]+pitch.accidental;
  assertMidi(midi);
  return midi;
}

/** Internal ASCII grammar: letter, optional bb/b/#/##, canonical signed integer octave. No whitespace. */
export function parseSpelledPitch(value: string): SpelledPitch {
  if (typeof value !== 'string' || value.length > 12) throw new MusicError('INVALID_PITCH','Expected a bounded ASCII pitch string');
  const match = /^([A-G])(bb|##|b|#)?(0|-?[1-9]\d*)$/.exec(value);
  if (!match) throw new MusicError('INVALID_PITCH','Invalid scientific pitch spelling');
  const accidentals: Readonly<Record<string,Accidental>> = { '':0, bb:-2, b:-1, '#':1, '##':2 };
  const pitch: SpelledPitch = { letter:match[1] as Letter, accidental:accidentals[match[2] ?? ''], octave:Number(match[3]) };
  toMidi(pitch);
  return pitch;
}

export function formatPitch(pitch: SpelledPitch, notation: 'ascii' | 'unicode' = 'ascii'): string {
  toMidi(pitch);
  const symbols = notation === 'unicode' ? ['𝄫','♭','','♯','𝄪'] : ['bb','b','','#','##'];
  return `${pitch.letter}${symbols[pitch.accidental+2]}${pitch.octave}`;
}

export function midiToFrequency(midi: number): number {
  assertMidi(midi);
  return 440 * 2 ** ((midi-69)/12);
}
