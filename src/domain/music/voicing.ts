import { generateTriad } from './chord';
import { pitchClass, toMidi } from './pitch';
import { MusicError, ROLES, type Inversion, type Quality, type Role, type SpelledPitch } from './types';

export function equalMultiset(a: readonly number[], b: readonly number[]): boolean {
  const sortedB=[...b].sort((x,y)=>x-y);
  return a.length === b.length && [...a].sort((x,y)=>x-y).every((value,index)=>value === sortedB[index]);
}

export type VoicingAnalysis = Readonly<{
  membersCorrect:boolean;
  inversion:Inversion | null;
  bassRole:Role | null;
  bassMidi:number;
  roles:readonly (Role | null)[];
  closePosition:boolean | null;
}>;

export function analyzeVoicing(pitches: readonly SpelledPitch[], root: SpelledPitch, quality: Quality): VoicingAnalysis {
  if (!Array.isArray(pitches) || pitches.length !== 3) throw new MusicError('INVALID_VOICING','Expected exactly three pitches');
  const expected = generateTriad(root,quality).map(p=>pitchClass(toMidi(p)));
  const midi = Array.from(pitches,toMidi);
  const actual = midi.map(pitchClass);
  const membersCorrect = equalMultiset(actual,expected);
  const roles = actual.map(pc=>expected.includes(pc) ? ROLES[expected.indexOf(pc)] : null);
  const bassMidi = Math.min(...midi);
  const roleIndex = expected.indexOf(pitchClass(bassMidi));
  return {
    membersCorrect,
    inversion:membersCorrect ? roleIndex as Inversion : null,
    bassRole:membersCorrect ? ROLES[roleIndex] : null,
    bassMidi,
    roles,
    closePosition:membersCorrect ? Math.max(...midi)-bassMidi < 12 : null,
  };
}
