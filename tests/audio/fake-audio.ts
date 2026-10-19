export type Call={method:string;value?:number;at:number};
export class FakeParam{
  value=0;calls:Call[]=[];
  setValueAtTime(value:number,at:number){this.calls.push({method:'set',value,at});this.value=value;return this;}
  linearRampToValueAtTime(value:number,at:number){this.calls.push({method:'linear',value,at});return this;}
  cancelScheduledValues(at:number){this.calls.push({method:'cancel',at});return this;}
  cancelAndHoldAtTime:((at:number)=>this)|undefined=(at:number)=>{this.calls.push({method:'hold',at});return this;};
}
export class FakeNode{
  connections:unknown[]=[];disconnects=0;
  connect(target:unknown){this.connections.push(target);return target;}
  disconnect(){this.connections=[];this.disconnects++;}
}
export class FakeGain extends FakeNode{gain=new FakeParam();}
export class FakeOscillator extends FakeNode{
  type='sine';frequency=new FakeParam();onended:(()=>void)|null=null;starts:number[]=[];stops:number[]=[];finished=false;
  start(at:number){if(this.starts.length)throw new Error('start twice');this.starts.push(at);}
  stop(at:number){if(!this.starts.length)throw new Error('not started');this.stops.push(at);}
  advance(time:number){if(!this.finished&&this.stops.length&&time>=this.stops[this.stops.length-1]){this.finished=true;this.onended?.();}}
}
export class FakeAudioContext{
  currentTime=0;sampleRate=48000;state:string='suspended';destination=new FakeNode();baseLatency=.01;outputLatency=.02;
  gains:FakeGain[]=[];sources:FakeOscillator[]=[];listeners=new Set<()=>void>();resumeCalls=0;suspendCalls=0;closeCalls=0;
  resumeError=false;suspendError=false;failureCount=0;deferred=false;resolveResume:(()=>void)|null=null;
  createGain(){const gain=new FakeGain();this.gains.push(gain);return gain as unknown as GainNode;}
  createOscillator(){if(this.failureCount>0){this.failureCount--;throw new Error('synthesis failure');}const source=new FakeOscillator();this.sources.push(source);return source as unknown as OscillatorNode;}
  addEventListener(_type:string,listener:()=>void){this.listeners.add(listener);}
  removeEventListener(_type:string,listener:()=>void){this.listeners.delete(listener);}
  changeState(state:string){this.state=state;for(const listener of [...this.listeners])listener();}
  resume(){this.resumeCalls++;if(this.resumeError)return Promise.reject(new Error('blocked'));if(this.deferred)return new Promise<void>(resolve=>{this.resolveResume=()=>{this.changeState('running');resolve();};});this.changeState('running');return Promise.resolve();}
  suspend(){this.suspendCalls++;if(this.suspendError)return Promise.reject(new Error('cannot suspend'));this.changeState('suspended');return Promise.resolve();}
  close(){this.closeCalls++;this.changeState('closed');return Promise.resolve();}
  advance(time:number){this.currentTime=time;for(const source of [...this.sources])source.advance(time);}
  asAudioContext(){return this as unknown as AudioContext;}
  asBaseAudioContext(){return this as unknown as BaseAudioContext;}
}
