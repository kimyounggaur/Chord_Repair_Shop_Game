import {assertMidi} from '../domain/music/pitch';
import type {AudioSnapshot,NoteEvent} from './types';
export type AudioPlan=Readonly<{events:readonly NoteEvent[];endAt:number}>;
export function captureSnapshot(input:AudioSnapshot):AudioSnapshot{
  if(!input.orderId||!input.attemptId||!Number.isSafeInteger(input.revision)||input.revision<0||input.original.length!==3||input.current.length!==3)throw new RangeError('Invalid audio snapshot');
  [...input.original,...input.current].forEach(assertMidi);
  return Object.freeze({...input,original:Object.freeze([...input.original]),current:Object.freeze([...input.current])});
}
const chord=(notes:readonly number[],at:number,generation:number,name:string,gate=.9,priority:NoteEvent['priority']='compare'):readonly NoteEvent[]=>notes.map((midi,index)=>Object.freeze({id:`${generation}:${name}:${index}`,groupId:`${generation}:${name}`,midi,at,gate,velocity:1,priority,generation,timbre:'reference'}));
export function comparisonPlan(snapshot:AudioSnapshot,t0:number,generation:number):AudioPlan{
  return {events:[...chord(snapshot.original,t0+.05,generation,'original'),...chord(snapshot.current,t0+1.35,generation,'current')],endAt:t0+2.40};
}
export function singlePlan(snapshot:AudioSnapshot,version:'original'|'current',t0:number,generation:number):AudioPlan{
  return {events:chord(snapshot[version],t0+.05,generation,version,.9,'normal'),endAt:t0+1.10};
}
export function arpeggioPlan(snapshot:AudioSnapshot,t0:number,generation:number,version:'original'|'current'='current'):AudioPlan{
  const notes=[...snapshot[version]].sort((a,b)=>a-b);
  return {events:[...notes.map((midi,index)=>chord([midi],t0+.05+index*.45,generation,`single${index}`,.25,'normal')[0]),...chord(notes,t0+1.40,generation,'together',.9,'normal')],endAt:t0+2.45};
}
