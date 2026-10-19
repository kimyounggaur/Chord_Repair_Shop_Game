import {finiteNonnegative,type SynthConfig} from './types';

export function envelopeValueAt(time:number,start:number,gate:number,config:SynthConfig):number{
  const elapsed=time-start;
  if(elapsed<=0)return 0;
  const held=(t:number)=>t<config.attack?t/config.attack:t<config.attack+config.decay?1-(1-config.sustain)*(t-config.attack)/config.decay:config.sustain;
  if(elapsed<gate)return held(elapsed);
  if(elapsed>=gate+config.release)return 0;
  return held(gate)*(1-(elapsed-gate)/config.release);
}
export function applyEnvelope(param:AudioParam,start:number,gate:number,config:SynthConfig,peak=1):void{
  finiteNonnegative(start,'start');finiteNonnegative(gate,'gate');finiteNonnegative(peak,'peak');
  if(gate===0)throw new RangeError('Gate must be positive');
  param.setValueAtTime(0,start);
  if(gate>=config.attack)param.linearRampToValueAtTime(peak,start+config.attack);
  if(gate>=config.attack+config.decay)param.linearRampToValueAtTime(peak*config.sustain,start+config.attack+config.decay);
  const gateValue=peak*envelopeValueAt(start+gate,start,gate,config);
  if(gate<config.attack+config.decay)param.linearRampToValueAtTime(gateValue,start+gate);
  else param.setValueAtTime(gateValue,start+gate);
  param.linearRampToValueAtTime(0,start+gate+config.release);
}
/** Tracked automation is used instead of assuming AudioParam.value is the rendered value. */
export function holdAt(param:AudioParam,at:number,value:number):void{
  if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(at);
  else{param.cancelScheduledValues(at);param.setValueAtTime(value,at);}
}
export type Ramp=Readonly<{start:number;end:number;from:number;to:number}>;
export function rampValueAt(ramp:Ramp,time:number):number{
  if(time<=ramp.start)return ramp.from;if(time>=ramp.end)return ramp.to;
  return ramp.from+(ramp.to-ramp.from)*(time-ramp.start)/(ramp.end-ramp.start);
}
