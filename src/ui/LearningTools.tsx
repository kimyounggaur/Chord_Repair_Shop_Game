import {useState} from 'react';
import type {Order} from '../content/types';
import {hintCopy,tutorialSteps} from '../content/copy.ko';
import type {SessionEvent,SessionState} from '../domain/session/types';
import {isIndependentReflection,isIndependentRepair} from '../domain/session/selectors';
import {musicalText,noteName} from './components';

export function DistanceDiagram({from,to,order}:{from:number;to:number;order:Order}){
  const count=Math.abs(to-from),direction=to>=from?1:-1;
  return <div className="distance-diagram" role="img" aria-label={`${noteName(from,order)}에서 ${noteName(to,order)}, 음점 ${count+1}개 사이의 간격 ${count}개, ${count}반음`}><div className="distance-points">{Array.from({length:count+1},(_,index)=><span className="distance-point" key={index}><i/>{index===0||index===count?<b>{noteName(from+index*direction,order)}</b>:<span aria-hidden="true">·</span>}</span>)}</div><span className="small">음점 {count+1}개 사이, 간격 {count}개 = {count}반음</span></div>;
}
export function LearningTools({order,session,dispatch}:{order:Order;session:SessionState;dispatch:(event:SessionEvent)=>void}){
  const [level,setLevel]=useState<0|1|2>(0),[tutorial,setTutorial]=useState<number|null>(null);
  const [from,setFrom]=useState(order.initialMidi[0]),[to,setTo]=useState(order.initialMidi[1]);
  const reflection=session.learning==='reflection';
  const hint=(next:1|2)=>{const copy=hintCopy(order,next);dispatch({type:'HINT',area:reflection?'reflection':'repair',level:next,revealsReflectionAnswer:copy.revealsReflectionAnswer});setLevel(next);};
  const tutorialTo=(step:number)=>{setTutorial(step);if(step===4)dispatch({type:'EXPOSE_REFLECTION_ANSWER'});};
  return <section className="learning-tools" aria-label="선택해서 보는 도움">
    <div className="tool-row"><button onClick={()=>hint(1)}>도움 1 · 관계</button><button onClick={()=>hint(2)}>도움 2 · 거리</button>{!reflection&&<button onClick={()=>{dispatch({type:'DEMO'});setLevel(0);}}>도움 3 · 시범</button>}{order.id==='CR01'&&<button onClick={()=>tutorialTo(0)}>처음 안내 다시 보기</button>}</div>
    {tutorial!==null&&<div className="notice tutorial" data-testid="tutorial"><strong>처음 안내 T{tutorial} / T7</strong><p>{tutorialSteps[tutorial]}</p><div className="tool-row"><button disabled={tutorial===0} onClick={()=>tutorialTo(tutorial-1)}>이전 안내</button>{tutorial<7?<button onClick={()=>tutorialTo(tutorial+1)}>다음 안내</button>:<button onClick={()=>setTutorial(null)}>안내 마치기</button>}<button onClick={()=>setTutorial(null)}>안내 건너뛰기</button></div></div>}
    {level!==0&&<div className="notice" data-testid="hint-panel">
      <p>{musicalText(hintCopy(order,level).text)}</p>
      {level===2&&<><DistanceDiagram from={order.targetMidi[0]} to={order.targetMidi[1]} order={order}/>
        <p>두 음을 골라 간격을 세어 보세요. 현재 수리 음은 바뀌지 않아요.</p>
        <div className="tool-row">{(['from','to'] as const).map(kind=><label key={kind}>{kind==='from'?'출발 음':'도착 음'}<select aria-label={kind==='from'?'출발 음':'도착 음'} value={kind==='from'?from:to} onChange={event=>(kind==='from'?setFrom:setTo)(Number(event.target.value))}>{Array.from({length:15},(_,i)=>60+i).map(midi=><option key={midi} value={midi}>{noteName(midi,order)}</option>)}</select></label>)}</div>
        <DistanceDiagram from={from} to={to} order={order}/></>}
      <button onClick={()=>setLevel(0)}>도움 접기</button></div>}
    {session.demoSnapshot&&<div className="notice" role="status"><strong>시범을 보고 있어요</strong><p>시범 전 내 음과 기록을 보관했어요. 시범도 같은 수리 보상을 받아요.</p><div className="tool-row"><button onClick={()=>dispatch({type:'RETURN_FROM_DEMO'})}>내 상태로 돌아가기</button><button onClick={()=>dispatch({type:'KEEP_DEMO'})}>시범 상태로 연습</button></div></div>}
  </section>;
}
export function EvidenceSummary({session,order}:{session:SessionState;order:Order}){
  const evidence=session.evidence;
  return <section className="evidence-summary" aria-label="이번 연습 기록"><h2>이번 연습 기록</h2><dl><dt>수리</dt><dd>{evidence.finalSuccess?'완료':'연습 중'}</dd><dt>첫 수리 확인</dt><dd>{evidence.evidenceStatus==='unknown'?'기록 없음':evidence.firstSubmission?.status==='correct'?'주문에 맞음':evidence.firstSubmission?'다시 살펴봄':'아직 확인 전'}</dd><dt>사용한 도움</dt><dd>수리 {evidence.maxRepairHintLevel}단계 · 관계 질문 {evidence.maxReflectionHintLevel}단계</dd><dt>첫 관계 응답</dt><dd>{evidence.firstReflectionAnswer?(evidence.firstReflectionAnswer.correct?'맞게 확인':'다시 살펴봄'):evidence.reflectionSkipped?'건너뜀':'응답 전'}</dd><dt>응답 전 답 공개</dt><dd>{evidence.answerRevealedBeforeFirstAnswer?'있음':'없음'}</dd><dt>도움 없이 확인</dt><dd>수리 {isIndependentRepair(session,order)?'확인':'연습'} · 관계 {isIndependentReflection(session,order)?'확인':'연습'}</dd></dl><p className="small muted">이번 주문의 기록이에요. 음악 실력이나 악기 연주 능력 점수가 아니에요. 소리 끄기와 입력 도구 선택은 도움으로 세지 않아요.</p></section>;
}
