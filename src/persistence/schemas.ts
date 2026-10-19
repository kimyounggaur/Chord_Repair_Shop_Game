import {loadOrders} from '../content/loader';
import {gradeMidi} from '../domain/grading';
import {DEFAULT_SETTINGS} from '../domain/session/reducer';
import {restoredEvidence,restoreSession} from '../domain/session/serialization';
import type {AttemptEvidence,CompletionReceipt,SessionSettings,SessionState} from '../domain/session/types';
export const MAX_BYTES=262144;
export type Attempt={attemptId:string;orderId:string;contentVersion:'1.0.0';revision:number;notes:number[];evidence:AttemptEvidence;completionId:string|null;updatedAt:number};
export type Progress={orderId:string;receipt:CompletionReceipt|null;first:Attempt;latest:Attempt;attemptCount:number;completionCount:number;assistedCount:number};
export type Profile={schemaVersion:1;contentVersion:'1.0.0';revision:number;settings:SessionSettings;attempts:Attempt[];progress:Progress[];draft:{sequence:number;state:SessionState}|null};
export type ProgressExport=Omit<Profile,'revision'|'draft'>;
export type Lease={ownerId:string;token:string;expiresAt:number};
export type Meta={schemaVersion:1;contentVersion:'1.0.0';revision:number;writerLease:Lease|null};
export const freshProfile=():Profile=>({schemaVersion:1,contentVersion:'1.0.0',revision:0,settings:{...DEFAULT_SETTINGS},attempts:[],progress:[],draft:null});
export function demand(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
export function object(value:unknown):Record<string,unknown>{demand(value!==null&&typeof value==='object'&&!Array.isArray(value),'객체 형식이 아니에요.');return value as Record<string,unknown>;}
export function exact(value:Record<string,unknown>,keys:string[]){demand(Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key)),'필수 필드가 빠졌거나 알 수 없는 필드가 있어요.');}
export function integer(value:unknown):value is number{return Number.isSafeInteger(value)&&Number(value)>=0;}
const identifier=(value:unknown,max=128):value is string=>typeof value==='string'&&value.length>0&&value.length<=max;
export function safeTree(value:unknown,depth=0,counter={nodes:0}){
  demand(++counter.nodes<=50000&&depth<=18,'데이터 구조가 너무 커요.');
  if(value===null||typeof value==='boolean')return;
  if(typeof value==='number'){demand(Number.isFinite(value),'유효하지 않은 숫자예요.');return;}
  if(typeof value==='string'){demand(value.length<=1024,'문자열이 너무 길어요.');return;}
  demand(typeof value==='object','지원하지 않는 데이터예요.');
  if(Array.isArray(value)){demand(value.length<=100,'배열은 최대 100개까지 지원해요.');demand(Reflect.ownKeys(value).every(key=>key==='length'||typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key)&&Number(key)<value.length),'배열에 허용되지 않는 키가 있어요.');for(let i=0;i<value.length;i++){const descriptor=Object.getOwnPropertyDescriptor(value,String(i));demand(descriptor&&'value' in descriptor,'빈 배열 항목이나 접근자가 있어요.');safeTree(descriptor.value,depth+1,counter);}return;}
  demand(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null,'객체 원형이 잘못됐어요.');
  for(const key of Reflect.ownKeys(value as object)){demand(typeof key==='string'&&!['__proto__','prototype','constructor'].includes(key),'허용되지 않는 키예요.');const descriptor=Object.getOwnPropertyDescriptor(value,key)!;demand('value' in descriptor,'접근자 속성은 지원하지 않아요.');safeTree(descriptor.value,depth+1,counter);}
}
export function settings(value:unknown):SessionSettings{
  const item=object(value);exact(item,['mute','volume','inputMode','reducedMotion','notation']);
  demand(typeof item.mute==='boolean'&&typeof item.reducedMotion==='boolean'&&typeof item.volume==='number'&&Number.isFinite(item.volume)&&item.volume>=0&&item.volume<=1&&['keyboard','pads'].includes(String(item.inputMode))&&['letters','solfege'].includes(String(item.notation)),'설정 값이 잘못됐어요.');return {...item} as SessionSettings;
}
export function validateMeta(value:unknown):Meta{
  safeTree(value);const item=object(value);exact(item,['schemaVersion','contentVersion','revision','writerLease']);demand(item.schemaVersion===1&&item.contentVersion==='1.0.0'&&integer(item.revision),'지원하지 않는 저장 버전이에요.');
  if(item.writerLease!==null){const lease=object(item.writerLease);exact(lease,['ownerId','token','expiresAt']);demand(identifier(lease.ownerId)&&identifier(lease.token)&&integer(lease.expiresAt),'작성자 정보가 잘못됐어요.');}return structuredClone(item) as Meta;
}
function validateAttempt(value:unknown):Attempt{
  const item=object(value);exact(item,['attemptId','orderId','contentVersion','revision','notes','evidence','completionId','updatedAt']);
  const order=loadOrders().find(order=>order.id===item.orderId);demand(order&&identifier(item.attemptId)&&item.contentVersion==='1.0.0'&&integer(item.revision)&&integer(item.updatedAt),'시도 정보가 잘못됐어요.');
  demand(Array.isArray(item.notes)&&item.notes.length===3&&item.notes.every((note,index)=>Number.isInteger(note)&&note>=60&&note<=74&&(order.editableSlots.includes(index)||note===order.initialMidi[index])),'시도의 음 정보가 잘못됐어요.');
  const evidence=restoredEvidence(item.evidence,order,item.revision);
  demand((evidence.firstReflectionAnswer===null)===(evidence.latestReflectionAnswer===null),'관계 답 기록이 불완전해요.');
  demand(!evidence.finalSuccess||gradeMidi(item.notes as number[],order).status==='correct','수리 성공과 음이 일치하지 않아요.');
  demand(item.completionId===null||item.completionId===`${order.id}:1.0.0:${item.attemptId}`,'완료 식별자가 잘못됐어요.');
  demand(item.completionId===null||evidence.finalSuccess,'완료에 수리 성공 기록이 없어요.');
  return {...item,evidence} as Attempt;
}
export function validateProfile(value:unknown):Profile{
  safeTree(value);const item=object(value);exact(item,['schemaVersion','contentVersion','revision','settings','attempts','progress','draft']);
  demand(item.schemaVersion===1&&item.contentVersion==='1.0.0','이 버전의 기록은 지원하지 않아요.');demand(integer(item.revision),'저장 순서가 잘못됐어요.');
  const mainSettings=settings(item.settings);demand(Array.isArray(item.attempts)&&item.attempts.length<=100&&Array.isArray(item.progress)&&item.progress.length<=8,'기록 개수가 범위를 넘었어요.');
  const attempts=item.attempts.map(validateAttempt);demand(new Set(attempts.map(row=>row.attemptId)).size===attempts.length,'중복 시도예요.');
  const progress=item.progress.map(raw=>{const row=object(raw);exact(row,['orderId','receipt','first','latest','attemptCount','completionCount','assistedCount']);const first=validateAttempt(row.first),latest=validateAttempt(row.latest);demand(row.orderId===first.orderId&&row.orderId===latest.orderId&&integer(row.attemptCount)&&row.attemptCount>=1&&integer(row.completionCount)&&row.completionCount<=row.attemptCount&&integer(row.assistedCount)&&row.assistedCount<=row.attemptCount,'진행 요약이 잘못됐어요.');if(row.receipt!==null){const receipt=object(row.receipt);exact(receipt,['orderId','contentVersion','completionId']);demand(receipt.orderId===row.orderId&&receipt.contentVersion==='1.0.0'&&identifier(receipt.completionId,256)&&receipt.completionId.startsWith(`${row.orderId}:1.0.0:`)&&row.completionCount>0,'완료증이 잘못됐어요.');}return {...row,first,latest} as Progress;});
  demand(new Set(progress.map(row=>row.orderId)).size===progress.length,'중복 주문 진행이에요.');
  for(const attempt of attempts){const summary=progress.find(row=>row.orderId===attempt.orderId);demand(summary,'시도에 해당하는 주문 요약이 없어요.');for(const anchor of [summary.first,summary.latest])if(anchor.attemptId===attempt.attemptId)demand(JSON.stringify(anchor)===JSON.stringify(attempt),'시도와 요약이 일치하지 않아요.');}
  let draft:Profile['draft']=null;
  if(item.draft!==null){const envelope=object(item.draft);exact(envelope,['sequence','state']);demand(integer(envelope.sequence),'체크포인트 순서가 잘못됐어요.');const state=object(envelope.state),order=loadOrders().find(order=>order.id===state.orderId);demand(order,'알 수 없는 주문이에요.');const restored=restoreSession(state,order);demand(restored.ok,restored.ok?'':restored.error);draft={sequence:envelope.sequence,state:{...restored.state,settings:mainSettings}};const attempt=attempts.find(row=>row.attemptId===draft?.state.attemptId);demand(attempt&&JSON.stringify(attempt.evidence)===JSON.stringify(draft.state.evidence),'작업과 시도 증거가 일치하지 않아요.');}
  return structuredClone({schemaVersion:1,contentVersion:'1.0.0',revision:item.revision,settings:mainSettings,attempts,progress,draft});
}
export function validateExport(value:unknown):ProgressExport{safeTree(value);const item=object(value);exact(item,['schemaVersion','contentVersion','settings','attempts','progress']);const profile=validateProfile({...item,revision:0,draft:null});const {revision:_revision,draft:_draft,...result}=profile;return result;}
