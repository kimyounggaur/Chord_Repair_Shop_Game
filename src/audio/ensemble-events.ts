import score from '../content/ensemble.v1.json';
import type {NoteEvent,Timbre} from './types';
export type Part='root'|'third'|'fifth';
export type EnsembleOptions={solo:Part|null;muted:readonly Part[]};
export type EnsembleEvent=NoteEvent&{bar:number;part:Part};
export const PARTS:readonly Part[]=['root','third','fifth'];
const timbres:Record<Part,Timbre>={root:'pluck',third:'reed',fifth:'bell'};
export function ensembleEvents(t0=0,generation=0,options:EnsembleOptions={solo:null,muted:[]}):readonly EnsembleEvent[]{
  const beat=60/score.bpm;return score.chords.flatMap((chord,bar)=>chord.flatMap((midi,index)=>{
    const part=PARTS[index];if(options.muted.includes(part)||options.solo!==null&&options.solo!==part)return [];
    const starts=bar===7?[0]:index===0?[0,2]:index===1?[1,3]:[.5,1.5,2.5,3.5];
    const gate=(bar===7?3.5:index===0?1.4:index===1?.8:.3)*beat;
    return starts.map((offset,eventIndex)=>({id:`ensemble-${generation}-${bar}-${part}-${eventIndex}`,groupId:bar===7?`ensemble-${generation}-final`:`ensemble-${generation}-${bar}-${offset}`,midi,at:t0+bar*4*beat+offset*beat,gate,velocity:1,priority:'ensemble' as const,generation,timbre:timbres[part],bar,part}));
  }));
}
export const ENSEMBLE_SECONDS=score.endSeconds;
