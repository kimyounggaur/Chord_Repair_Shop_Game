export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Accidental = -2 | -1 | 0 | 1 | 2;
export type Quality = 'major' | 'minor';
export type Role = 'root' | 'third' | 'fifth';
export type SpelledPitch = Readonly<{ letter: Letter; accidental: Accidental; octave: number }>;
export type Triad = readonly [SpelledPitch, SpelledPitch, SpelledPitch];
export type Inversion = 0 | 1 | 2;
export type DisplaySpellingMap = Readonly<Record<number, SpelledPitch | string>>;
export type MusicErrorCode = 'INVALID_PITCH' | 'INVALID_MIDI' | 'INVALID_QUALITY' | 'UNSUPPORTED_SPELLING' | 'UNSUPPORTED_INTERVAL' | 'INVALID_VOICING' | 'INVALID_DISPLAY_MAP';

export class MusicError extends Error {
  readonly code: MusicErrorCode;
  constructor(code: MusicErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'MusicError';
    this.code = code;
  }
}

export const LETTERS: readonly Letter[] = ['C','D','E','F','G','A','B'];
export const NATURAL_PC: Readonly<Record<Letter,number>> = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 };
export const ROLES: readonly Role[] = ['root','third','fifth'];
