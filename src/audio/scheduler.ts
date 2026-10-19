import {AudioService} from './AudioService';
import {validateEvent,type NoteEvent} from './types';

export class AudioScheduler{
  private timer:ReturnType<typeof setTimeout>|null=null;private events:readonly NoteEvent[]=[];private cursor=0;private generation=-1;private endAt=0;
  constructor(private readonly audio:AudioService){}
  start(events:readonly NoteEvent[],endAt:number,generation:number){
    this.stop();events.forEach(validateEvent);if(!Number.isFinite(endAt)||endAt<this.audio.currentTime)throw new RangeError('Invalid transport end');
    this.events=events.map(e=>Object.freeze({...e})).sort((a,b)=>a.at-b.at||a.groupId.localeCompare(b.groupId));this.cursor=0;this.endAt=endAt;this.generation=generation;this.audio.holdPlayback(generation);this.tick();
  }
  private tick=()=>{
    this.timer=null;
    if(this.generation!==this.audio.generation||!this.audio.isRunning()){this.stop();return;}
    const now=this.audio.currentTime,horizon=now+.100;let next=this.cursor;while(next<this.events.length&&this.events[next].at<horizon)next++;
    const ready=this.events.slice(this.cursor,next);
    if(ready.some(e=>e.at<now+.005)){this.stop();this.audio.interrupt('재생이 잠시 늦어졌어요. 처음부터 다시 들어 주세요.');return;}
    let index=0;
    while(index<ready.length){let end=index+1;while(end<ready.length&&ready[end].at===ready[index].at&&ready[end].groupId===ready[index].groupId)end++;
      if(!this.audio.scheduleGroup(ready.slice(index,end))){this.stop();this.audio.interrupt('소리를 예약하지 못했어요. 다시 들어 주세요.');return;}index=end;
    }
    this.cursor=next;
    if(now>=this.endAt){const generation=this.generation;this.stop();this.audio.finish(generation);return;}
    this.timer=this.audio.setTimer(this.tick,25);
  };
  stop(){if(this.timer!==null)this.audio.clearTimer(this.timer);this.timer=null;this.events=[];this.cursor=0;this.generation=-1;}
  getDiagnostics=()=>Object.freeze({timerCount:this.timer===null?0:1,queuedEvents:this.events.length-this.cursor,generation:this.generation});
}
