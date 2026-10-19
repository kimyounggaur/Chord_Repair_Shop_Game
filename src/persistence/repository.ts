import {evidenceDoesNotRegress} from '../domain/session/evidence';
import type {SessionState} from '../domain/session/types';
import {readRecords,STORES,type RawRecords} from './db';
import {demand,freshProfile,validateMeta,validateProfile,type Attempt,type Lease,type Meta,type Profile} from './schemas';
export class StorageConflict extends Error{}
export const LEASE_MS=15000;
export const baseMeta=():Meta=>({schemaVersion:1,contentVersion:'1.0.0',revision:0,writerLease:null});
export function profileFromRecords(raw:RawRecords):Profile{
  const meta=raw.meta===undefined?baseMeta():validateMeta(raw.meta);
  return validateProfile({schemaVersion:1,contentVersion:'1.0.0',revision:meta.revision,settings:raw.settings??(meta.revision===0?freshProfile().settings:undefined),attempts:raw.attempts,progress:raw.progress,draft:raw.draft??null});
}
export function checkpointProfile(previous:Profile,state:SessionState,sequence:number,now:number):Profile{
  const old=previous.attempts.find(attempt=>attempt.attemptId===state.attemptId)??previous.progress.flatMap(row=>[row.first,row.latest]).find(attempt=>attempt.attemptId===state.attemptId);
  demand(!old||(state.revision>=old.revision&&evidenceDoesNotRegress(old.evidence,state.evidence)),'이전 시도 증거로 되돌릴 수 없어요.');
  demand(!previous.draft||sequence>previous.draft.sequence,'지난 체크포인트는 저장할 수 없어요.');
  const attempt:Attempt={attemptId:state.attemptId,orderId:state.orderId,contentVersion:'1.0.0',revision:state.revision,notes:[...state.notes],evidence:structuredClone(state.evidence),completionId:state.completionId,updatedAt:now};
  const existing=previous.progress.find(row=>row.orderId===state.orderId),newAttempt=!old;
  const assisted=(item:Attempt)=>item.evidence.maxRepairHintLevel>0||item.evidence.maxReflectionHintLevel>0||item.evidence.answerRevealedBeforeFirstAnswer;
  const completed=!!state.completionId&&!old?.completionId;
  const receipt=state.completionId?{orderId:state.orderId,contentVersion:'1.0.0',completionId:state.completionId}:existing?.receipt??null;
  const row={orderId:state.orderId,receipt,first:!existing||existing.first.attemptId===state.attemptId?attempt:existing.first,latest:attempt,attemptCount:(existing?.attemptCount??0)+(newAttempt?1:0),completionCount:(existing?.completionCount??0)+(completed?1:0),assistedCount:(existing?.assistedCount??0)+(assisted(attempt)&&(!old||!assisted(old))?1:0)};
  return validateProfile({...previous,settings:state.settings,attempts:[...previous.attempts.filter(item=>item.attemptId!==attempt.attemptId),attempt].sort((a,b)=>a.updatedAt-b.updatedAt||a.attemptId.localeCompare(b.attemptId)).slice(-100),progress:[...previous.progress.filter(item=>item.orderId!==row.orderId),row],draft:state.learning==='completed'?null:{sequence,state:structuredClone(state)}});
}
export class Repository{
  constructor(readonly db:IDBDatabase,readonly now:()=>number=Date.now){}
  recover(expected:RawRecords,owner:Pick<Lease,'ownerId'|'token'>,replacement:Profile):Promise<Profile>{return new Promise((resolve,reject)=>{
    const tx=this.db.transaction([...STORES],'readwrite');let result:Profile;let failure:unknown;
    readRecords(tx,raw=>{try{
      if(JSON.stringify(raw)!==JSON.stringify(expected))throw new StorageConflict('복구를 준비하는 동안 기록이 바뀌었어요. 다시 불러와 주세요.');
      const lease=(raw.meta as {writerLease?:Lease}|undefined)?.writerLease;
      if(lease&&lease.expiresAt>this.now()&&(lease.ownerId!==owner.ownerId||lease.token!==owner.token))throw new StorageConflict('다른 탭에서 편집 중이에요.');
      let previous:Profile|null=null;try{previous=profileFromRecords(raw);}catch{/* Explicit recovery may replace invalid current data. */}
      result=validateProfile({...replacement,revision:(previous?.revision??0)+1});if(previous)tx.objectStore('backup').put(previous,'previous');
      tx.objectStore('settings').put(result.settings,'main');tx.objectStore('attempts').clear();for(const attempt of result.attempts)tx.objectStore('attempts').put(attempt,attempt.attemptId);tx.objectStore('progress').clear();for(const row of result.progress)tx.objectStore('progress').put(row,row.orderId);if(result.draft)tx.objectStore('draft').put(result.draft,'active');else tx.objectStore('draft').delete('active');
      tx.objectStore('meta').put({...baseMeta(),revision:result.revision,writerLease:{...owner,expiresAt:this.now()+LEASE_MS}},'profile');
    }catch(error){failure=error;tx.abort();}});
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure??tx.error??new Error('복구가 중단됐어요.'));tx.onerror=()=>undefined;
  });}
  load():Promise<{profile:Profile|null;backup:Profile|null;raw:RawRecords;error:string|null}>{return new Promise((resolve,reject)=>{
    const tx=this.db.transaction([...STORES],'readonly');let result:Awaited<ReturnType<Repository['load']>>;
    readRecords(tx,raw=>{let profile:Profile|null=null,backup:Profile|null=null,error:string|null=null;try{profile=profileFromRecords(raw);}catch(failure){error=String(failure);}try{if(raw.backup)backup=validateProfile(raw.backup);}catch{/* Preserve corrupt backup; do not overwrite on read. */}result={profile,backup,raw,error};});
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error??new Error('저장소 읽기가 중단됐어요.'));tx.onerror=()=>undefined;
  });}
  lease(owner:Pick<Lease,'ownerId'|'token'>,mode:'acquire'|'takeover'|'renew'|'release'):Promise<Meta>{return new Promise((resolve,reject)=>{
    const tx=this.db.transaction('meta','readwrite'),store=tx.objectStore('meta');let result:Meta;let failure:unknown;
    store.get('profile').onsuccess=event=>{try{const raw=(event.target as IDBRequest).result;const meta=raw===undefined?baseMeta():validateMeta(raw),current=meta.writerLease,same=current?.ownerId===owner.ownerId&&current.token===owner.token;
      if(mode==='release'){if(same){result={...meta,writerLease:null};store.put(result,'profile');}else result=meta;return;}
      const canAcquire=current===null||same||(mode==='takeover'&&current.expiresAt<=this.now());
      if(!canAcquire||mode==='renew'&&!same)throw new StorageConflict('다른 탭에서 편집 중이에요.');
      result={...meta,writerLease:{...owner,expiresAt:this.now()+LEASE_MS}};store.put(result,'profile');
    }catch(error){failure=error;tx.abort();}};
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure??tx.error??new Error('작성 권한 확인이 중단됐어요.'));tx.onerror=()=>undefined;
  });}
  commit(expectedRevision:number,owner:Pick<Lease,'ownerId'|'token'>,change:(previous:Profile)=>Profile,options:{allowCorrupt?:boolean;beforeComplete?:(tx:IDBTransaction)=>void}={}):Promise<Profile>{return new Promise((resolve,reject)=>{
    const tx=this.db.transaction([...STORES],'readwrite');let result:Profile;let failure:unknown;
    readRecords(tx,raw=>{try{
      const meta=raw.meta===undefined?baseMeta():validateMeta(raw.meta),lease=meta.writerLease;
      if(meta.revision!==expectedRevision||!lease||lease.ownerId!==owner.ownerId||lease.token!==owner.token||lease.expiresAt<=this.now())throw new StorageConflict('다른 탭의 새 기록이 있어요. 새로 불러와 주세요.');
      let previous:Profile|null=null;try{previous=profileFromRecords(raw);}catch(error){if(!options.allowCorrupt)throw error;}
      result=validateProfile({...change(previous??freshProfile()),revision:meta.revision+1});
      if(previous)tx.objectStore('backup').put(previous,'previous');
      tx.objectStore('settings').put(result.settings,'main');tx.objectStore('attempts').clear();for(const attempt of result.attempts)tx.objectStore('attempts').put(attempt,attempt.attemptId);
      tx.objectStore('progress').clear();for(const progress of result.progress)tx.objectStore('progress').put(progress,progress.orderId);
      if(result.draft)tx.objectStore('draft').put(result.draft,'active');else tx.objectStore('draft').delete('active');
      tx.objectStore('meta').put({...meta,revision:result.revision},'profile');options.beforeComplete?.(tx);
    }catch(error){failure=error;tx.abort();}});
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure??tx.error??new Error('저장이 중단됐어요. 이전 기록은 유지돼요.'));tx.onerror=()=>undefined;
  });}
}
