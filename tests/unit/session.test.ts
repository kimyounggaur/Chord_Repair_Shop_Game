import { describe, expect, it } from 'vitest';
import { loadOrders } from '../../src/content/loader';
import { createSession, reduceSession } from '../../src/domain/session/reducer';
import { executeGradeCommand } from '../../src/domain/session/commands';
import { restoreSession, serializeSession } from '../../src/domain/session/serialization';
import { evidenceDoesNotRegress } from '../../src/domain/session/evidence';
import { canOpenOrder, canShowExplanation, completedOrderIds, isEnsembleUnlocked, isIndependentReflection, isIndependentRepair, reflectionOptions } from '../../src/domain/session/selectors';
import type { CompletionReceipt, SessionEvent, SessionState } from '../../src/domain/session/types';

const rawOrders = loadOrders();
const order = rawOrders[4];
const start = (index = 4, id = 'attempt-1', seed = 17) => reduceSession(createSession(rawOrders[index], id, seed), {type:'START_ORDER'}, rawOrders[index]).state;
const send = (state:SessionState, event:SessionEvent, current = order) => reduceSession(state, event, current);
const change = (state:SessionState, slot:number, midi:number, current = order) => send(send(state, {type:'SELECT_SLOT',slot},current).state,{type:'SELECT_PITCH',midi},current).state;
const check = (state:SessionState, current = order) => {
  const transition=send(state,{type:'CHECK'},current);
  const command=transition.commands.find(command=>command.type==='GRADE');
  if (!command || command.type!=='GRADE') throw new Error('Expected a grade request');
  return {checking:transition.state,event:executeGradeCommand(command,current)};
};
const grade = (state:SessionState,current = order) => { const request=check(state,current); return send(request.checking,request.event,current).state; };
const solve = (index = 4,id = 'attempt-1',seed = 17) => {const current=rawOrders[index];let state=start(index,id,seed);for (const slot of current.editableSlots) state=change(state,slot,current.targetMidi[slot],current);return grade(state,current);};

describe('session editing and grade isolation',()=>{
  it('starts at the specified 0.35 master volume while preserving an adjusted volume on reload',()=>{
    const state=createSession(order,'volume-attempt',17);
    expect(state.settings.volume).toBe(0.35);
    const adjusted=send(state,{type:'SET_SETTINGS',patch:{volume:0.72}}).state;
    const restored=restoreSession(serializeSession(adjusted),order);
    if(!restored.ok)throw new Error(restored.error);
    expect(restored.state.settings.volume).toBe(0.72);
  });
  it('starts only after the introduction and respects locked slots and input limits',()=>{
    const current=rawOrders[0]; const intro=createSession(current,'a',1);
    expect(send(intro,{type:'SELECT_PITCH',midi:64},current).state).toBe(intro);
    const state=start(0);
    expect(send(state,{type:'SELECT_SLOT',slot:0},current).state).toBe(state);
    expect(send(state,{type:'SELECT_PITCH',midi:64},current).state).toBe(state);
    const selected=send(state,{type:'SELECT_SLOT',slot:1},current).state;
    for(const midi of [59,75,63.5,NaN,Infinity]) expect(send(selected,{type:'SELECT_PITCH',midi},current).state).toBe(selected);
  });
  it('repeated input and selecting the same pitch do not revise, undo, or cancel',()=>{
    const selected=send(start(),{type:'SELECT_SLOT',slot:1}).state;
    for(const event of [{type:'SELECT_PITCH',midi:selected.notes[1]},{type:'SELECT_PITCH',midi:69,repeat:true}] as SessionEvent[]) expect(send(selected,event)).toEqual({state:selected,commands:[]});
    const edited=send(selected,{type:'SELECT_PITCH',midi:69});
    expect(edited.state.revision).toBe(1); expect(edited.state.undo).toHaveLength(1); expect(edited.commands.map(c=>c.type)).toContain('CANCEL_AUDIO');
  });
  it.each(['orderId','attemptId','revision','submissionId'] as const)('rejects a stale %s independently',field=>{
    const {checking,event}=check(start());
    const stale={...event,request:{...event.request,[field]:field==='revision'?99:'stale'}};
    expect(send(checking,stale).state).toBe(checking);
  });
  it('rejects another order at the same revision and old results after editing',()=>{
    const a=check(start()); const other=check(start(5),rawOrders[5]);
    expect(send(other.checking,a.event,rawOrders[5]).state).toBe(other.checking);
    const changed=change(a.checking,1,69);
    expect(send(changed,a.event).state).toBe(changed);
  });
  it('reuses pending submissions and consumes every result once',()=>{
    const request=check(start()); const repeated=send(request.checking,{type:'CHECK'});
    expect(repeated).toEqual({state:request.checking,commands:[]});
    const result=send(request.checking,request.event);
    expect(send(result.state,request.event)).toEqual({state:result.state,commands:[]});
  });
  it('keeps the first wrong submission after later success',()=>{
    let state=grade(start());expect(state.evidence.firstSubmission?.status).toBe('incorrect');
    state=grade(change(state,1,order.targetMidi[1]));
    expect(state.learning).toBe('reflection');expect(state.evidence.finalSuccess).toBe(true);
    expect(state.evidence.firstSubmission?.status).toBe('incorrect');expect(isIndependentRepair(state,order)).toBe(false);
  });
  it('does not count invalid or incomplete results as a learner failure',()=>{
    for(const status of ['invalid','incomplete'] as const){const request=check(start());
      const state=send(request.checking,{...request.event,grade:{...request.event.grade,status}}).state;
      expect(state.evidence.firstSubmission).toBeNull();expect(state.evidence.finalSuccess).toBe(false);
    }
  });
  it('bounds undo at 50 edit snapshots without rolling back evidence',()=>{
    let state=send(start(),{type:'HINT',area:'repair',level:2}).state;
    state=grade(state);
    for(let index=0;index<51;index++) state=change(state,1,index%2?68:69);
    expect(state.undo).toHaveLength(50);
    state=send(state,{type:'UNDO'}).state;state=send(state,{type:'RESET'}).state;
    expect(state.notes).toEqual(order.initialMidi);expect(state.evidence.maxRepairHintLevel).toBe(2);
    expect(state.evidence.firstSubmission?.status).toBe('incorrect');
  });
});

describe('session learning evidence',()=>{
  it('invalidates a pending grade when a demonstration already matches current notes',()=>{
    const request=check(change(start(),1,order.targetMidi[1]));
    const demo=send(request.checking,{type:'DEMO'});
    expect(demo.state.learning).toBe('editing');expect(demo.state.pendingGrade).toBeNull();
    expect(demo.commands.map(command=>command.type)).toContain('CANCEL_AUDIO');
    expect(send(demo.state,request.event).state).toBe(demo.state);
    expect(send(demo.state,{type:'CHECK'}).commands).toEqual([]);
  });
  it('demonstrates with a separate return snapshot and retains assistance',()=>{
    const before=change(start(),0,66);let state=send(before,{type:'DEMO'}).state;
    expect(state.notes).toEqual(order.targetMidi);expect(state.demoSnapshot?.notes).toEqual(before.notes);
    state=send(state,{type:'RETURN_FROM_DEMO'}).state;
    expect(state.notes).toEqual(before.notes);expect(state.selectedSlot).toBe(before.selectedSlot);
    expect(state.evidence.maxRepairHintLevel).toBe(3);expect(state.evidence.answerRevealedBeforeFirstAnswer).toBe(true);
    state=send(state,{type:'DEMO'}).state;state=send(state,{type:'KEEP_DEMO'}).state;state=grade(state);
    expect(state.evidence.finalSuccess).toBe(true);expect(isIndependentRepair(state,order)).toBe(false);
  });
  it('shows only a short confirmation before the first reflection response',()=>{
    let state=solve();expect(state.reflection.phase).toBe('question');expect(canShowExplanation(state)).toBe(false);
    state=send(state,{type:'ANSWER',questionId:`${order.id}:reflection`,optionId:`${order.id}:option:1`}).state;
    expect(canShowExplanation(state)).toBe(true);expect(state.evidence.firstReflectionAnswer?.correct).toBe(false);
    state=send(state,{type:'ANSWER',questionId:`${order.id}:reflection`,optionId:`${order.id}:option:0`}).state;
    expect(state.evidence.firstReflectionAnswer?.correct).toBe(false);expect(state.evidence.latestReflectionAnswer?.correct).toBe(true);
    expect(isIndependentReflection(state,order)).toBe(false);
  });
  it('preserves reveal before first answer across serialization and rejects stale question IDs',()=>{
    let state=send(solve(),{type:'SHOW_EXPLANATION'}).state;
    const restored=restoreSession(serializeSession(state),order);if(!restored.ok) throw new Error(restored.error);state=restored.state;
    expect(send(state,{type:'ANSWER',questionId:'CR01:reflection',optionId:`${order.id}:option:0`}).state).toBe(state);
    state=send(state,{type:'ANSWER',questionId:`${order.id}:reflection`,optionId:`${order.id}:option:0`}).state;
    expect(state.evidence.answerRevealedBeforeFirstAnswer).toBe(true);expect(isIndependentReflection(state,order)).toBe(false);
  });
  it('records repair and reflection help separately and retains maximum levels',()=>{
    let state=send(start(),{type:'HINT',area:'repair',level:2,revealsReflectionAnswer:true}).state;
    state=send(state,{type:'HINT',area:'repair',level:1}).state;
    state=grade(change(state,1,order.targetMidi[1]));state=send(state,{type:'HINT',area:'reflection',level:1}).state;
    expect(state.evidence.maxRepairHintLevel).toBe(2);expect(state.evidence.maxReflectionHintLevel).toBe(1);
    expect(state.evidence.answerRevealedBeforeFirstAnswer).toBe(true);
  });
  it('does not allow guided orders to claim independent achievement',()=>{
    const current=rawOrders[0];let state=solve(0);
    state=send(state,{type:'ANSWER',questionId:'CR01:reflection',optionId:'CR01:option:0'},current).state;
    expect(isIndependentRepair(state,current)).toBe(false);expect(isIndependentReflection(state,current)).toBe(false);
  });
  it('makes settings independent of grading and hint evidence',()=>{
    let state=start();state=send(state,{type:'SET_SETTINGS',patch:{mute:true,inputMode:'pads',reducedMotion:true}}).state;
    state=grade(change(state,1,order.targetMidi[1]));
    state=send(state,{type:'ANSWER',questionId:`${order.id}:reflection`,optionId:`${order.id}:option:0`}).state;
    expect(isIndependentRepair(state,order)).toBe(true);expect(isIndependentReflection(state,order)).toBe(true);
    expect(state.evidence.maxRepairHintLevel).toBe(0);expect(state.evidence.maxReflectionHintLevel).toBe(0);
  });
  it('keeps correct option IDs and stored order stable over 100 seeds',()=>{
    const current=rawOrders[3];const permutations=new Set<string>();
    for(let seed=0;seed<100;seed++){
      let state=solve(3,`attempt-${seed}`,seed);const options=reflectionOptions(state,current);
      expect(options.find(option=>option.id==='CR04:option:1')?.text).toBe(current.reflection.options[1]);
      permutations.add(state.reflection.optionIds.join(','));
      const restored=restoreSession(serializeSession(state),current);if(!restored.ok)throw new Error(restored.error);
      expect(restored.state.reflection.optionIds).toEqual(state.reflection.optionIds);
      state=send(restored.state,{type:'ANSWER',questionId:'CR04:reflection',optionId:'CR04:option:1'},current).state;
      expect(state.evidence.firstReflectionAnswer?.correct).toBe(true);
    }
    expect(permutations.size).toBe(6);
  });
});

describe('completion, recovery, and separate state axes',()=>{
  it('changes order only after completion and clears the edit history for a fresh attempt',()=>{
    const next=rawOrders[5];const event:SessionEvent={type:'NEXT',order:next,attemptId:'next-attempt',seed:22};
    expect(send(start(),event).state.orderId).toBe(order.id);
    let state=send(solve(),{type:'SKIP'}).state;state=send(state,{type:'CONTINUE'}).state;
    const transitioned=send(state,event).state;
    expect(transitioned.orderId).toBe(next.id);expect(transitioned.attemptId).toBe('next-attempt');
    expect(transitioned.learning).toBe('orderIntro');expect(transitioned.undo).toEqual([]);
    expect(transitioned.notes).toEqual(next.initialMidi);expect(transitioned.evidence.firstSubmission).toBeNull();
  });
  it('freezes learning while the application is awaiting content or recovery',()=>{
    const state=send(start(),{type:'CONTENT_ERROR'}).state;
    expect(send(state,{type:'CHECK'})).toEqual({state,commands:[]});
    expect(send(state,{type:'LOAD_OK'}).state.app).toBe('ready');
  });
  it('exposes a storage guard against same-attempt evidence regression',()=>{
    const state=solve();const evidence=state.evidence;
    expect(evidenceDoesNotRegress(evidence,{...evidence,firstSubmission:null})).toBe(false);
    expect(evidenceDoesNotRegress({...evidence,maxRepairHintLevel:2},{...evidence,maxRepairHintLevel:1})).toBe(false);
    expect(evidenceDoesNotRegress({...evidence,evidenceStatus:'unknown'},evidence)).toBe(false);
    expect(evidenceDoesNotRegress(evidence,{...evidence,maxReflectionHintLevel:1})).toBe(true);
  });
  it('completes a skipped question once without gating rewards on understanding',()=>{
    let state=send(solve(),{type:'SKIP'}).state;expect(state.evidence.reflectionSkipped).toBe(true);
    const completed=send(state,{type:'CONTINUE'});state=completed.state;
    expect(state.learning).toBe('completed');expect(completed.commands.filter(c=>c.type==='COMPLETE')).toHaveLength(1);
    expect(send(state,{type:'CONTINUE'})).toEqual({state,commands:[]});
  });
  it('requires all eight unique completed orders and opens the first course sequentially',()=>{
    const receipts:CompletionReceipt[]=rawOrders.map((item,index)=>({orderId:item.id,contentVersion:item.contentVersion,completionId:`done-${index}`}));
    expect(isEnsembleUnlocked([receipts[7]])).toBe(false);
    expect(isEnsembleUnlocked([...receipts.slice(0,7),receipts[0]])).toBe(false);
    expect(isEnsembleUnlocked(receipts)).toBe(true);expect(completedOrderIds([...receipts,receipts[0]])).toHaveLength(8);
    expect(canOpenOrder('CR02',[])).toBe(false);expect(canOpenOrder('CR02',[receipts[0]])).toBe(true);
    expect(canOpenOrder('CR01',[receipts[0]])).toBe(false);
    expect(canOpenOrder('CR08',receipts)).toBe(true);
  });
  it('preserves learning while hidden, returning, and after audio/storage failures',()=>{
    let state=solve();const hidden=send(state,{type:'HIDDEN'});
    expect(hidden.state.notes).toEqual(state.notes);expect(hidden.state.attemptId).toBe(state.attemptId);
    expect(hidden.commands.map(c=>c.type)).toEqual(['CANCEL_AUDIO','SAVE']);state=hidden.state;
    expect(send(state,{type:'RETURN'}).commands).toEqual([]);
    state=send(state,{type:'SET_AUDIO',status:'unavailable'}).state;state=send(state,{type:'SET_STORAGE',status:'memoryOnly'}).state;
    expect(state.learning).toBe('reflection');expect(state.evidence.finalSuccess).toBe(true);
  });
  it('restores the same attempt but creates a distinct explicit practice attempt',()=>{
    let state=send(solve(),{type:'SKIP'}).state;state=send(state,{type:'CONTINUE'}).state;
    const restored=restoreSession(serializeSession(state),order);if(!restored.ok)throw new Error(restored.error);
    expect(restored.state.attemptId).toBe(state.attemptId);
    const practice=send(state,{type:'NEW_PRACTICE',attemptId:'practice-2',seed:4}).state;
    expect(practice.attemptId).toBe('practice-2');expect(practice.evidence.firstSubmission).toBeNull();expect(practice.undo).toEqual([]);
    expect(state.evidence.finalSuccess).toBe(true);
  });
  it('restores pending checking safely without scheduling sound or recycling the request',()=>{
    const request=check(start());const restored=restoreSession(serializeSession(request.checking),order);if(!restored.ok)throw new Error(restored.error);
    expect(restored.state.learning).toBe('editing');expect(restored.state.pendingGrade).toBeNull();
    expect(check(restored.state).event.request.submissionId).not.toBe(request.event.request.submissionId);
  });
  it('marks incomplete legacy evidence unknown without inventing independent success',()=>{
    const snapshot=JSON.parse(serializeSession(solve())) as Record<string,unknown>;delete snapshot.evidence;
    const restored=restoreSession(snapshot,order);if(!restored.ok)throw new Error(restored.error);
    expect(restored.state.evidence.evidenceStatus).toBe('unknown');expect(isIndependentRepair(restored.state,order)).toBe(false);
  });
  it('detaches restored evidence and rejects a successful first submission in an unrepaired phase',()=>{
    let solved=solve();solved=send(solved,{type:'ANSWER',questionId:`${order.id}:reflection`,optionId:`${order.id}:option:0`}).state;
    const snapshot=JSON.parse(serializeSession(solved)) as {evidence:{firstSubmission:{status:string};firstReflectionAnswer:{correct:boolean}}};
    const restored=restoreSession(snapshot,order);if(!restored.ok)throw new Error(restored.error);
    snapshot.evidence.firstSubmission.status='incorrect';snapshot.evidence.firstReflectionAnswer.correct=false;
    expect(restored.state.evidence.firstSubmission?.status).toBe('correct');expect(restored.state.evidence.firstReflectionAnswer?.correct).toBe(true);
    const forged=JSON.parse(serializeSession(start())) as {evidence:{firstSubmission:unknown}};
    forged.evidence.firstSubmission={status:'correct',revision:0,submissionId:'attempt-1:1'};
    expect(restoreSession(forged,order).ok).toBe(false);
  });
  it('rejects malformed, unexpected, oversized, future, and mismatched snapshots',()=>{
    const base=JSON.parse(serializeSession(start())) as Record<string,unknown>;
    for(const snapshot of [{...base,schemaVersion:2},{...base,orderId:'CR01'},{...base,notes:[65,NaN,72]},{...base,revision:-1},{...base,extra:true},{...base,undo:Array(51).fill({notes:[65,68,72],selectedSlot:0})}]) expect(restoreSession(snapshot,order).ok).toBe(false);
    expect(restoreSession('{broken',order).ok).toBe(false);expect(restoreSession(' '.repeat(262145),order).ok).toBe(false);
  });
});
