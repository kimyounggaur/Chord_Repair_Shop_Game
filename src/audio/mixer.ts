import {holdAt,rampValueAt,type Ramp} from './envelope';
import {REFERENCE_CONFIG} from './types';

export function createMixer(context:BaseAudioContext,initialVolume=REFERENCE_CONFIG.master){
  if(!Number.isFinite(initialVolume)||initialVolume<0||initialVolume>1)throw new RangeError('Volume must be 0..1');
  const input=context.createGain();input.connect(context.destination);
  let volume=initialVolume,muted=false;
  let ramp:Ramp={start:context.currentTime,end:context.currentTime,from:volume,to:volume};
  input.gain.setValueAtTime(volume,context.currentTime);
  const update=()=>{const now=context.currentTime;const from=rampValueAt(ramp,now);holdAt(input.gain,now,from);const to=muted?0:volume;input.gain.linearRampToValueAtTime(to,now+.01);ramp={start:now,end:now+.01,from,to};};
  return {input,setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw new RangeError('Volume must be 0..1');if(volume===value)return;volume=value;update();},setMuted(value:boolean){if(muted===value)return;muted=value;update();},valueAt(time:number){return rampValueAt(ramp,time);},dispose(){input.disconnect();}};
}
export type Mixer=ReturnType<typeof createMixer>;
