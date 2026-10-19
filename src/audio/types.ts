import {midiToFrequency} from '../domain/music/pitch';

export type AudioState='locked'|'preparing'|'ready'|'playing'|'paused'|'unavailable';
export type Priority='preview'|'normal'|'ensemble'|'compare';
export type Timbre='reference'|'sine'|'pluck'|'reed'|'bell';
export type SynthConfig=Readonly<{version:number;attack:number;decay:number;sustain:number;release:number;gate:number;master:number;harmonics:readonly number[]}>;
export const REFERENCE_CONFIG:SynthConfig=Object.freeze({version:1,attack:.008,decay:.070,sustain:.55,release:.120,gate:.9,master:.35,harmonics:Object.freeze([1,.18,.08])});
export const TIMBRE_CONFIGS:Readonly<Record<Timbre,SynthConfig>>={reference:REFERENCE_CONFIG,sine:{...REFERENCE_CONFIG,harmonics:[1]},pluck:{...REFERENCE_CONFIG,attack:.004,decay:.06,sustain:.28,harmonics:[1,.35,.12,.05]},reed:{...REFERENCE_CONFIG,attack:.015,decay:.06,sustain:.55,harmonics:[1,.12,.2,.05]},bell:{...REFERENCE_CONFIG,attack:.004,decay:.10,sustain:.2,harmonics:[1,.12,.35,.07]}};
export const MAX_VOICES=24;
export const PRIORITY:Readonly<Record<Priority,number>>={preview:0,normal:1,ensemble:1,compare:2};
export type NoteEvent=Readonly<{id:string;groupId:string;midi:number;at:number;gate:number;velocity:number;priority:Priority;generation:number;timbre?:Timbre}>;
export type AudioSnapshot=Readonly<{orderId:string;attemptId:string;revision:number;original:readonly number[];current:readonly number[]}>;
export type AudioView=Readonly<{phase:AudioState;message:string;volume:number;muted:boolean;generation:number}>;
export type AudioRuntime={createContext:()=>AudioContext;isHidden:()=>boolean;setTimer:(fn:()=>void,ms:number)=>ReturnType<typeof setTimeout>;clearTimer:(timer:ReturnType<typeof setTimeout>)=>void};

export function finiteNonnegative(value:number,name:string):void{
  if(!Number.isFinite(value)||value<0)throw new RangeError(`${name} must be finite and nonnegative`);
}
export function normalizedHarmonics(frequency:number,sampleRate:number,amplitudes:readonly number[]):readonly {frequency:number;amplitude:number}[]{
  if(!Number.isFinite(frequency)||frequency<=0||!Number.isFinite(sampleRate)||sampleRate<=0)throw new RangeError('Invalid frequency or sample rate');
  if(amplitudes.length===0||amplitudes.some(a=>!Number.isFinite(a)||a<0))throw new RangeError('Invalid harmonics');
  const selected=amplitudes.map((amplitude,index)=>({frequency:frequency*(index+1),amplitude})).filter(p=>p.frequency<sampleRate/2&&p.amplitude>0);
  const sum=selected.reduce((total,p)=>total+p.amplitude,0);
  if(sum<=0)throw new RangeError('No sub-Nyquist fundamental');
  return selected.map(p=>({frequency:p.frequency,amplitude:p.amplitude/sum}));
}
export function validateEvent(event:NoteEvent):void{
  midiToFrequency(event.midi);finiteNonnegative(event.at,'at');finiteNonnegative(event.gate,'gate');finiteNonnegative(event.velocity,'velocity');
  if(event.velocity>1||event.gate<=0||!Number.isSafeInteger(event.generation)||event.generation<0||!Object.hasOwn(PRIORITY,event.priority)||!event.id||!event.groupId)throw new RangeError('Invalid note event');
}
