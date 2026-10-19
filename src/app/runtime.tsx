import {useCallback,useEffect,useMemo,useRef,useSyncExternalStore} from 'react';
import {AudioService} from '../audio/AudioService';
import {AudioTransport} from '../audio/transport';
import {EnsembleTransport} from '../audio/ensemble';
import {bindLifecycle} from '../audio/lifecycle';
import type {SessionEvent,SessionState} from '../domain/session/types';
import {StorageController} from '../persistence/controller';
import {StorageControls} from '../ui/StorageControls';
import type {WorkbenchServices} from '../ui/services';
import {App} from './App';

// Constructing these services creates no AudioContext. Only an explicit listening
// gesture may unlock audio. React StrictMode therefore cannot duplicate contexts.
export const audioService=new AudioService();
export const audioTransport=new AudioTransport(audioService);
export const ensembleTransport=new EnsembleTransport(audioService);
export const storageController=new StorageController();
if(import.meta.hot)import.meta.hot.dispose(()=>{ensembleTransport.dispose();audioTransport.dispose();audioService.dispose();storageController.dispose();});

export function Runtime(){
  const audio=useSyncExternalStore(audioService.subscribe,audioService.getSnapshot);
  const storage=useSyncExternalStore(storageController.subscribe,storageController.getSnapshot);
  const dispatchRef=useRef<(event:SessionEvent)=>void>(()=>undefined);
  const bindDispatch=useCallback((dispatch:(event:SessionEvent)=>void)=>{dispatchRef.current=dispatch;},[]);
  useEffect(()=>{void storageController.start();},[]);
  const previous=useRef<{orderId:string;attemptId:string;revision:number}|null>(null);
  const invalidated=useRef<string|null>(null);
  const onSessionChange=useCallback((state:SessionState)=>{
    const prior=previous.current;
    if(prior&&prior.orderId===state.orderId&&prior.attemptId===state.attemptId&&prior.revision!==state.revision&&audioService.status()==='playing'){
      invalidated.current=`${state.orderId}:${state.attemptId}:${state.revision}`;
    }
    previous.current={orderId:state.orderId,attemptId:state.attemptId,revision:state.revision};
    const current=audioService.getSnapshot();
    if(current.volume!==state.settings.volume)audioService.setVolume(state.settings.volume);
    if(current.muted!==state.settings.mute)audioService.setMuted(state.settings.mute);
  },[]);
  const services=useMemo<WorkbenchServices>(()=>({
    enable:()=>audioService.enable(),
    previewNote:audioService.previewNote,
    playOriginal:audioTransport.playOriginal,
    playCurrent:audioTransport.playCurrent,
    compare:audioTransport.compare,
    arpeggiate:audioTransport.arpeggiate,
    stopAll:audioTransport.stopAll,
    status:audioService.status,
    ensemble:{play:ensembleTransport.play,subscribe:ensembleTransport.subscribe,getSnapshot:ensembleTransport.getSnapshot},
    onCommand:(command,state)=>{
      storageController.handle(command,state);
      if(command.type==='COMPLETE'&&!state.settings.mute)audioTransport.completion({orderId:state.orderId,attemptId:state.attemptId,revision:state.revision,original:state.notes,current:state.notes});
      // The App already stopped the transport. Preserve the more useful edit
      // notice after that cancellation; never replay an obsolete snapshot.
      if(command.type==='CANCEL_AUDIO'&&invalidated.current!==null){
        audioTransport.invalidate(invalidated.current);
        invalidated.current=null;
      }
    },
  }),[]);
  useEffect(()=>bindLifecycle(audioService,audioTransport),[]);
  useEffect(()=>{if(!storage.ready)return;const status=storage.mode==='readonly'||storage.mode==='recovery'?'failed':storage.mode==='loading'?'clean':storage.mode;dispatchRef.current({type:'SET_STORAGE',status});},[storage.ready,storage.mode,storage.epoch]);
  if(!storage.ready)return <main className="app-shell"><h1>화음 수리점</h1><p>기록을 불러오고 있어요.</p></main>;
  return <><StorageControls controller={storageController} view={storage} dispatch={event=>dispatchRef.current(event)} stop={audioTransport.stopAll}/>{storage.mode==='recovery'?<main className="app-shell"><h1>기록 복구</h1><p>설정과 기록에서 복구 방법을 골라 주세요.</p></main>:<fieldset className="app-owner" disabled={storage.mode==='readonly'}><App key={storage.epoch} initialSession={storage.initialSession} initialSettings={storage.profile.settings} initialReceipts={storage.profile.progress.flatMap(row=>row.receipt?[row.receipt]:[])} services={services} onDispatchReady={bindDispatch} onSessionChange={onSessionChange} audioStatus={audio.phase} audioMessage={audio.message}/></fieldset>}</>;
}
