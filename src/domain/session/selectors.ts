import type { Order } from '../../content/types';
import type { CompletionReceipt, SessionState } from './types';

export const ORDER_IDS = ['CR01','CR02','CR03','CR04','CR05','CR06','CR07','CR08'] as const;
export function reflectionOptions(state:SessionState,order:Order):readonly {id:string;text:string}[] {
  if(state.orderId!==order.id) return [];
  return state.reflection.optionIds.map(id=>({id,text:order.reflection.options[Number(id.slice(id.lastIndexOf(':')+1))]}));
}
export function canShowExplanation(state:SessionState):boolean {return (state.learning==='reflection'||state.learning==='completed')&&state.reflection.phase==='explanation';}
export function canEdit(state:SessionState):boolean {return ['editing','feedback','checking'].includes(state.learning)&&state.demoSnapshot===null;}
export function canCheck(state:SessionState):boolean {return state.learning==='editing'&&state.demoSnapshot===null;}
export function isIndependentRepair(state:SessionState,order:Order):boolean {
  return state.orderId===order.id&&order.hintPolicy!=='guided'&&state.evidence.evidenceStatus==='known'&&state.evidence.finalSuccess&&state.evidence.firstSubmission?.status==='correct'&&state.evidence.maxRepairHintLevel===0;
}
export function isIndependentReflection(state:SessionState,order:Order):boolean {
  const evidence=state.evidence;
  return state.orderId===order.id&&order.hintPolicy!=='guided'&&evidence.evidenceStatus==='known'&&evidence.firstReflectionAnswer?.correct===true&&evidence.maxReflectionHintLevel===0&&!evidence.answerRevealedBeforeFirstAnswer&&!evidence.reflectionSkipped;
}
export function completedOrderIds(receipts:readonly CompletionReceipt[]):readonly string[] {
  return ORDER_IDS.filter(id=>receipts.some(receipt=>receipt.orderId===id&&receipt.contentVersion==='1.0.0'&&receipt.completionId.length>0));
}
export function isEnsembleUnlocked(receipts:readonly CompletionReceipt[]):boolean {return completedOrderIds(receipts).length===ORDER_IDS.length;}
export function canOpenOrder(orderId:string,receipts:readonly CompletionReceipt[]):boolean {
  const index=ORDER_IDS.findIndex(id=>id===orderId);if(index<0)return false;
  const completed=completedOrderIds(receipts);
  return completed.length===ORDER_IDS.length||ORDER_IDS.find(id=>!completed.includes(id))===orderId;
}
