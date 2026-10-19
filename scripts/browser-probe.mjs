// Test-only instrumentation injected into an isolated Playwright context.
// Native audio still runs unchanged. None of this is part of the shipped bundle.
export function installProbe(){
  const contexts=[],active=new Set(),connections=new WeakMap(),seenVoices=new WeakSet();
  const pendingTimers=new Set(),intervals=new Set(),paintMs=[],scheduleMs=[],violations=[];
  let peakVoices=0,scheduledVoices=0,lastGesture=null;
  const voiceGroups=()=>new Set([...active].map(source=>connections.get(connections.get(source))));
  const connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect;
  AudioNode.prototype.connect=function(...args){connections.set(this,args[0]);return connect.apply(this,args);};
  AudioNode.prototype.disconnect=function(...args){active.delete(this);return disconnect.apply(this,args);};
  const NativeContext=window.AudioContext;
  window.AudioContext=class extends NativeContext{
    constructor(...args){super(...args);contexts.push(this);}
    createOscillator(){
      const source=super.createOscillator(),start=source.start;
      source.start=function(...args){
        const result=start.apply(this,args);active.add(this);const group=connections.get(connections.get(this));
        if(group&&!seenVoices.has(group)){seenVoices.add(group);scheduledVoices++;}
        peakVoices=Math.max(peakVoices,voiceGroups().size);
        if(lastGesture!==null){scheduleMs.push(performance.now()-lastGesture);lastGesture=null;}
        return result;
      };
      source.addEventListener('ended',()=>active.delete(source),{once:true});return source;
    }
  };
  const nativeTimeout=window.setTimeout.bind(window),nativeClear=window.clearTimeout.bind(window);
  window.setTimeout=(fn,ms,...args)=>{let id;id=nativeTimeout(()=>{pendingTimers.delete(id);fn(...args);},ms);pendingTimers.add(id);return id;};
  window.clearTimeout=id=>{pendingTimers.delete(id);nativeClear(id);};
  const nativeInterval=window.setInterval.bind(window),nativeClearInterval=window.clearInterval.bind(window);
  window.setInterval=(fn,ms,...args)=>{const id=nativeInterval(fn,ms,...args);intervals.add(id);return id;};
  window.clearInterval=id=>{intervals.delete(id);nativeClearInterval(id);};
  document.addEventListener('pointerdown',event=>{if(event.target.closest?.('[data-midi]'))lastGesture=performance.now();},true);
  document.addEventListener('pointerup',event=>{if(!event.target.closest?.('[data-midi]'))return;const start=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>paintMs.push(performance.now()-start)));},true);
  document.addEventListener('securitypolicyviolation',event=>violations.push({directive:event.effectiveDirective,blockedURI:event.blockedURI}));
  window.__chordProbe={snapshot:()=>({contexts:contexts.length,states:contexts.map(context=>context.state),voices:voiceGroups().size,peakVoices,scheduledVoices,oscillators:active.size,timers:pendingTimers.size,intervals:intervals.size,paintMs:[...paintMs],scheduleMs:[...scheduleMs],violations:[...violations]})};
}
