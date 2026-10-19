import type { Order } from '../../content/types';
import { analyzeVoicing, assertMidi, equalMultiset, generateTriad, parseSpelledPitch, pitchClass, ROLES, spellForTask, toMidi, type SpelledPitch } from '../music';
import type { ChordTarget, Grade, GradeCode, VoiceSlot } from './types';

const TARGET_KEYS=['root','quality','requiredMidi','requiredSpelling','registerMode','inversion','spellingRequired'];
const exactKeys=(value:unknown,keys:readonly string[]):boolean=>!!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===keys.length && keys.every(key=>Object.hasOwn(value,key));
const pitchShape=(pitch:SpelledPitch):boolean=>exactKeys(pitch,['letter','accidental','octave']);
const spellingKey=(pitch:SpelledPitch):string=>`${pitch.letter}:${pitch.accidental}`;
const sameSpellings=(a:readonly SpelledPitch[],b:readonly SpelledPitch[]):boolean=>{
  const expected=b.map(spellingKey).sort();
  return a.length===b.length && a.map(spellingKey).sort().every((key,i)=>key===expected[i]);
};
const emptyGrade=(status:'invalid'|'incomplete',code:'INVALID_DATA'|'INCOMPLETE'):Grade=>({status,codes:[code],pitchClassCorrect:false,spellingCorrect:false,registerCorrect:false,inversionCorrect:false,mismatchedRoles:[]});

function validateTarget(target:ChordTarget):void {
  if (!exactKeys(target,TARGET_KEYS) || !pitchShape(target.root) || !['exact','pitch-class'].includes(target.registerMode) || ![0,1,2,null].includes(target.inversion) || typeof target.spellingRequired!=='boolean') throw new Error('Invalid target shape');
  if (!Array.isArray(target.requiredMidi) || target.requiredMidi.length!==3 || !Array.isArray(target.requiredSpelling) || target.requiredSpelling.length!==3 || [0,1,2].some(i=>!Object.hasOwn(target.requiredMidi,i) || !Object.hasOwn(target.requiredSpelling,i))) throw new Error('Invalid target tuple');
  const generated=generateTriad(target.root,target.quality);
  target.requiredMidi.forEach(assertMidi);
  if (target.requiredSpelling.some((pitch,i)=>!pitchShape(pitch) || toMidi(pitch)!==target.requiredMidi[i])) throw new Error('Target spelling/MIDI mismatch');
  if (!sameSpellings(target.requiredSpelling,generated) || !equalMultiset(target.requiredMidi.map(pitchClass),generated.map(pitch=>pitchClass(toMidi(pitch))))) throw new Error('Target does not match requested chord');
  if (target.registerMode==='exact' && target.inversion!==null && analyzeVoicing(target.requiredSpelling,target.root,target.quality).inversion!==target.inversion) throw new Error('Exact target contradicts inversion');
}

/** General spelling-preserving grading. Runtime misuse returns invalid, never a learner mistake. */
export function grade(slots:readonly VoiceSlot[],target:ChordTarget):Grade {
  try {
    validateTarget(target);
    if (!Array.isArray(slots) || slots.length!==3) return emptyGrade('invalid','INVALID_DATA');
    const ids=new Set<string>();
    for(const slot of slots) {
      if (!exactKeys(slot,['id','pitch']) || typeof slot.id!=='string' || slot.id.length===0 || slot.id.length>128 || ids.has(slot.id)) return emptyGrade('invalid','INVALID_DATA');
      ids.add(slot.id);
      if(slot.pitch!==null) {
        if(!pitchShape(slot.pitch)) return emptyGrade('invalid','INVALID_DATA');
        toMidi(slot.pitch);
      }
    }
    if(slots.some(slot=>slot.pitch===null)) return emptyGrade('incomplete','INCOMPLETE');
    const pitches=slots.map(slot=>slot.pitch as SpelledPitch);
    const midi=pitches.map(toMidi);
    const actualPc=midi.map(pitchClass);
    const expected=generateTriad(target.root,target.quality);
    const expectedPc=expected.map(pitch=>pitchClass(toMidi(pitch)));
    const pitchClassCorrect=equalMultiset(actualPc,expectedPc);
    const spellingCorrect=sameSpellings(pitches,expected);
    const registerCorrect=equalMultiset(midi,target.requiredMidi);
    const voicing=analyzeVoicing(pitches,target.root,target.quality);
    const inversionCorrect=pitchClassCorrect && (target.inversion===null || voicing.inversion===target.inversion);
    const mismatchedRoles=ROLES.filter((_,index)=>!actualPc.includes(expectedPc[index]));
    const codes:GradeCode[]=[];
    if(!pitchClassCorrect) {
      const roleCodes:readonly GradeCode[]=['ROOT_MEMBER_MISSING','THIRD_MISMATCH','FIFTH_MISMATCH'];
      ROLES.forEach((role,index)=>{if(mismatchedRoles.includes(role)) codes.push(roleCodes[index]);});
      codes.push('MEMBERS_MISMATCH');
    } else {
      if(target.registerMode==='exact' && !registerCorrect) codes.push('REGISTER_MISMATCH');
      if(!inversionCorrect) codes.push('INVERSION_MISMATCH');
      if(target.spellingRequired && !spellingCorrect) codes.push('SPELLING_MISMATCH');
    }
    const correct=codes.length===0;
    return {status:correct?'correct':'incorrect',codes:correct?['CORRECT']:codes,pitchClassCorrect,spellingCorrect,registerCorrect,inversionCorrect,mismatchedRoles};
  } catch {
    return emptyGrade('invalid','INVALID_DATA');
  }
}

export function orderToTarget(order:Order):ChordTarget {
  return {root:order.root,quality:order.quality,requiredMidi:order.targetMidi,requiredSpelling:order.target,registerMode:order.registerMode,inversion:order.inversion,spellingRequired:order.spellingRequired};
}

export function gradeChord(input:readonly (SpelledPitch|string|null)[],order:Order):Grade {
  try {
    if(!Array.isArray(input) || input.length!==3) return emptyGrade('invalid','INVALID_DATA');
    return grade(input.map((value,index)=>({id:`slot-${index}`,pitch:typeof value==='string'?parseSpelledPitch(value):value})),orderToTarget(order));
  } catch {
    return emptyGrade('invalid','INVALID_DATA');
  }
}

/** Keyboard adapter: validates the order's input range, then assigns contextual spelling. */
export function gradeMidi(input:readonly (number|null)[],order:Order):Grade {
  try {
    if(!Array.isArray(input) || input.length!==3) return emptyGrade('invalid','INVALID_DATA');
    const pitches=input.map(midi=>{
      if(midi===null) return null;
      assertMidi(midi);
      if(midi<order.allowedMidi[0] || midi>order.allowedMidi[1]) throw new Error('Outside order input range');
      return spellForTask(midi,order.root,order.quality,order.displaySpellingMap);
    });
    return gradeChord(pitches,order);
  } catch {
    return emptyGrade('invalid','INVALID_DATA');
  }
}
