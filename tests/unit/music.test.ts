import { describe, expect, it } from 'vitest';
import {
  MusicError, analyzeInterval, analyzeVoicing, formatPitch, generateTriad,
  midiToFrequency, parseSpelledPitch as p, pitchClass, spellForTask, toMidi,
} from '../../src/domain/music';

describe('strict scientific pitch notation', () => {
  it.each([['C4',60],['Eb4',63],['E4',64],['G4',67],['B#3',60],['Cb4',59],['Cbb4',58],['B##-2',1],['G9',127]])('%s = %s', (name,midi) => {
    expect(toMidi(p(name))).toBe(midi);
    expect(formatPitch(p(name))).toBe(name);
  });
  it.each(['c4',' C4','C4 ','E♭4','C+4','C04','C-0','C4.5','H4','C###4','C10','C-2',''])('rejects %j', value => {
    expect(() => p(value)).toThrow(MusicError);
  });
  it('preserves spelling octave and renders display accidentals', () => {
    expect(p('B#3').octave).toBe(3);
    expect(formatPitch(p('Eb4'),'unicode')).toBe('E♭4');
    expect(formatPitch(p('F##4'),'unicode')).toBe('F𝄪4');
  });
  it('validates runtime objects, MIDI, and safe negative pitch classes', () => {
    for (const bad of [{letter:'H',accidental:0,octave:4},{letter:'C',accidental:3,octave:4},{letter:'C',accidental:0,octave:NaN},{letter:'C',accidental:0,octave:Infinity}]) {
      expect(() => toMidi(bad as never)).toThrow(MusicError);
    }
    for (const bad of [NaN,Infinity,-1,128,60.5]) expect(() => midiToFrequency(bad)).toThrow(MusicError);
    expect(pitchClass(-1)).toBe(11);
    expect(midiToFrequency(69)).toBe(440);
    const frequencies = Array.from({length:15},(_,i)=>midiToFrequency(i+60));
    expect(frequencies.every((n,i)=>i===0 || n>frequencies[i-1])).toBe(true);
  });
  it('round-trips every supported spelling', () => {
    for (const letter of ['C','D','E','F','G','A','B'] as const) {
      for (const accidental of [-2,-1,0,1,2] as const) {
        for (let octave=-2;octave<=10;octave++) {
          const pitch = {letter,accidental,octave};
          const raw = 12*(octave+1)+({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[letter])+accidental;
          if (raw>=0 && raw<=127) expect(p(formatPitch(pitch))).toEqual(pitch);
          else expect(()=>toMidi(pitch)).toThrow(MusicError);
        }
      }
    }
  });
});

describe('triads, contextual spelling, intervals, and voicing', () => {
  it.each([
    ['C4','major',['C4','E4','G4']],[ 'C4','minor',['C4','Eb4','G4']],
    ['F4','major',['F4','A4','C5']],[ 'F4','minor',['F4','Ab4','C5']],
    ['G4','major',['G4','B4','D5']],[ 'G4','minor',['G4','Bb4','D5']],
    ['Eb4','major',['Eb4','G4','Bb4']],['F#4','major',['F#4','A#4','C#5']],
  ] as const)('generates %s %s by letter', (root,quality,names) => {
    const triad = generateTriad(Object.freeze(p(root)),quality);
    expect(triad.map(n=>formatPitch(n))).toEqual(names);
    expect(triad.map(n=>toMidi(n)-toMidi(p(root)))).toEqual([0,quality==='major'?4:3,7]);
  });
  it('checks all supported roots and rejects unsupported triple accidentals explicitly', () => {
    const letters = ['C','D','E','F','G','A','B'] as const;
    for (const [index,letter] of letters.entries()) for (const accidental of [-2,-1,0,1,2] as const) for (const quality of ['major','minor'] as const) {
      const root = Object.freeze({letter,accidental,octave:4});
      try {
        const triad = generateTriad(root,quality);
        expect(triad.map(n=>n.letter)).toEqual([letter,letters[(index+2)%7],letters[(index+4)%7]]);
        expect(triad.map(n=>toMidi(n)-toMidi(root))).toEqual([0,quality==='major'?4:3,7]);
      } catch (error) {
        expect(error).toBeInstanceOf(MusicError);
        expect((error as MusicError).code).toBe('UNSUPPORTED_SPELLING');
      }
    }
    expect(()=>generateTriad(p('B##4'),'major')).toThrow(/UNSUPPORTED_SPELLING/);
  });
  it('distinguishes diatonic and chromatic interval distances', () => {
    expect(analyzeInterval(p('C4'),p('Eb4'))).toMatchObject({diatonicNumber:3,semitoneDistance:3,quality:'minor'});
    expect(analyzeInterval(p('C4'),p('D#4'))).toMatchObject({diatonicNumber:2,semitoneDistance:3,quality:'augmented'});
    expect(analyzeInterval(p('C4'),p('E5'))).toMatchObject({diatonicNumber:10,semitoneDistance:16,quality:'major'});
    expect(()=>analyzeInterval(p('E4'),p('C4'))).toThrow(/UNSUPPORTED_INTERVAL/);
  });
  it('uses target spellings across octave boundaries before display map', () => {
    expect(formatPitch(spellForTask(63,p('C4'),'minor',{}))).toBe('Eb4');
    expect(formatPitch(spellForTask(70,p('G4'),'minor',{70:p('A#4')}))).toBe('Bb4');
    expect(formatPitch(spellForTask(60,p('B#3'),'major',{}))).toBe('B#3');
    expect(formatPitch(spellForTask(75,p('C4'),'minor',{}))).toBe('Eb5');
    expect(formatPitch(spellForTask(61,p('C4'),'major',{61:p('Db4')}))).toBe('Db4');
    expect(()=>spellForTask(61,p('C4'),'major',{})).toThrow(/INVALID_DISPLAY_MAP/);
    expect(()=>spellForTask(61,p('C4'),'major',{61:p('D4')})).toThrow(/INVALID_DISPLAY_MAP/);
  });
  it('takes the actual lowest MIDI and separates root position from close voicing', () => {
    const shuffled = Object.freeze(['C5','E4','G4'].map(n=>Object.freeze(p(n))));
    expect(analyzeVoicing(shuffled,p('C4'),'major')).toMatchObject({membersCorrect:true,inversion:1,bassRole:'third',roles:['root','third','fifth'],closePosition:true});
    expect(analyzeVoicing(['C4','G4','E5'].map(p),p('C4'),'major')).toMatchObject({inversion:0,closePosition:false});
    expect(analyzeVoicing(['G3','E4','C4'].map(p),p('C4'),'major')).toMatchObject({inversion:2});
    expect(analyzeVoicing(['C4','E4','E4'].map(p),p('C4'),'major')).toMatchObject({membersCorrect:false,inversion:null,bassRole:null,closePosition:null});
    expect(shuffled.map(n=>formatPitch(n))).toEqual(['C5','E4','G4']);
  });
});
