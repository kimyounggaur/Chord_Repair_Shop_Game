import {AudioService} from './AudioService';
import {arpeggioPlan,captureSnapshot,comparisonPlan,singlePlan,type AudioPlan} from './comparison';
import type {AudioSnapshot} from './types';

type Mode='original'|'current'|'compare'|'arpeggio'|'completion';
export class AudioTransport{
  private timer:ReturnType<typeof setTimeout>|null=null;
  private active:Readonly<{snapshot:AudioSnapshot;generation:number;mode:Mode;t0:number;endAt:number}>|null=null;
  private pendingSnapshot:AudioSnapshot|null=null;
  private requestGeneration:number|null=null;
  private readonly unsubscribe:()=>void;
  constructor(private readonly audio:AudioService){this.unsubscribe=audio.subscribe(()=>{if(this.requestGeneration!==null&&this.requestGeneration!==audio.generation)this.clear();});}
  private clear(){if(this.timer!==null)this.audio.clearTimer(this.timer);this.timer=null;this.active=null;this.pendingSnapshot=null;this.requestGeneration=null;}
  stopAll=():void=>{this.clear();this.audio.stopAll();};
  invalidate=(key:Pick<AudioSnapshot,'orderId'|'attemptId'|'revision'>|string):void=>{
    // A string key is the app's explicit notification after it has already run CANCEL_AUDIO.
    if(typeof key==='string'){this.stopAll();this.audio.setMessage('음이 바뀌었어요. 다시 비교해 주세요.');return;}
    const snapshot=this.active?.snapshot??this.pendingSnapshot;if(!snapshot||snapshot.orderId===key.orderId&&snapshot.attemptId===key.attemptId&&snapshot.revision===key.revision)return;
    const comparison=this.active?.mode==='compare';this.stopAll();if(comparison)this.audio.setMessage('음이 바뀌었어요. 다시 비교해 주세요.');
  };
  private start(input:AudioSnapshot,mode:Mode){
    let snapshot:AudioSnapshot;try{snapshot=captureSnapshot(input);}catch{this.stopAll();this.audio.setMessage('세 음을 준비한 뒤 다시 들어 주세요.');return;}
    this.stopAll();this.pendingSnapshot=snapshot;const generation=this.audio.generation;this.requestGeneration=generation;
    void this.audio.enable().then(ready=>{
      if(generation!==this.audio.generation)return;
      if(!ready){this.clear();return;}
      const t0=this.audio.currentTime;
      const plan:AudioPlan=mode==='compare'?comparisonPlan(snapshot,t0,generation):mode==='arpeggio'?arpeggioPlan(snapshot,t0,generation):singlePlan(snapshot,mode==='completion'?'current':mode,t0,generation);
      const playback:AudioPlan=mode==='completion'?{events:[...plan.events,{id:`completion-${generation}`,groupId:`completion-${generation}`,midi:snapshot.current[0]+12<=74?snapshot.current[0]+12:snapshot.current[0],at:t0+1.17,gate:.16,velocity:.25,priority:'normal',generation,timbre:'bell'}],endAt:t0+1.45}:plan;
      this.active={snapshot,generation,mode,t0,endAt:playback.endAt};this.pendingSnapshot=null;this.audio.holdPlayback(generation);
      if(!this.audio.scheduleGroup(playback.events)){this.clear();this.audio.interrupt('소리를 예약하지 못했어요. 다시 듣기를 눌러 주세요.');return;}
      this.audio.setMessage(mode==='arpeggio'?'현재 화음을 낮은 음부터 한 음씩 들어요.':'원래 음과 현재 음을 같은 소리로 들어요.');this.poll();
    }).catch(()=>{if(generation===this.audio.generation){this.clear();this.audio.interrupt('소리를 준비하지 못했어요. 다시 듣기를 눌러 주세요.');}});
  }
  private poll=()=>{
    this.timer=null;const active=this.active;if(!active)return;
    if(active.generation!==this.audio.generation||!this.audio.isRunning()){this.clear();return;}
    if(this.audio.currentTime>=active.endAt){this.clear();this.audio.finish(active.generation);return;}
    this.timer=this.audio.setTimer(this.poll,25);
  };
  playOriginal=(snapshot:AudioSnapshot):void=>this.start(snapshot,'original');
  playCurrent=(snapshot:AudioSnapshot):void=>this.start(snapshot,'current');
  compare=(snapshot:AudioSnapshot):void=>this.start(snapshot,'compare');
  arpeggiate=(snapshot:AudioSnapshot):void=>this.start(snapshot,'arpeggio');
  completion=(snapshot:AudioSnapshot):void=>{if(this.audio.isRunning())this.start(snapshot,'completion');};
  getDiagnostics=()=>Object.freeze({mode:this.active?.mode??null,activeGeneration:this.active?.generation??null,timerCount:this.timer===null?0:1,pending:!!this.pendingSnapshot,elapsed:this.active?Math.max(0,this.audio.currentTime-this.active.t0):0,endAt:this.active?.endAt??null});
  dispose(){this.stopAll();this.unsubscribe();}
}
