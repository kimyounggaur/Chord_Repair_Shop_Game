import type { Order } from '../../content/types';
import type { Grade } from '../grading';

export type AppStatus = 'boot'|'ready'|'contentError'|'recovery';
export type LearningStatus = 'orderIntro'|'editing'|'checking'|'feedback'|'reflection'|'completed';
export type AudioStatus = 'locked'|'preparing'|'ready'|'playing'|'paused'|'unavailable';
export type StorageStatus = 'clean'|'dirty'|'saving'|'failed'|'memoryOnly';
export type Screen = 'home'|'orders'|'workbench'|'ensemble'|'sandbox'|'settings';
export type HintLevel = 0|1|2|3;
export type GradeRequest = Readonly<{orderId:string;attemptId:string;revision:number;submissionId:string}>;
export type CompletionReceipt = Readonly<{orderId:string;contentVersion:string;completionId:string}>;
export type ReflectionAnswer = Readonly<{optionId:string;correct:boolean}>;
export type AttemptEvidence = Readonly<{
  evidenceStatus:'known'|'unknown';
  firstSubmission:Readonly<{status:'correct'|'incorrect';revision:number;submissionId:string}>|null;
  finalSuccess:boolean;
  maxRepairHintLevel:HintLevel;
  maxReflectionHintLevel:HintLevel;
  answerRevealedBeforeFirstAnswer:boolean;
  firstReflectionAnswer:ReflectionAnswer|null;
  latestReflectionAnswer:ReflectionAnswer|null;
  reflectionSkipped:boolean;
}>;
export type SessionSettings = Readonly<{mute:boolean;volume:number;inputMode:'keyboard'|'pads';reducedMotion:boolean;notation:'letters'|'solfege'}>;
export type EditSnapshot = Readonly<{notes:readonly number[];selectedSlot:number|null}>;
export type SessionState = Readonly<{
  schemaVersion:1;orderId:string;contentVersion:string;attemptId:string;revision:number;
  app:AppStatus;learning:LearningStatus;audio:AudioStatus;storage:StorageStatus;screen:Screen;
  notes:readonly number[];selectedSlot:number|null;undo:readonly EditSnapshot[];demoSnapshot:EditSnapshot|null;
  pendingGrade:GradeRequest|null;submissionSequence:number;lastGrade:Grade|null;completionId:string|null;
  evidence:AttemptEvidence;
  reflection:Readonly<{phase:'question'|'explanation';seed:number;optionIds:readonly string[]}>;
  settings:SessionSettings;
}>;
export type SessionEvent =
  | {type:'START_ORDER'|'EDIT'|'UNDO'|'RESET'|'CHECK'|'DEMO'|'RETURN_FROM_DEMO'|'KEEP_DEMO'|'SKIP'|'SHOW_EXPLANATION'|'EXPOSE_REFLECTION_ANSWER'|'CONTINUE'|'HIDDEN'|'RETURN'|'LOAD_OK'|'SAVE_INVALID'|'CONTENT_ERROR'}
  | {type:'SELECT_SLOT';slot:number}
  | {type:'SELECT_PITCH';midi:number;repeat?:boolean}
  | {type:'GRADE_READY';request:GradeRequest;grade:Grade}
  | {type:'HINT';area:'repair'|'reflection';level:1|2|3;revealsReflectionAnswer?:boolean}
  | {type:'ANSWER';questionId:string;optionId:string}
  | {type:'NEW_PRACTICE';attemptId:string;seed:number}
  | {type:'NEXT';order:Order;attemptId:string;seed:number}
  | {type:'SET_SETTINGS';patch:Partial<SessionSettings>}
  | {type:'SET_AUDIO';status:AudioStatus}
  | {type:'SET_STORAGE';status:StorageStatus}
  | {type:'SET_SCREEN';screen:Screen};
export type GradeCommand = Readonly<{type:'GRADE';request:GradeRequest;notes:readonly number[]}>;
export type SessionCommand = GradeCommand
  | Readonly<{type:'CANCEL_AUDIO'}>
  | Readonly<{type:'FOCUS';target:string}>
  | Readonly<{type:'SAVE';immediate:boolean;reason:'edit'|'evidence'|'settings'|'hidden'}>
  | Readonly<{type:'COMPLETE';receipt:CompletionReceipt}>;
export type SessionTransition = Readonly<{state:SessionState;commands:readonly SessionCommand[]}>;
export type RestoreResult = {ok:true;state:SessionState}|{ok:false;error:string};
