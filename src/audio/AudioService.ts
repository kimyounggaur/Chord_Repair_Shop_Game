import {createVoice,type Voice} from './create-voice';
import {createMixer,type Mixer} from './mixer';
import {MAX_VOICES,PRIORITY,REFERENCE_CONFIG,validateEvent,type AudioRuntime,type AudioState,type AudioView,type NoteEvent} from './types';

const defaults:AudioRuntime={createContext:()=>{if(typeof AudioContext==='undefined')throw new Error('unsupported');return new AudioContext();},isHidden:()=>typeof document!=='undefined'&&document.hidden,setTimer:(fn,ms)=>setTimeout(fn,ms),clearTimer:timer=>clearTimeout(timer)};
export class AudioService{
  private readonly runtime:AudioRuntime;
  private context:AudioContext|null=null;private mixer:Mixer|null=null;
  private voices=new Map<string,Voice>();private listeners=new Set<()=>void>();
  private view:AudioView=Object.freeze({phase:'locked',message:'소리를 켜려면 눌러 주세요.',volume:.35,muted:false,generation:0});
  private contextCreations=0;private scheduledEvents=0;private listenerBindings=0;private peakVoices=0;
  private fallback=false;private resumePromise:Promise<void>|null=null;
  private pending:readonly NoteEvent[]|null=null;private sequence=0;private pausedByHost=false;private heldGeneration:number|null=null;private lifecycleBindings=0;private suspensionPromise:Promise<void>|null=null;
  constructor(runtime:Partial<AudioRuntime>={}){this.runtime={...defaults,...runtime};}
  status=():AudioState=>this.view.phase;
  message=():string=>this.view.message;
  getSnapshot=():AudioView=>this.view;
  subscribe=(listener:()=>void):(()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private update(patch:Partial<AudioView>){const next={...this.view,...patch};if(Object.keys(next).every(key=>next[key as keyof AudioView]===this.view[key as keyof AudioView]))return;this.view=Object.freeze(next);for(const listener of [...this.listeners])listener();}
  getDiagnostics=()=>Object.freeze({phase:this.status(),generation:this.view.generation,volume:this.view.volume,muted:this.view.muted,musicalVoices:this.voices.size,peakVoices:this.peakVoices,contextCreations:this.contextCreations,scheduledEvents:this.scheduledEvents,pendingRequests:this.pending?1:0,listenerBindings:this.listenerBindings+this.lifecycleBindings,subscriptions:this.listeners.size,fallback:this.fallback,currentTime:this.context?.currentTime??0,contextState:this.context?.state??'absent'});
  get currentTime(){return this.context?.currentTime??0;}
  get generation(){return this.view.generation;}
  isRunning(){return this.context?.state==='running'&&!this.runtime.isHidden()&&!this.pausedByHost;}
  setTimer=(fn:()=>void,ms:number)=>this.runtime.setTimer(fn,ms);
  clearTimer=(timer:ReturnType<typeof setTimeout>)=>this.runtime.clearTimer(timer);
  setVolume=(volume:number)=>{if(!Number.isFinite(volume)||volume<0||volume>1)throw new RangeError('Volume must be 0..1');this.mixer?.setVolume(volume);this.update({volume});};
  setMuted=(muted:boolean)=>{this.mixer?.setMuted(muted);this.update({muted});};
  setMessage(message:string){this.update({message});}
  trackLifecycleListeners(count:number){this.lifecycleBindings+=count;let active=true;return()=>{if(active){active=false;this.lifecycleBindings-=count;}};}
  holdPlayback(generation:number){if(generation===this.generation)this.heldGeneration=generation;}
  interrupt(message:string){this.stopAll();this.pausedByHost=true;this.update({phase:'paused',message});}
  private onStateChange=()=>{if(this.context?.state!=='running'&&!this.pausedByHost){this.pausedByHost=true;this.stopAll();this.update({phase:'paused',message:'작업은 그대로예요. 다시 듣기를 누르면 재생돼요.'});void this.suspendContext();}};
  private releaseContext(){if(this.context){this.context.removeEventListener('statechange',this.onStateChange);this.listenerBindings--;for(const voice of [...this.voices.values()])voice.dispose();this.mixer?.dispose();}this.context=null;this.mixer=null;this.resumePromise=null;}
  async enable():Promise<boolean>{
    const token=this.generation;
    if(this.runtime.isHidden())return false;
    try{
      if(this.suspensionPromise)await this.suspensionPromise;
      if(token!==this.generation||this.runtime.isHidden())return false;
      this.pausedByHost=false;
      if(!this.context||this.context.state==='closed'){
        this.releaseContext();this.context=this.runtime.createContext();this.contextCreations++;this.mixer=createMixer(this.context,this.view.volume);this.mixer.setMuted(this.view.muted);this.context.addEventListener('statechange',this.onStateChange);this.listenerBindings++;
      }
      this.update({phase:'preparing',message:'소리를 준비하고 있어요.'});
      if(this.context.state!=='running'){
        if(!this.resumePromise){const promise=this.context.resume();this.resumePromise=promise;void promise.finally(()=>{if(this.resumePromise===promise)this.resumePromise=null;}).catch(()=>undefined);}
        await this.resumePromise;
      }
      if(token!==this.generation)return false;
      if(!this.isRunning()){this.update({phase:'paused',message:'소리를 켜려면 다시 눌러 주세요.'});return false;}
      this.update({phase:this.voices.size?'playing':'ready',message:'기기 음량을 낮게 시작해 주세요.'});return true;
    }catch{if(token===this.generation)this.update({phase:this.context?'locked':'unavailable',message:this.context?'소리를 켜려면 다시 눌러 주세요.':'이 브라우저에서는 소리 재생을 사용할 수 없어요.'});return false;}
  }
  beginRequest():number{this.stopAll();return this.generation;}
  previewNote=(midi:number):void=>{
    const generation=this.beginRequest();const id=`preview-${++this.sequence}`;
    const play=()=>{
      if(generation!==this.generation||!this.isRunning())return;
      // Stay within the design's 5–20ms lead. A running context does not need
      // another asynchronous enable or its extra preparing/ready UI updates.
      const admitted=this.scheduleGroup([{id,groupId:id,midi,at:this.currentTime+.02,gate:.35,velocity:1,priority:'preview',generation}]);
      if(!admitted&&generation===this.generation&&this.status()!=='unavailable')this.update({message:'미리듣기 준비가 늦어졌어요. 다시 눌러 주세요.'});
    };
    if(this.isRunning()){play();return;}
    void this.enable().then(ready=>{if(ready)play();}).catch(()=>{this.update({phase:'unavailable',message:'소리를 준비하지 못했어요. 소리 없이 계속할 수 있어요.'});});
  };
  private freed(id:string){this.voices.delete(id);if(this.pending&&this.voices.size+this.pending.length<=MAX_VOICES){const events=this.pending;this.pending=null;if(events.every(e=>e.at>=this.currentTime&&e.generation===this.generation))this.scheduleGroup(events);else if(events.every(e=>e.generation===this.generation)){this.stopAll();this.update({phase:'paused',message:'재생 준비가 늦어졌어요. 다시 듣기를 눌러 주세요.'});}}
    if(!this.voices.size&&this.status()==='playing'&&this.heldGeneration!==this.generation)this.update({phase:'ready'});
  }
  scheduleGroup(events:readonly NoteEvent[]):boolean{
    if(!events.length)return true;
    for(const event of events)validateEvent(event);
    if(this.pending)return false;
    if(events.length>MAX_VOICES||new Set(events.map(e=>e.id)).size!==events.length||events.some(e=>this.voices.has(e.id)))throw new RangeError('Invalid or duplicate voice group');
    if(!this.context||!this.mixer||!this.isRunning()||events.some(e=>e.generation!==this.generation||e.at<this.currentTime))return false;
    const incoming=Math.min(...events.map(e=>PRIORITY[e.priority]));
    if(this.voices.size+events.length>MAX_VOICES){
      const need=this.voices.size+events.length-MAX_VOICES;
      const candidates=[...this.voices.values()].filter(v=>v.event.priority==='preview'&&PRIORITY[v.event.priority]<=incoming).sort((a,b)=>a.event.at-b.event.at);
      if(candidates.length<need)return false;
      const admissionAt=Math.max(this.currentTime,...candidates.slice(0,need).map(v=>v.event.at>this.currentTime?this.currentTime:Math.min(v.endsAt,this.currentTime+.008)));
      if(events.some(e=>e.at<admissionAt))return false;
      this.pending=events.map(e=>Object.freeze({...e}));for(const voice of candidates.slice(0,need))voice.stop(this.currentTime,.008);return true;
    }
    const created:Voice[]=[];
    try{
      for(const original of events){const event=Object.freeze({...original,timbre:this.fallback?'sine' as const:original.timbre});const voice=createVoice(this.context,event,this.mixer.input,()=>this.freed(event.id));created.push(voice);this.voices.set(event.id,voice);}
    }catch{
      for(const voice of created){voice.stop(this.currentTime,0);voice.dispose();}
      if(!this.fallback){this.fallback=true;return this.scheduleGroup(events.map(e=>({...e,timbre:'sine'})));}
      this.stopAll();this.update({phase:'unavailable',message:'소리를 준비하지 못했어요. 소리 없이 계속할 수 있어요.'});return false;
    }
    this.scheduledEvents+=created.length;this.peakVoices=Math.max(this.peakVoices,this.voices.size);this.update({phase:'playing',message:'재생 중이에요.'});return true;
  }
  cancelGeneration(generation:number,fade=.01){if(this.pending?.some(e=>e.generation===generation))this.pending=null;for(const voice of [...this.voices.values()])if(voice.event.generation===generation)voice.stop(this.currentTime,fade);}
  stopAll=():void=>{this.pending=null;this.heldGeneration=null;this.update({generation:this.generation+1});for(const voice of [...this.voices.values()])voice.stop(this.currentTime,.01);if(this.status()!=='locked'&&this.status()!=='unavailable'){const preserve=this.status()==='paused';this.update({phase:this.isRunning()?'ready':'paused',message:preserve?this.message():'재생을 멈췄어요.'});}};
  private async suspendContext():Promise<void>{
    if(this.suspensionPromise)return this.suspensionPromise;
    const context=this.context;if(!context)return;
    // A suspended audio clock cannot reach a scheduled fade's onended callback.
    // Dispose the captured sources themselves, including when suspension fails.
    // Await this whole operation on enable so cleanup cannot kill a new request.
    const cancelled=[...this.voices.values()];
    const operation=(async()=>{try{if(context.state!=='closed')await context.suspend();}catch{/* Keep learning available with audio paused. */}finally{for(const voice of cancelled)voice.dispose();}})();
    this.suspensionPromise=operation;
    try{await operation;}finally{if(this.suspensionPromise===operation)this.suspensionPromise=null;}
  }
  async pause():Promise<void>{this.pausedByHost=true;this.stopAll();this.update({phase:'paused',message:'작업은 그대로예요. 다시 듣기를 누르면 재생돼요.'});await this.suspendContext();}
  returned(){this.update({phase:this.status()==='locked'||this.status()==='unavailable'?this.status():'paused',message:'작업은 그대로예요. 다시 듣기를 누르면 재생돼요.'});}
  finish(generation:number){if(generation===this.generation&&this.isRunning()){this.heldGeneration=null;this.update({phase:'ready',message:'다시 들을 수 있어요.'});}}
  diagnosticsLatency(){const context=this.context;if(!context)return {};return {baseLatency:context.baseLatency,outputLatency:'outputLatency' in context?context.outputLatency:undefined,outputTimestamp:typeof context.getOutputTimestamp==='function'?context.getOutputTimestamp():undefined};}
  dispose(){this.stopAll();const context=this.context;this.releaseContext();if(context&&context.state!=='closed')void context.close().catch(()=>undefined);this.listeners.clear();this.update({phase:'locked'});}
}
