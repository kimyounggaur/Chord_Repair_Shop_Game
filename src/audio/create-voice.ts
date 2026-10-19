import {midiToFrequency} from '../domain/music/pitch';
import {applyEnvelope,envelopeValueAt,holdAt,rampValueAt,type Ramp} from './envelope';
import {MAX_VOICES,TIMBRE_CONFIGS,normalizedHarmonics,validateEvent,type NoteEvent,type SynthConfig} from './types';

export type Voice={readonly event:NoteEvent;readonly sources:readonly OscillatorNode[];readonly gain:GainNode;readonly endsAt:number;stop:(now:number,fade?:number)=>void;dispose:()=>void};
/** Fixed worst-case headroom makes 24 normalized musical voices <= .8 before user master. */
export function createVoice(context:BaseAudioContext,event:NoteEvent,output:AudioNode,onEnded:()=>void=()=>undefined,config:SynthConfig=TIMBRE_CONFIGS[event.timbre??'reference']):Voice{
  validateEvent(event);
  const partials=normalizedHarmonics(midiToFrequency(event.midi),context.sampleRate,event.timbre==='sine'?[1]:config.harmonics);
  const gain=context.createGain(),sources:OscillatorNode[]=[],partialGains:GainNode[]=[];
  let disposed=false,ended=0,stopAt=event.at+event.gate+config.release,cancellationRamp:Ramp|null=null;
  const peak=event.velocity*.8/MAX_VOICES;
  const dispose=()=>{if(disposed)return;disposed=true;for(const source of sources){source.onended=null;try{source.stop(context.currentTime);}catch{/* Already ended, or construction failed before start. */}source.disconnect();}for(const partialGain of partialGains)partialGain.disconnect();gain.disconnect();onEnded();};
  const stop=(now:number,fade=.01)=>{
    if(disposed)return;
    if(!Number.isFinite(now)||now<0||!Number.isFinite(fade)||fade<0)throw new RangeError('Invalid stop time');
    const end=event.at>now?now:Math.min(stopAt,now+fade);
    if(end>=stopAt)return;
    const current=cancellationRamp?rampValueAt(cancellationRamp,now):peak*envelopeValueAt(now,event.at,event.gate,config);
    holdAt(gain.gain,now,current);gain.gain.linearRampToValueAtTime(0,end);stopAt=end;
    cancellationRamp={start:now,end,from:current,to:0};
    for(const source of sources)source.stop(end);
    if(event.at>now)dispose();
  };
  try{
    gain.connect(output);applyEnvelope(gain.gain,event.at,event.gate,config,peak);
    for(const partial of partials){
      const source=context.createOscillator();sources.push(source);const part=context.createGain();partialGains.push(part);
      source.type='sine';source.frequency.setValueAtTime(partial.frequency,event.at);part.gain.setValueAtTime(partial.amplitude,event.at);source.connect(part);part.connect(gain);
      source.onended=()=>{ended++;if(ended===sources.length)dispose();};
    }
    for(const source of sources){source.start(event.at);source.stop(stopAt);}
  }catch(error){
    for(const source of sources){try{source.stop(context.currentTime);}catch{/* The source may not yet have started. */}}
    dispose();throw error;
  }
  return {event,sources,gain,get endsAt(){return stopAt;},stop,dispose};
}
