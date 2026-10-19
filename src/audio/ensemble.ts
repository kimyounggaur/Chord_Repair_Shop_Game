import {AudioService} from './AudioService';
import {AudioScheduler} from './scheduler';
import {ensembleEvents,ENSEMBLE_SECONDS,type EnsembleOptions} from './ensemble-events';
export type EnsembleView=Readonly<{playing:boolean;elapsed:number;bar:number}>;
export class EnsembleTransport{
  private readonly scheduler:AudioScheduler;private listeners=new Set<()=>void>();private view:EnsembleView={playing:false,elapsed:0,bar:0};
  private timer:ReturnType<typeof setTimeout>|null=null;private generation=-1;private startAt=0;private readonly unsubscribe:()=>void;
  constructor(private readonly audio:AudioService){this.scheduler=new AudioScheduler(audio);this.unsubscribe=audio.subscribe(()=>{if(this.generation>=0&&this.generation!==audio.generation)this.clear();});}
  getSnapshot=()=>this.view;subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private update(patch:Partial<EnsembleView>){this.view={...this.view,...patch};for(const listener of this.listeners)listener();}
  private clear(){if(this.timer)this.audio.clearTimer(this.timer);this.timer=null;this.scheduler.stop();this.generation=-1;if(this.view.playing)this.update({playing:false});}
  stopAll=()=>{this.clear();this.audio.stopAll();};
  play=(options:EnsembleOptions)=>{
    this.stopAll();const generation=this.audio.generation;this.generation=generation;const copy={solo:options.solo,muted:[...options.muted]};
    void this.audio.enable().then(ready=>{if(!ready||generation!==this.audio.generation)return;this.startAt=this.audio.currentTime+.05;const events=ensembleEvents(this.startAt,generation,copy);if(!events.length){this.clear();this.audio.setMessage('선택한 파트가 모두 음소거되어 있어요.');return;}this.scheduler.start(events,this.startAt+ENSEMBLE_SECONDS,generation);this.update({playing:true,elapsed:0,bar:0});this.poll();}).catch(()=>this.clear());
  };
  private poll=()=>{this.timer=null;if(this.generation<0)return;const elapsed=Math.min(ENSEMBLE_SECONDS,Math.max(0,this.audio.currentTime-this.startAt));this.update({elapsed,bar:Math.min(7,Math.floor(elapsed/3))});if(!this.audio.isRunning()||elapsed>=ENSEMBLE_SECONDS){if(elapsed>=ENSEMBLE_SECONDS)this.audio.finish(this.generation);this.clear();return;}this.timer=this.audio.setTimer(this.poll,50);};
  getDiagnostics=()=>({...this.view,...this.scheduler.getDiagnostics(),visualTimerCount:this.timer?1:0});
  dispose(){this.stopAll();this.unsubscribe();this.listeners.clear();}
}
