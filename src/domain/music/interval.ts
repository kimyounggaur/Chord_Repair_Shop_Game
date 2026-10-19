import { toMidi } from './pitch';
import { LETTERS, MusicError, type SpelledPitch } from './types';

export type IntervalQuality = 'perfect' | 'major' | 'minor' | 'augmented' | 'diminished';
export type IntervalAnalysis = Readonly<{ diatonicNumber:number; semitoneDistance:number; quality:IntervalQuality; alteration:number }>;

/** Ascending simple and compound intervals. Descending/reversed-letter intervals are explicit unsupported inputs. */
export function analyzeInterval(from: SpelledPitch, to: SpelledPitch): IntervalAnalysis {
  const semitoneDistance = toMidi(to)-toMidi(from);
  const steps = (to.octave-from.octave)*7+LETTERS.indexOf(to.letter)-LETTERS.indexOf(from.letter);
  if (semitoneDistance < 0 || steps < 0) throw new MusicError('UNSUPPORTED_INTERVAL','Descending intervals are outside this API contract');
  const diatonicNumber = steps+1;
  const simpleSteps = steps%7;
  const baseline = [0,2,4,5,7,9,11][simpleSteps] + Math.floor(steps/7)*12;
  const alteration = semitoneDistance-baseline;
  const perfectFamily = [0,3,4].includes(simpleSteps);
  const quality: IntervalQuality = alteration === 0 ? (perfectFamily ? 'perfect' : 'major') : !perfectFamily && alteration === -1 ? 'minor' : alteration > 0 ? 'augmented' : 'diminished';
  return {diatonicNumber,semitoneDistance,quality,alteration};
}
