import {loadOrders} from '../content/loader';
import {createSession} from '../domain/session/reducer';
import type {SessionCommand,SessionState} from '../domain/session/types';
import {openDatabase,type RawRecords} from './db';
import {Repository,StorageConflict,checkpointProfile} from './repository';
import {freshProfile,validateProfile,type Lease,type Profile,type ProgressExport} from './schemas';
type Mode='loading'|'clean'|'dirty'|'saving'|'failed'|'memoryOnly'|'readonly'|'recovery';
export type StorageView={ready:boolean;mode:Mode;message:string;profile:Profile;backup:Profile|null;epoch:number;initialSession:SessionState|undefined;leaseExpires:number};
export class StorageController{
  private view:StorageView={ready:false,mode:'loading',message:'기기 내 기록을 확인하고 있어요.',profile:freshProfile(),backup:null,epoch:0,initialSession:undefined,leaseExpires:0};
  private listeners=new Set<()=>void>();private repository:Repository|null=null;private startPromise:Promise<void>|null=null;
  private owner:Pick<Lease,'ownerId'|'token'>={ownerId:crypto.randomUUID(),token:crypto.randomUUID()};
  private revision=0;private sequence=0;private queue:Promise<void>=Promise.resolve();private pending:{state:SessionState;sequence:number;settingsOnly:boolean}|null=null;
  private timer:ReturnType<typeof setTimeout>|null=null;private firstDirty=0;private renewal:ReturnType<typeof setInterval>|null=null;private channel:BroadcastChannel|null=null;private raw:unknown=null;
  getSnapshot=()=>this.view;subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private update(patch:Partial<StorageView>){this.view={...this.view,...patch};for(const listener of [...this.listeners])listener();}
  start=():Promise<void>=>this.startPromise??(this.startPromise=this.boot());
  private initial(profile:Profile):SessionState|undefined{
    if(profile.draft)return profile.draft.state;
    if(!profile.progress.length)return undefined;
    const order=loadOrders().find(order=>!profile.progress.some(row=>row.orderId===order.id&&row.receipt))??loadOrders()[0];
    return {...createSession(order,crypto.randomUUID(),crypto.getRandomValues(new Uint32Array(1))[0]),settings:profile.settings,screen:'orders'};
  }
  private async boot(){
    try{
      // Reload keeps the tab's lease identity. CAS still rejects stale duplicated-tab writes.
      try{const saved=sessionStorage.getItem('chord-repair-shop-writer');if(saved){const parsed=JSON.parse(saved);if(typeof parsed.ownerId==='string'&&typeof parsed.token==='string')this.owner=parsed;}else sessionStorage.setItem('chord-repair-shop-writer',JSON.stringify(this.owner));}catch{/* Session storage is optional. */}
      this.repository=new Repository(await openDatabase());await this.load(true);
      if(typeof BroadcastChannel!=='undefined'){this.channel=new BroadcastChannel('chord-repair-shop');this.channel.onmessage=event=>{if(event.data?.version===1&&event.data?.kind==='committed'&&this.view.mode==='readonly')this.update({message:'다른 탭에 새 기록이 있어요. 새로 불러오거나 만료 후 이어서 편집하세요.'});};}
      this.renewal=setInterval(()=>{if(!document.hidden&&this.view.ready&&!['readonly','recovery','memoryOnly','failed'].includes(this.view.mode))void this.renew();},5000);
      document.addEventListener('visibilitychange',this.visibility);window.addEventListener('pagehide',this.hidden);
    }catch(error){this.update({ready:true,mode:'memoryOnly',message:`기기 저장을 사용할 수 없어요. 브라우저를 닫으면 기록을 잃을 수 있어요. 내보내기로 보관해 주세요. (${error instanceof Error?error.name:'저장 오류'})`,epoch:this.view.epoch+1});}
  }
  private async load(acquire:boolean){
    if(!this.repository)return;const loaded=await this.repository.load();this.raw=loaded.raw;
    const rawMeta=loaded.raw.meta as {revision?:number;writerLease?:Lease}|undefined;this.revision=Number.isSafeInteger(rawMeta?.revision)&&Number(rawMeta?.revision)>=0?Number(rawMeta?.revision):0;
    if(!loaded.profile){this.update({ready:true,mode:'recovery',message:'저장 기록에 문제가 있어요. 원본을 보존했어요. 백업 복구, 읽을 수 있는 기록 내보내기 또는 새 시작을 선택해 주세요.',backup:loaded.backup,epoch:this.view.epoch+1});return;}
    if(loaded.raw.settings===undefined&&typeof matchMedia==='function')loaded.profile.settings={...loaded.profile.settings,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
    this.sequence=Math.max(this.sequence,loaded.profile.draft?.sequence??0);let mode:Mode='clean',expires=0;
    if(acquire)try{const meta=await this.repository.lease(this.owner,'acquire');expires=meta.writerLease?.expiresAt??0;}catch(error){if(error instanceof StorageConflict)mode='readonly';else throw error;}
    this.update({ready:true,mode,message:mode==='readonly'?'다른 탭에서 편집 중이에요. 이 탭은 읽기 전용이에요.':'이 브라우저에 저장돼요. 자동 동기화나 영구 보관은 아니에요.',profile:loaded.profile,backup:loaded.backup,epoch:this.view.epoch+1,initialSession:this.initial(loaded.profile),leaseExpires:expires||rawMeta?.writerLease?.expiresAt||0});
  }
  private hidden=()=>{queueMicrotask(()=>{this.flush();this.queue=this.queue.then(async()=>{if(this.repository)await this.repository.lease(this.owner,'release');}).catch(()=>undefined);});};
  private visibility=()=>{if(document.hidden)this.hidden();else if(this.view.mode!=='readonly'&&this.view.mode!=='recovery')void this.renew();};
  private async renew(){try{if(!this.repository)return;const meta=await this.repository.lease(this.owner,'acquire');if(meta.revision!==this.revision)throw new StorageConflict('새 기록이 있어요. 다시 불러와 주세요.');this.update({leaseExpires:meta.writerLease?.expiresAt??0});}catch(error){this.failure(error);}}
  private failure(error:unknown){this.update({mode:error instanceof StorageConflict?'readonly':'failed',message:error instanceof StorageConflict?error.message:'저장하지 못했어요. 수리는 계속할 수 있지만 브라우저를 닫으면 최근 기록을 잃을 수 있어요. 내보내기 또는 저장 다시 시도를 선택해 주세요.'});}
  handle=(command:SessionCommand,state:SessionState)=>{
    if(command.type!=='SAVE'&&command.type!=='COMPLETE'||['readonly','recovery'].includes(this.view.mode))return;
    // A hidden/blur notification before a learner opens an order is not a learning attempt.
    // This also protects the separate sandbox when it was opened from the home screen.
    const unstarted=state.learning==='orderIntro'&&!this.view.profile.attempts.some(row=>row.attemptId===state.attemptId);
    const captured=structuredClone(state),sequence=++this.sequence,settingsOnly=command.type==='SAVE'&&(command.reason==='settings'||command.reason==='hidden'&&unstarted);
    if(settingsOnly&&this.pending&&!this.pending.settingsOnly)this.flush();
    try{const profile=settingsOnly?this.withSettings(this.view.profile,captured,sequence):checkpointProfile(this.view.profile,captured,sequence,Date.now());this.update({profile,mode:this.view.mode==='memoryOnly'||this.view.mode==='failed'?this.view.mode:'dirty'});}catch(error){this.failure(error);return;}
    this.pending={state:captured,sequence,settingsOnly};if(command.type==='COMPLETE'||command.immediate)this.flush();else{const now=Date.now();if(!this.firstDirty)this.firstDirty=now;if(this.timer)clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),Math.min(300,Math.max(0,1000-(now-this.firstDirty))));}
  };
  private withSettings(profile:Profile,state:SessionState,sequence:number){return validateProfile({...profile,settings:state.settings,draft:profile.draft?{sequence,state:{...profile.draft.state,settings:state.settings}}:null});}
  flush=()=>{
    if(this.timer)clearTimeout(this.timer);this.timer=null;this.firstDirty=0;const pending=this.pending;this.pending=null;if(!pending)return this.queue;
    this.queue=this.queue.then(async()=>{
      if(!this.repository||['memoryOnly','failed','readonly','recovery'].includes(this.view.mode))return;
      this.update({mode:'saving'});
      try{const previous=await this.repository.load();const saved=await this.repository.commit(this.revision,this.owner,profile=>pending.settingsOnly?this.withSettings(profile,pending.state,pending.sequence):checkpointProfile(profile,pending.state,pending.sequence,Date.now()));this.revision=saved.revision;this.update({profile:pending.sequence===this.sequence?saved:{...this.view.profile,revision:saved.revision},backup:previous.profile,mode:this.pending||pending.sequence!==this.sequence?'dirty':'clean',message:'이 브라우저에 저장했어요. 자동 동기화나 영구 보관은 아니에요.'});this.channel?.postMessage({version:1,kind:'committed'});}catch(error){this.failure(error);}
    });return this.queue;
  };
  reload=async()=>{await this.flush();await this.queue;try{await this.load(true);}catch(error){this.failure(error);}};
  takeover=async()=>{try{if(!this.repository)return;await this.repository.lease(this.owner,'takeover');await this.load(true);}catch(error){this.failure(error);}};
  retry=async()=>{try{await this.queue;if(!this.repository){this.repository=new Repository(await openDatabase());await this.repository.lease(this.owner,'acquire');}const saved=await this.repository.commit(this.revision,this.owner,()=>this.view.profile);this.revision=saved.revision;this.update({profile:saved,mode:'clean',message:'이 브라우저에 저장했어요.'});}catch(error){this.failure(error);}};
  replace=async(replacement:ProgressExport|Profile,expectedRevision=this.view.profile.revision,allowCorrupt=false)=>{
    await this.flush();await this.queue;if(!this.repository)throw new Error('기기 저장을 사용할 수 없어요. 현재 기록을 먼저 내보내 주세요.');
    if(expectedRevision!==this.revision&&!allowCorrupt)throw new StorageConflict('확인하는 동안 기록이 바뀌었어요. 파일을 다시 골라 주세요.');
    const profile=validateProfile({...replacement,revision:this.revision,draft:'draft' in replacement?replacement.draft:null});
    if(allowCorrupt&&this.view.mode==='recovery'){await this.repository.recover(this.raw as RawRecords,this.owner,profile);await this.load(true);return;}
    await this.repository.lease(this.owner,'acquire');
    await this.repository.commit(this.revision,this.owner,()=>profile,{allowCorrupt});await this.load(true);
  };
  reset=async(clearSettings:boolean)=>{const profile=freshProfile();if(!clearSettings)profile.settings=this.view.profile.settings;await this.replace(profile,this.revision,this.view.mode==='recovery');};
  exportRaw=()=>{const records=structuredClone(this.raw) as RawRecords|null;if(records?.meta&&typeof records.meta==='object')records.meta={...records.meta,writerLease:null};return JSON.stringify({kind:'chord-repair-diagnostic-not-importable',records});};
  dispose(){if(this.timer)clearTimeout(this.timer);if(this.renewal)clearInterval(this.renewal);document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('pagehide',this.hidden);this.channel?.close();this.repository?.db.close();this.listeners.clear();}
}
