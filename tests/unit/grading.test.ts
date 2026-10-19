import { describe, expect, it } from 'vitest';
import { loadOrders } from '../../src/content/loader';
import { grade, gradeChord, gradeMidi, orderToTarget, type ChordTarget } from '../../src/domain/grading';
import { parseSpelledPitch as p, type SpelledPitch } from '../../src/domain/music';

const slots = (notes: readonly (string|null)[]) => notes.map((pitch,i)=>({id:`slot-${i}`,pitch:pitch===null?null:p(pitch)}));
const permutations = <T,>(a: readonly T[]): T[][] => a.length===0 ? [[]] : a.flatMap((n,i)=>permutations(a.filter((_,j)=>j!==i)).map(rest=>[n,...rest]));

describe('strict grading',()=>{
  it('rejects all initial chords with the intended educational cause and accepts every target permutation',()=>{
    for (const [index,order] of loadOrders().entries()) {
      expect(gradeChord(order.initial,order).status).toBe('incorrect');
      expect(gradeChord(order.initial,order).codes[0]).toBe(index<6?'THIRD_MISMATCH':index===6?'FIFTH_MISMATCH':'ROOT_MEMBER_MISSING');
      for (const notes of permutations(order.target)) expect(gradeChord(Object.freeze(notes),order).status).toBe('correct');
    }
  });
  it('compares multiplicity and distinguishes wrong register from chord membership',()=>{
    const order=loadOrders()[0];
    expect(gradeChord(['C4','E4','E4'],order)).toMatchObject({status:'incorrect',pitchClassCorrect:false,inversionCorrect:false,codes:['FIFTH_MISMATCH','MEMBERS_MISMATCH'],mismatchedRoles:['fifth']});
    expect(gradeChord(['C3','E3','G3'],order)).toMatchObject({status:'incorrect',pitchClassCorrect:true,spellingCorrect:true,registerCorrect:false,inversionCorrect:true,codes:['REGISTER_MISMATCH']});
  });
  it('supports pitch-class mode and bass inversion independently of ordering and width',()=>{
    const base={...orderToTarget(loadOrders()[0]),registerMode:'pitch-class'} as const;
    for (const inversion of [1,0,null] as const) {
      expect(grade(slots(['C5','E4','G4']),{...base,inversion}).status).toBe(inversion===0?'incorrect':'correct');
    }
    expect(grade(slots(['E4','G4','C5']),{...base,inversion:0}).codes).toEqual(['INVERSION_MISMATCH']);
    expect(grade(slots(['C4','G4','E5']),{...base,inversion:0})).toMatchObject({status:'correct',registerCorrect:false,inversionCorrect:true});
  });
  it('observes wrong spelling without blocking a pitch-only task and never silently respells general input',()=>{
    const base=orderToTarget(loadOrders()[1]);
    expect(grade(slots(['C4','D#4','G4']),{...base,spellingRequired:true})).toMatchObject({status:'incorrect',pitchClassCorrect:true,spellingCorrect:false,codes:['SPELLING_MISMATCH']});
    expect(grade(slots(['C4','D#4','G4']),base)).toMatchObject({status:'correct',spellingCorrect:false});
    expect(gradeMidi([60,63,67],loadOrders()[1])).toMatchObject({status:'correct',spellingCorrect:true});
  });
  it('prioritizes invalid data over null, and distinguishes incomplete from wrong count',()=>{
    const target=orderToTarget(loadOrders()[0]);
    expect(grade(slots(['C4',null,'G4']),target).status).toBe('incomplete');
    expect(grade(slots(['C4','E4']),target).codes).toEqual(['INVALID_DATA']);
    expect(grade([{id:'same',pitch:null},{id:'same',pitch:p('E4')},{id:'last',pitch:p('G4')}],target).status).toBe('invalid');
    expect(grade([{id:'a',pitch:null},{id:'b',pitch:{letter:'C',accidental:0,octave:NaN} as SpelledPitch},{id:'c',pitch:p('G4')}],target).status).toBe('invalid');
    expect(grade(slots(['C4',null,'G4']),{...target,requiredMidi:[60,65,67]}).status).toBe('invalid');
    expect(grade(slots(['C4','E4','G4']),{...target,quality:'augmented'} as unknown as ChordTarget).status).toBe('invalid');
    expect(grade(slots(['C4','E4','G4']),{...target,registerMode:'pitch-class',requiredSpelling:new Array(3)} as unknown as ChordTarget).status).toBe('invalid');
    expect(gradeMidi([60,Infinity,67],loadOrders()[0]).status).toBe('invalid');
  });
  it('keeps frozen input arrays and pitches unchanged',()=>{
    const pitches=Object.freeze(['G4','C4','E4'].map(n=>Object.freeze(p(n))));
    const before=JSON.stringify(pitches);
    expect(gradeChord(pitches,loadOrders()[0]).status).toBe('correct');
    expect(JSON.stringify(pitches)).toBe(before);
  });
});
