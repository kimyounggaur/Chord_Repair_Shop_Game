import type { Inversion, Quality, Role, SpelledPitch, Triad } from '../music';

export type ChordTarget = Readonly<{
  root:SpelledPitch;
  quality:Quality;
  requiredMidi:readonly [number,number,number];
  requiredSpelling:Triad;
  registerMode:'exact'|'pitch-class';
  inversion:Inversion|null;
  spellingRequired:boolean;
}>;
export type VoiceSlot = Readonly<{id:string;pitch:SpelledPitch|null}>;
export type GradeCode = 'INVALID_DATA'|'INCOMPLETE'|'ROOT_MEMBER_MISSING'|'THIRD_MISMATCH'|'FIFTH_MISMATCH'|'MEMBERS_MISMATCH'|'REGISTER_MISMATCH'|'INVERSION_MISMATCH'|'SPELLING_MISMATCH'|'CORRECT';
export type Grade = Readonly<{
  status:'invalid'|'incomplete'|'incorrect'|'correct';
  codes:readonly GradeCode[];
  pitchClassCorrect:boolean;
  spellingCorrect:boolean;
  registerCorrect:boolean;
  inversionCorrect:boolean;
  mismatchedRoles:readonly Role[];
}>;
