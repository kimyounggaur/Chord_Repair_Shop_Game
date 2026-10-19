import type { Order } from '../../content/types';
import { gradeMidi } from '../grading';
import { freshEvidence } from './evidence';
import type { AttemptEvidence, RestoreResult, SessionState } from './types';

const MAX_SNAPSHOT_BYTES=256*1024;
const stateKeys=['schemaVersion','orderId','contentVersion','attemptId','revision','app','learning','audio','storage','screen','notes','selectedSlot','undo','demoSnapshot','pendingGrade','submissionSequence','lastGrade','completionId','evidence','reflection','settings'];
const evidenceKeys=['evidenceStatus','firstSubmission','finalSuccess','maxRepairHintLevel','maxReflectionHintLevel','answerRevealedBeforeFirstAnswer','firstReflectionAnswer','latestReflectionAnswer','reflectionSkipped'];
const gradeCodes=['INVALID_DATA','INCOMPLETE','ROOT_MEMBER_MISSING','THIRD_MISMATCH','FIFTH_MISMATCH','MEMBERS_MISMATCH','REGISTER_MISMATCH','INVERSION_MISMATCH','SPELLING_MISMATCH','CORRECT'];
function requireValid(condition:unknown,message:string):asserts condition {if(!condition)throw new Error(message);}
function record(value:unknown):Record<string,unknown> {
  requireValid(value!==null&&typeof value==='object'&&!Array.isArray(value),'Expected object');
  requireValid(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null,'Unexpected object prototype');
  return value as Record<string,unknown>;
}
function exact(value:Record<string,unknown>,allowed:readonly string[],optional:readonly string[]=[]):void {
  requireValid(Object.keys(value).every(key=>allowed.includes(key)),'Unexpected field');
  requireValid(allowed.every(key=>optional.includes(key)||Object.hasOwn(value,key)),'Missing field');
}
const integer=(value:unknown):value is number=>Number.isSafeInteger(value)&&Number(value)>=0;
const id=(value:unknown,max=256):value is string=>typeof value==='string'&&value.length>0&&value.length<=max;
function enumeration(value:unknown,values:readonly string[]):void {requireValid(typeof value==='string'&&values.includes(value),'Invalid state value');}
function safeTree(value:unknown,depth=0):void {
  requireValid(depth<=16,'Snapshot nesting too deep');
  if(value===null||typeof value!=='object')return;
  if(Array.isArray(value)){requireValid(value.length<=50,'Oversized array');for(let index=0;index<value.length;index++){requireValid(Object.hasOwn(value,index),'Sparse array');safeTree(value[index],depth+1);}return;}
  const item=record(value);for(const [key,child] of Object.entries(item)){requireValid(!['__proto__','prototype','constructor'].includes(key),'Dangerous key');safeTree(child,depth+1);}
}
function validateNotes(value:unknown,order:Order):void {
  requireValid(Array.isArray(value)&&value.length===3&&value.every(note=>Number.isInteger(note)&&note>=order.allowedMidi[0]&&note<=order.allowedMidi[1]),'Invalid notes');
  requireValid(value.every((note,index)=>order.editableSlots.includes(index)||note===order.initialMidi[index]),'Locked note changed');
}
function validateSlot(value:unknown,order:Order):void {requireValid(value===null||(Number.isInteger(value)&&order.editableSlots.includes(Number(value))),'Invalid selected slot');}
function validateEdit(value:unknown,order:Order):void {const item=record(value);exact(item,['notes','selectedSlot']);validateNotes(item.notes,order);validateSlot(item.selectedSlot,order);}
function validateAnswer(value:unknown,order:Order):void {
  if(value===null)return;const answer=record(value);exact(answer,['optionId','correct']);
  requireValid(typeof answer.optionId==='string'&&order.reflection.options.some((_,index)=>answer.optionId===`${order.id}:option:${index}`),'Invalid option ID');
  requireValid(typeof answer.correct==='boolean'&&answer.correct===(answer.optionId===`${order.id}:option:${order.reflection.answerIndex}`),'Invalid answer correctness');
}
function validateGrade(value:unknown):void {
  if(value===null)return;const item=record(value);exact(item,['status','codes','pitchClassCorrect','spellingCorrect','registerCorrect','inversionCorrect','mismatchedRoles']);
  enumeration(item.status,['invalid','incomplete','incorrect','correct']);
  requireValid(Array.isArray(item.codes)&&item.codes.length>0&&item.codes.length<=10&&item.codes.every(code=>gradeCodes.includes(code)),'Invalid grade codes');
  requireValid(['pitchClassCorrect','spellingCorrect','registerCorrect','inversionCorrect'].every(key=>typeof item[key]==='boolean'),'Invalid grade flags');
  requireValid(Array.isArray(item.mismatchedRoles)&&item.mismatchedRoles.length<=3&&item.mismatchedRoles.every(role=>['root','third','fifth'].includes(role)),'Invalid grade roles');
}
export function restoredEvidence(value:unknown,order:Order,revision:number):AttemptEvidence {
  if(value===undefined)return {...freshEvidence(),evidenceStatus:'unknown'};
  const item=record(value);exact(item,evidenceKeys,evidenceKeys);
  if(Object.hasOwn(item,'evidenceStatus'))enumeration(item.evidenceStatus,['known','unknown']);
  for(const key of ['finalSuccess','answerRevealedBeforeFirstAnswer','reflectionSkipped'])if(Object.hasOwn(item,key))requireValid(typeof item[key]==='boolean','Invalid evidence flag');
  for(const key of ['maxRepairHintLevel','maxReflectionHintLevel'])if(Object.hasOwn(item,key))requireValid(integer(item[key])&&item[key]<=3,'Invalid help level');
  if(Object.hasOwn(item,'firstSubmission')&&item.firstSubmission!==null){const first=record(item.firstSubmission);exact(first,['status','revision','submissionId']);enumeration(first.status,['correct','incorrect']);requireValid(integer(first.revision)&&first.revision<=revision&&id(first.submissionId),'Invalid first submission');}
  for(const key of ['firstReflectionAnswer','latestReflectionAnswer'])if(Object.hasOwn(item,key))validateAnswer(item[key],order);
  const complete=evidenceKeys.every(key=>Object.hasOwn(item,key));
  return {...freshEvidence(),...item,evidenceStatus:complete&&item.evidenceStatus==='known'?'known':'unknown'} as AttemptEvidence;
}

export function serializeSession(state:SessionState):string {return JSON.stringify(state);}

export function restoreSession(serialized:unknown,order:Order):RestoreResult {
  try {
    const text=typeof serialized==='string'?serialized:JSON.stringify(serialized);
    requireValid(typeof text==='string'&&new TextEncoder().encode(text).length<=MAX_SNAPSHOT_BYTES,'Snapshot exceeds 256 KB');
    const input:unknown=typeof serialized==='string'?JSON.parse(serialized):serialized;safeTree(input);
    const item=record(input);exact(item,stateKeys,['evidence']);
    requireValid(item.schemaVersion===1,'Unsupported snapshot version');requireValid(item.orderId===order.id&&item.contentVersion===order.contentVersion,'Order or content version mismatch');
    requireValid(id(item.attemptId,128)&&integer(item.revision)&&integer(item.submissionSequence),'Invalid attempt/revision');
    enumeration(item.app,['boot','ready','contentError','recovery']);enumeration(item.learning,['orderIntro','editing','checking','feedback','reflection','completed']);
    enumeration(item.audio,['locked','preparing','ready','playing','paused','unavailable']);enumeration(item.storage,['clean','dirty','saving','failed','memoryOnly']);enumeration(item.screen,['home','orders','workbench','ensemble','sandbox','settings']);
    validateNotes(item.notes,order);validateSlot(item.selectedSlot,order);
    requireValid(Array.isArray(item.undo)&&item.undo.length<=50,'Invalid undo stack');item.undo.forEach(edit=>validateEdit(edit,order));
    if(item.demoSnapshot!==null){validateEdit(item.demoSnapshot,order);requireValid(item.learning==='editing','Invalid demonstration phase');}
    if(item.pendingGrade!==null){const request=record(item.pendingGrade);exact(request,['orderId','attemptId','revision','submissionId']);requireValid(request.orderId===item.orderId&&request.attemptId===item.attemptId&&request.revision===item.revision&&request.submissionId===`${item.attemptId}:${item.submissionSequence}`&&item.learning==='checking','Invalid pending request');}
    requireValid((item.learning==='checking')===(item.pendingGrade!==null),'Inconsistent checking phase');
    validateGrade(item.lastGrade);
    requireValid(item.completionId===null||id(item.completionId),'Invalid completion ID');
    requireValid(item.learning==='completed'?item.completionId===`${item.orderId}:${item.contentVersion}:${item.attemptId}`:item.completionId===null,'Inconsistent completion');
    const reflection=record(item.reflection);exact(reflection,['phase','seed','optionIds']);enumeration(reflection.phase,['question','explanation']);
    requireValid(integer(reflection.seed)&&reflection.seed<=4294967295,'Invalid shuffle seed');
    requireValid(Array.isArray(reflection.optionIds)&&reflection.optionIds.length===order.reflection.options.length&&new Set(reflection.optionIds).size===reflection.optionIds.length&&order.reflection.options.every((_,index)=>(reflection.optionIds as unknown[]).includes(`${order.id}:option:${index}`)),'Invalid option permutation');
    const settings=record(item.settings);exact(settings,['mute','volume','inputMode','reducedMotion','notation']);
    requireValid(typeof settings.mute==='boolean'&&typeof settings.reducedMotion==='boolean'&&typeof settings.volume==='number'&&Number.isFinite(settings.volume)&&settings.volume>=0&&settings.volume<=1,'Invalid settings');enumeration(settings.inputMode,['keyboard','pads']);enumeration(settings.notation,['letters','solfege']);
    let evidence=restoredEvidence(item.evidence,order,item.revision);
    const repaired=item.learning==='reflection'||item.learning==='completed';
    if(repaired){requireValid(gradeMidi(item.notes as number[],order).status==='correct','Reflection requires a repaired chord');requireValid(reflection.phase==='explanation'||item.learning==='reflection','Completed question not explained');}
    else requireValid(reflection.phase==='question','Explanation outside reflection');
    if(evidence.evidenceStatus==='known'){
      requireValid(evidence.finalSuccess===repaired,'Inconsistent repair evidence');
      requireValid(evidence.firstSubmission?.status!=='correct'||repaired,'Successful first submission requires repaired phase');
      requireValid(!repaired||evidence.firstSubmission!==null,'Repair missing first submission');
      if(reflection.phase==='question')requireValid(evidence.firstReflectionAnswer===null&&evidence.latestReflectionAnswer===null&&!evidence.reflectionSkipped,'Inconsistent question evidence');
      else requireValid(evidence.firstReflectionAnswer!==null||evidence.reflectionSkipped||evidence.answerRevealedBeforeFirstAnswer,'Explanation missing exposure/response evidence');
      requireValid((evidence.firstReflectionAnswer===null)===(evidence.latestReflectionAnswer===null),'Incomplete answer history');
      if(item.demoSnapshot!==null)requireValid(evidence.maxRepairHintLevel===3&&evidence.answerRevealedBeforeFirstAnswer,'Demonstration missing evidence');
    } else evidence={...evidence,finalSuccess:evidence.finalSuccess||repaired};
    // All fields were checked. Reparse to detach caller-owned arrays/objects before normalization.
    const detached=JSON.parse(text) as SessionState;
    const detachedEvidence=JSON.parse(JSON.stringify(evidence)) as AttemptEvidence;
    const state:SessionState={...detached,evidence:detachedEvidence,app:'ready',learning:detached.learning==='checking'?'editing':detached.learning,pendingGrade:null,audio:['playing','preparing','ready'].includes(detached.audio)?'paused':detached.audio,storage:detached.storage==='memoryOnly'?'memoryOnly':'clean'};
    return {ok:true,state};
  } catch(error){return {ok:false,error:error instanceof Error?error.message:'Invalid snapshot'};}
}
