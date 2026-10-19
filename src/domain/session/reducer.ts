import type { Order } from '../../content/types';
import { exposeReflectionAnswer, freshEvidence } from './evidence';
import { canEdit, ORDER_IDS } from './selectors';
import type { EditSnapshot, GradeRequest, HintLevel, SessionCommand, SessionEvent, SessionSettings, SessionState, SessionTransition } from './types';

export const DEFAULT_SETTINGS:SessionSettings={mute:false,volume:0.35,inputMode:'keyboard',reducedMotion:false,notation:'letters'};
const unchanged=(state:SessionState):SessionTransition=>({state,commands:[]});
const dirty=(state:SessionState)=>state.storage==='memoryOnly'?'memoryOnly' as const:'dirty' as const;
const save=(immediate:boolean,reason:'edit'|'evidence'|'settings'|'hidden'):SessionCommand=>({type:'SAVE',immediate,reason});
const snapshot=(state:SessionState):EditSnapshot=>({notes:[...state.notes],selectedSlot:state.selectedSlot});
const sameNotes=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((note,index)=>note===b[index]);
const validId=(value:string)=>typeof value==='string'&&value.length>0&&value.length<=128;
const sameRequest=(a:GradeRequest,b:GradeRequest)=>a.orderId===b.orderId&&a.attemptId===b.attemptId&&a.revision===b.revision&&a.submissionId===b.submissionId;

/** Explicit, portable PRNG; the stored permutation is the source of truth on reload. */
function shuffledOptions(order:Order,seed:number):readonly string[] {
  const ids=order.reflection.options.map((_,index)=>`${order.id}:option:${index}`);let random=seed>>>0;
  for(let index=ids.length-1;index>0;index--){
    random=(random+0x6d2b79f5)>>>0;let mixed=Math.imul(random^(random>>>15),random|1);
    mixed^=mixed+Math.imul(mixed^(mixed>>>7),mixed|61);
    const other=Math.floor((((mixed^(mixed>>>14))>>>0)/4294967296)*(index+1));
    [ids[index],ids[other]]=[ids[other],ids[index]];
  }
  return ids;
}

export function createSession(order:Order,attemptId:string,seed:number):SessionState {
  if(!validId(attemptId)||!Number.isSafeInteger(seed)||seed<0||seed>4294967295) throw new Error('Invalid attempt ID or shuffle seed');
  return {schemaVersion:1,orderId:order.id,contentVersion:order.contentVersion,attemptId,revision:0,app:'ready',learning:'orderIntro',audio:'locked',storage:'clean',screen:'workbench',notes:[...order.initialMidi],selectedSlot:null,undo:[],demoSnapshot:null,pendingGrade:null,submissionSequence:0,lastGrade:null,completionId:null,evidence:freshEvidence(),reflection:{phase:'question',seed,optionIds:shuffledOptions(order,seed)},settings:{...DEFAULT_SETTINGS}};
}

function editNotes(state:SessionState,notes:readonly number[],selectedSlot:number|null,recordUndo=true):SessionTransition {
  if(sameNotes(notes,state.notes)) return selectedSlot===state.selectedSlot?unchanged(state):{state:{...state,selectedSlot},commands:[]};
  return {state:{...state,notes:[...notes],selectedSlot,revision:state.revision+1,undo:recordUndo?[...state.undo,snapshot(state)].slice(-50):state.undo,learning:'editing',pendingGrade:null,lastGrade:null,storage:dirty(state)},commands:[{type:'CANCEL_AUDIO'},save(false,'edit')]};
}
function evidenceChanged(state:SessionState,evidence:SessionState['evidence']):SessionTransition {
  return {state:{...state,evidence,storage:dirty(state)},commands:[save(true,'evidence')]};
}

export function reduceSession(state:SessionState,event:SessionEvent,order:Order):SessionTransition {
  if(state.orderId!==order.id||state.contentVersion!==order.contentVersion) return unchanged(state);
  if(state.app!=='ready'&&!['LOAD_OK','SAVE_INVALID','CONTENT_ERROR','HIDDEN','RETURN','SET_AUDIO','SET_STORAGE','SET_SCREEN','SET_SETTINGS'].includes(event.type))return unchanged(state);
  switch(event.type){
    case 'LOAD_OK': return {state:{...state,app:'ready'},commands:[]};
    case 'SAVE_INVALID': return {state:{...state,app:'recovery'},commands:[]};
    case 'CONTENT_ERROR': return {state:{...state,app:'contentError'},commands:[{type:'CANCEL_AUDIO'}]};
    case 'START_ORDER': return state.learning==='orderIntro'?{state:{...state,learning:'editing',storage:dirty(state)},commands:[save(true,'evidence')]}:unchanged(state);
    case 'SELECT_SLOT':
      if(!canEdit(state)||!Number.isInteger(event.slot)||!order.editableSlots.includes(event.slot)||state.selectedSlot===event.slot)return unchanged(state);
      return {state:{...state,selectedSlot:event.slot},commands:[{type:'FOCUS',target:`slot-${event.slot}`}]};
    case 'SELECT_PITCH': {
      if(!canEdit(state)||event.repeat||state.selectedSlot===null||!order.editableSlots.includes(state.selectedSlot)||!Number.isInteger(event.midi)||event.midi<order.allowedMidi[0]||event.midi>order.allowedMidi[1])return unchanged(state);
      const notes=[...state.notes];notes[state.selectedSlot]=event.midi;return editNotes(state,notes,state.selectedSlot);
    }
    case 'EDIT':return state.learning==='feedback'?{state:{...state,learning:'editing',lastGrade:null},commands:[]}:unchanged(state);
    case 'UNDO': {
      if(!canEdit(state)||state.undo.length===0)return unchanged(state);const previous=state.undo[state.undo.length-1];
      const result=editNotes({...state,undo:state.undo.slice(0,-1)},previous.notes,previous.selectedSlot,false);
      return {...result,commands:[...result.commands,{type:'FOCUS',target:previous.selectedSlot===null?'workbench-heading':`slot-${previous.selectedSlot}`}]};
    }
    case 'RESET':return canEdit(state)?editNotes(state,order.initialMidi,null):unchanged(state);
    case 'CHECK': {
      if(state.learning!=='editing'||state.demoSnapshot!==null)return unchanged(state);
      const submissionSequence=state.submissionSequence+1;const request={orderId:state.orderId,attemptId:state.attemptId,revision:state.revision,submissionId:`${state.attemptId}:${submissionSequence}`};
      return {state:{...state,learning:'checking',pendingGrade:request,submissionSequence,storage:dirty(state)},commands:[save(true,'evidence'),{type:'GRADE',request,notes:[...state.notes]}]};
    }
    case 'GRADE_READY': {
      if(state.learning!=='checking'||state.pendingGrade===null||!sameRequest(state.pendingGrade,event.request))return unchanged(state);
      const valid=event.grade.status==='correct'||event.grade.status==='incorrect';const success=event.grade.status==='correct';
      const evidence={...state.evidence,firstSubmission:state.evidence.firstSubmission??(valid?{status:event.grade.status as 'correct'|'incorrect',revision:state.revision,submissionId:event.request.submissionId}:null),finalSuccess:state.evidence.finalSuccess||success};
      return {state:{...state,learning:success?'reflection':'feedback',pendingGrade:null,lastGrade:event.grade,evidence,storage:dirty(state)},commands:[save(true,'evidence'),...(success?[{type:'FOCUS' as const,target:'reflection-question'}]:[])]};
    }
    case 'HINT': {
      if(![1,2,3].includes(event.level)||state.learning==='orderIntro'||state.learning==='completed'||(event.area==='reflection'&&state.learning!=='reflection'))return unchanged(state);
      const key=event.area==='repair'?'maxRepairHintLevel':'maxReflectionHintLevel';let evidence={...state.evidence,[key]:Math.max(state.evidence[key],event.level) as HintLevel};
      if(event.revealsReflectionAnswer)evidence=exposeReflectionAnswer(evidence);
      if(JSON.stringify(evidence)===JSON.stringify(state.evidence))return unchanged(state);
      return evidenceChanged(state,evidence);
    }
    case 'EXPOSE_REFLECTION_ANSWER': {
      const evidence=exposeReflectionAnswer(state.evidence);return evidence===state.evidence?unchanged(state):evidenceChanged(state,evidence);
    }
    case 'DEMO': {
      if(!canEdit(state))return unchanged(state);
      const evidence=exposeReflectionAnswer({...state.evidence,maxRepairHintLevel:3});const result=editNotes(state,order.targetMidi,state.selectedSlot);
      return {state:{...result.state,learning:'editing',pendingGrade:null,lastGrade:null,evidence,demoSnapshot:snapshot(state),storage:dirty(state)},commands:[...(result.commands.some(command=>command.type==='CANCEL_AUDIO')?result.commands:[{type:'CANCEL_AUDIO' as const},...result.commands]),save(true,'evidence')]};
    }
    case 'RETURN_FROM_DEMO': {
      if(state.demoSnapshot===null)return unchanged(state);const previous=state.demoSnapshot;
      const result=editNotes({...state,demoSnapshot:null},previous.notes,previous.selectedSlot);
      return {state:result.state,commands:[...result.commands,save(true,'evidence'),{type:'FOCUS',target:previous.selectedSlot===null?'workbench-heading':`slot-${previous.selectedSlot}`}]};
    }
    case 'KEEP_DEMO':return state.demoSnapshot===null?unchanged(state):{state:{...state,demoSnapshot:null,storage:dirty(state)},commands:[save(true,'evidence')]};
    case 'ANSWER': {
      if(state.learning!=='reflection'||event.questionId!==`${order.id}:reflection`||!state.reflection.optionIds.includes(event.optionId))return unchanged(state);
      const answer={optionId:event.optionId,correct:event.optionId===`${order.id}:option:${order.reflection.answerIndex}`};
      if(state.evidence.latestReflectionAnswer?.optionId===event.optionId)return unchanged(state);
      return {state:{...state,reflection:{...state.reflection,phase:'explanation'},evidence:{...state.evidence,firstReflectionAnswer:state.evidence.firstReflectionAnswer??answer,latestReflectionAnswer:answer},storage:dirty(state)},commands:[save(true,'evidence'),{type:'FOCUS',target:'reflection-explanation'}]};
    }
    case 'SKIP': {
      if(state.learning!=='reflection'||state.evidence.firstReflectionAnswer!==null||state.evidence.reflectionSkipped)return unchanged(state);
      return {state:{...state,reflection:{...state.reflection,phase:'explanation'},evidence:{...state.evidence,reflectionSkipped:true},storage:dirty(state)},commands:[save(true,'evidence'),{type:'FOCUS',target:'reflection-explanation'}]};
    }
    case 'SHOW_EXPLANATION': {
      if(state.learning!=='reflection'||state.reflection.phase==='explanation')return unchanged(state);
      return {state:{...state,reflection:{...state.reflection,phase:'explanation'},evidence:exposeReflectionAnswer(state.evidence),storage:dirty(state)},commands:[save(true,'evidence'),{type:'FOCUS',target:'reflection-explanation'}]};
    }
    case 'CONTINUE': {
      if(state.learning!=='reflection'||state.reflection.phase!=='explanation'||!state.evidence.finalSuccess)return unchanged(state);
      const completionId=`${state.orderId}:${state.contentVersion}:${state.attemptId}`;const receipt={orderId:state.orderId,contentVersion:state.contentVersion,completionId};
      return {state:{...state,learning:'completed',completionId,storage:dirty(state)},commands:[{type:'COMPLETE',receipt},{type:'FOCUS',target:'completion-heading'}]};
    }
    case 'NEW_PRACTICE':
    case 'NEXT': {
      if(state.learning!=='completed'||!validId(event.attemptId)||event.attemptId===state.attemptId||!Number.isSafeInteger(event.seed)||event.seed<0||event.seed>4294967295)return unchanged(state);
      if(event.type==='NEXT'&&ORDER_IDS[ORDER_IDS.findIndex(id=>id===state.orderId)+1]!==event.order.id)return unchanged(state);
      const next=createSession(event.type==='NEXT'?event.order:order,event.attemptId,event.seed);
      return {state:{...next,settings:state.settings,audio:state.audio,storage:dirty(state)},commands:[{type:'CANCEL_AUDIO'},save(true,'evidence')]};
    }
    case 'HIDDEN':return {state:{...state,audio:state.audio==='locked'||state.audio==='unavailable'?state.audio:'paused'},commands:[{type:'CANCEL_AUDIO'},save(true,'hidden')]};
    case 'RETURN':return unchanged(state);
    case 'SET_AUDIO':return state.audio===event.status?unchanged(state):{state:{...state,audio:event.status},commands:[]};
    case 'SET_STORAGE':return state.storage===event.status?unchanged(state):{state:{...state,storage:event.status},commands:[]};
    case 'SET_SCREEN':return state.screen===event.screen?unchanged(state):{state:{...state,screen:event.screen,storage:dirty(state)},commands:[{type:'CANCEL_AUDIO'},save(true,'evidence')]};
    case 'SET_SETTINGS': {
      if(Object.keys(event.patch).some(key=>!['mute','volume','inputMode','reducedMotion','notation'].includes(key)))return unchanged(state);
      const settings={...state.settings,...event.patch};
      if(typeof settings.mute!=='boolean'||typeof settings.reducedMotion!=='boolean'||!['keyboard','pads'].includes(settings.inputMode)||!['letters','solfege'].includes(settings.notation)||!Number.isFinite(settings.volume)||settings.volume<0||settings.volume>1)return unchanged(state);
      if(JSON.stringify(settings)===JSON.stringify(state.settings))return unchanged(state);
      return {state:{...state,settings,storage:dirty(state)},commands:[save(false,'settings')]};
    }
  }
}
