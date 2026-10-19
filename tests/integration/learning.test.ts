import {describe,it,expect} from 'vitest';
import {loadOrders} from '../../src/content/loader';
import {hintCopy} from '../../src/content/copy.ko';
import {createSession,reduceSession} from '../../src/domain/session/reducer';
import {executeGradeCommand} from '../../src/domain/session/commands';
import {serializeSession,restoreSession} from '../../src/domain/session/serialization';
import {isEnsembleUnlocked,reflectionOptions} from '../../src/domain/session/selectors';
import type {CompletionReceipt,SessionEvent} from '../../src/domain/session/types';
const orders=loadOrders();
describe('S07 learning journeys',()=>{
  it.each(orders)('$id preserves mistakes, undo, hints, demo and question outcomes',order=>{
    let state=createSession(order,`learning-${order.id}`,99);
    const send=(event:SessionEvent)=>{const result=reduceSession(state,event,order);state=result.state;for(const command of result.commands)if(command.type==='GRADE')state=reduceSession(state,executeGradeCommand(command,order),order).state;};
    send({type:'START_ORDER'});send({type:'CHECK'});expect(state.evidence.firstSubmission?.status).toBe('incorrect');send({type:'EDIT'});
    const slot=order.editableSlots.at(-1)!;send({type:'SELECT_SLOT',slot});send({type:'SELECT_PITCH',midi:order.initialMidi[slot]===74?73:74});send({type:'UNDO'});expect(state.notes).toEqual(order.initialMidi);
    for(const level of [1,2] as const){const copy=hintCopy(order,level);send({type:'HINT',area:'repair',level,revealsReflectionAnswer:copy.revealsReflectionAnswer});}
    send({type:'DEMO'});expect(state.notes).toEqual(order.targetMidi);send({type:'RETURN_FROM_DEMO'});expect(state.notes).toEqual(order.initialMidi);expect(state.evidence.maxRepairHintLevel).toBe(3);
    for(const index of order.editableSlots){send({type:'SELECT_SLOT',slot:index});send({type:'SELECT_PITCH',midi:order.targetMidi[index]});}send({type:'CHECK'});expect(state.learning).toBe('reflection');expect(state.reflection.phase).toBe('question');
    const wrong=`${order.id}:option:${(order.reflection.answerIndex+1)%order.reflection.options.length}`;send({type:'ANSWER',questionId:`${order.id}:reflection`,optionId:wrong});send({type:'ANSWER',questionId:`${order.id}:reflection`,optionId:`${order.id}:option:${order.reflection.answerIndex}`});
    expect(state.evidence.firstReflectionAnswer?.correct).toBe(false);expect(state.evidence.latestReflectionAnswer?.correct).toBe(true);send({type:'CONTINUE'});expect(state.learning).toBe('completed');
    const restored=restoreSession(serializeSession(state),order);expect(restored.ok).toBe(true);if(restored.ok)expect(restored.state.evidence).toEqual(state.evidence);
  });
  it('keeps all option IDs and their visible order across 100 seeds and every order',()=>{for(const order of orders)for(let seed=0;seed<100;seed++){
    const state=createSession(order,`seed-${seed}`,seed),restored=restoreSession(serializeSession(state),order);expect(restored.ok).toBe(true);if(!restored.ok)throw Error(restored.error);
    expect(reflectionOptions(restored.state,order)).toEqual(reflectionOptions(state,order));expect(new Set(state.reflection.optionIds).size).toBe(order.reflection.options.length);
  }});
  it('unlocks ensemble after eight assisted completions including skip/reveal',()=>{
    const receipts:CompletionReceipt[]=[];for(const [index,order] of orders.entries()){
      let state=reduceSession(createSession(order,`assisted-${index}`,index),{type:'START_ORDER'},order).state;
      for(const type of ['DEMO','KEEP_DEMO','CHECK'] as const){const result=reduceSession(state,{type},order);state=result.state;for(const command of result.commands)if(command.type==='GRADE')state=reduceSession(state,executeGradeCommand(command,order),order).state;}
      state=reduceSession(state,{type:index%2?'SKIP':'SHOW_EXPLANATION'},order).state;const complete=reduceSession(state,{type:'CONTINUE'},order);for(const command of complete.commands)if(command.type==='COMPLETE')receipts.push(command.receipt);
      expect(isEnsembleUnlocked(receipts)).toBe(index===7);
    }
  });
});
