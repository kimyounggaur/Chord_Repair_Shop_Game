import {AudioService} from './AudioService';
import {AudioTransport} from './transport';
type LifecycleOptions={onHidden?:()=>void;onReturn?:()=>void;document?:Pick<Document,'hidden'|'addEventListener'|'removeEventListener'>;window?:Pick<Window,'addEventListener'|'removeEventListener'>};
/** App owns session HIDDEN/RETURN+save; this binding owns audio suspension only by default. */
export function bindLifecycle(audio:AudioService,transport:AudioTransport,options:LifecycleOptions={}):()=>void{
  const doc=options.document??document,win=options.window??window;
  let handlingHidden=false,previousPhase=audio.status();
  const hidden=()=>{handlingHidden=true;transport.stopAll();options.onHidden?.();void audio.pause();handlingHidden=false;};
  const returned=()=>{audio.returned();options.onReturn?.();};
  const visibility=()=>{if(doc.hidden)hidden();else returned();};
  doc.addEventListener('visibilitychange',visibility);win.addEventListener('pagehide',hidden);win.addEventListener('pageshow',returned);
  const unsubscribe=audio.subscribe(()=>{const phase=audio.status();const wasActive=['ready','preparing','playing'].includes(previousPhase);previousPhase=phase;if(phase==='paused'&&wasActive&&!handlingHidden)options.onHidden?.();});
  const untrack=audio.trackLifecycleListeners(3);let bound=true;
  return()=>{if(!bound)return;bound=false;doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('pagehide',hidden);win.removeEventListener('pageshow',returned);unsubscribe();untrack();transport.stopAll();};
}
