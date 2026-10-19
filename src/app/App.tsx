import {useCallback,useEffect,useRef,useState} from 'react';
import {loadOrders,type Order} from '../content/loader';
import {createSession,reduceSession} from '../domain/session/reducer';
import {executeGradeCommand} from '../domain/session/commands';
import {canOpenOrder,canShowExplanation,completedOrderIds,isEnsembleUnlocked,reflectionOptions} from '../domain/session/selectors';
import type {CompletionReceipt,SessionEvent,SessionSettings,SessionState} from '../domain/session/types';
import {pitchClass} from '../domain/music';
import {InstrumentScene,Modal,ShopMark,Transport,musicalText,noteName,targetName} from '../ui/components';
import {Collection,Sandbox} from '../ui/Collection';
import {NoteInput} from '../ui/NoteInput';
import {DistanceDiagram,EvidenceSummary,LearningTools} from '../ui/LearningTools';
import {silentServices,type AudioSnapshot,type WorkbenchServices} from '../ui/services';
import './styles.css';

export type AppProps={initialOrder?:Order;initialSettings?:SessionSettings;initialSession?:SessionState;initialReceipts?:readonly CompletionReceipt[];services?:WorkbenchServices;audioStatus?:SessionState['audio'];audioMessage?:string;onDispatchReady?:(dispatch:(event:SessionEvent)=>void)=>void;onSessionChange?:(state:SessionState)=>void;onComplete?:(receipt:CompletionReceipt,state:SessionState)=>void};
const newAttempt=()=>globalThis.crypto?.randomUUID()??`attempt-${Date.now()}`;
const seed=()=>globalThis.crypto?.getRandomValues(new Uint32Array(1))[0]??0;

export function App(props:AppProps){
  const [content]=useState(()=>{try{return {orders:loadOrders(),error:false};}catch{return {orders:[] as readonly Order[],error:true};}});
  if(content.error||!content.orders[0])return <main className="app-shell"><h1>주문을 불러오지 못했어요</h1><p>주문 정보에 문제가 있어요. 다시 시도해 주세요.</p><button onClick={()=>location.reload()}>다시 시도</button></main>;
  return <GameApp {...props} orders={content.orders} initialOrder={props.initialOrder??content.orders.find(order=>order.id===props.initialSession?.orderId)??content.orders[0]}/>;
}

function GameApp({orders,initialOrder,initialSession,initialReceipts=[],initialSettings,services=silentServices,audioStatus,audioMessage,onDispatchReady,onSessionChange,onComplete}:AppProps&{orders:readonly Order[];initialOrder:Order}){
  const [session,setSession]=useState(()=>initialSession??{...createSession(initialOrder,newAttempt(),seed()),screen:'home' as const,...(initialSettings?{settings:initialSettings}:{})});
  const order=orders.find(item=>item.id===session.orderId)??initialOrder;
  const [receipts,setReceipts]=useState(initialReceipts);
  const stateRef=useRef(session);
  const [specialScreen,setSpecialScreen]=useState<'ensemble'|'sandbox'|null>(null);
  const screen=specialScreen??session.screen;
  const [editorOpen,setEditorOpen]=useState(false);
  const [modal,setModal]=useState<'reset'|'help'|null>(null);
  const [announcement,setAnnouncement]=useState('');
  const [audioNotice,setAudioNotice]=useState('');
  const [returnNotice,setReturnNotice]=useState(false);
  const [enabling,setEnabling]=useState(false);
  const mounted=useRef(true);
  const enableGeneration=useRef(0);
  const pendingEnable=useRef(false);
  const previousAudioStatus=useRef(audioStatus);
  const invalidateEnable=useCallback(()=>{enableGeneration.current++;pendingEnable.current=false;if(mounted.current)setEnabling(false);},[]);
  const previousFocusScreen=useRef(`${screen}:${session.learning}`);
  const dispatch=useCallback((event:SessionEvent)=>{
    const process=(nextEvent:SessionEvent)=>{
      const previous=stateRef.current;
      const activeOrder=orders.find(item=>item.id===previous.orderId)??initialOrder;
      const transition=reduceSession(previous,nextEvent,activeOrder);
      stateRef.current=transition.state;setSession(transition.state);
      if(transition.state!==previous)onSessionChange?.(transition.state);
      if(transition.state.revision!==previous.revision&&nextEvent.type==='SELECT_PITCH')setAnnouncement(`현재 음을 ${noteName(nextEvent.midi,activeOrder)}로 바꿨어요.`);
      for(const command of transition.commands){
        if(command.type==='GRADE')process(executeGradeCommand(command,activeOrder));
        else if(command.type==='CANCEL_AUDIO'){invalidateEnable();services.stopAll();}
        else if(command.type==='FOCUS'&&nextEvent.type!=='SELECT_SLOT')requestAnimationFrame(()=>document.getElementById(command.target)?.focus({preventScroll:true}));
        else if(command.type==='COMPLETE'){setReceipts(current=>current.some(receipt=>receipt.completionId===command.receipt.completionId)?current:[...current,command.receipt]);onComplete?.(command.receipt,transition.state);}
        services.onCommand?.(command,transition.state,orders.find(item=>item.id===transition.state.orderId)??activeOrder);
      }
    };
    process(event);
  },[orders,initialOrder,services,onSessionChange,onComplete,invalidateEnable]);
  useEffect(()=>{onDispatchReady?.(dispatch);},[dispatch,onDispatchReady]);
  useEffect(()=>{mounted.current=true;const hidden=()=>{invalidateEnable();dispatch({type:'HIDDEN'});};const visibility=()=>{if(document.hidden)hidden();else{dispatch({type:'RETURN'});setReturnNotice(true);}};const returned=()=>{dispatch({type:'RETURN'});};document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',hidden);window.addEventListener('pageshow',returned);return()=>{mounted.current=false;invalidateEnable();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',hidden);window.removeEventListener('pageshow',returned);services.stopAll();};},[dispatch,services,invalidateEnable]);
  useEffect(()=>{const previous=previousAudioStatus.current;previousAudioStatus.current=audioStatus;if(audioStatus===undefined)return;if(audioStatus==='paused'&&previous!==undefined&&['ready','playing','preparing'].includes(previous))dispatch({type:'HIDDEN'});dispatch({type:'SET_AUDIO',status:audioStatus});},[audioStatus,dispatch]);
  useEffect(()=>{const previous=previousFocusScreen.current;previousFocusScreen.current=`${screen}:${session.learning}`;if(screen==='home')return;if(screen==='workbench'&&['editing','feedback','checking'].some(phase=>previous===`workbench:${phase}`)&&['editing','feedback','checking'].includes(session.learning))return;requestAnimationFrame(()=>document.querySelector<HTMLElement>('main h1')?.focus({preventScroll:true}));},[screen,session.learning]);
  const enable=async(start=false)=>{if(pendingEnable.current)return;const generation=++enableGeneration.current;pendingEnable.current=true;setEnabling(true);setAudioNotice('');dispatch({type:'SET_AUDIO',status:'preparing'});let ready=false;try{ready=await services.enable();}catch{ready=false;}if(!mounted.current||generation!==enableGeneration.current||document.hidden)return;pendingEnable.current=false;dispatch({type:'SET_AUDIO',status:ready?'ready':'unavailable'});dispatch({type:'SET_SETTINGS',patch:{mute:!ready}});if(!ready)setAudioNotice('소리를 준비하지 못했어요. 소리 없이도 계속할 수 있어요.');setEnabling(false);if(start)dispatch({type:'SET_SCREEN',screen:'workbench'});};
  const stop=()=>{invalidateEnable();services.stopAll();};
  const beginSilent=()=>{stop();dispatch({type:'SET_SETTINGS',patch:{mute:true}});dispatch({type:'SET_AUDIO',status:'unavailable'});dispatch({type:'SET_SCREEN',screen:'workbench'});};
  const navigate=(next:'home'|'orders'|'workbench'|'ensemble'|'sandbox')=>{stop();setEditorOpen(false);if(next==='ensemble'||next==='sandbox'){setSpecialScreen(next);return;}setSpecialScreen(null);dispatch({type:'SET_SCREEN',screen:next});};
  const closeSpecial=()=>{stop();setSpecialScreen(null);};
  const toggleMute=()=>{if(session.settings.mute)void enable();else{stop();dispatch({type:'SET_SETTINGS',patch:{mute:true}});}};
  const changeVolume=(volume:number)=>dispatch({type:'SET_SETTINGS',patch:{volume}});
  const silent=session.settings.mute||session.audio==='unavailable'||session.audio==='locked';
  const snapshot:AudioSnapshot={orderId:session.orderId,attemptId:session.attemptId,revision:session.revision,original:[...order.initialMidi],current:[...session.notes]};
  const stage=session.learning;
  const editing=['editing','feedback','checking'].includes(stage);
  const changed=session.notes.some((midi,index)=>midi!==order.initialMidi[index]);
  const orderNumber=orders.findIndex(item=>item.id===order.id)+1;
  const openSlot=(index:number)=>{if(!order.editableSlots.includes(index)){setAnnouncement('이 음은 이번 주문에서 그대로 두어요.');return;}dispatch({type:'SELECT_SLOT',slot:index});setEditorOpen(true);};
  const closeEditor=()=>{setEditorOpen(false);stop();requestAnimationFrame(()=>document.getElementById(`slot-${stateRef.current.selectedSlot}`)?.focus());};
  const openOrder=(item:Order)=>{
    if(item.id===session.orderId){navigate('workbench');return;}
    if(!canOpenOrder(item.id,receipts))return;
    stop();setEditorOpen(false);
    const next={...createSession(item,newAttempt(),seed()),settings:stateRef.current.settings,audio:stateRef.current.audio};
    stateRef.current=next;setSession(next);onSessionChange?.(next);
    services.onCommand?.({type:'SAVE',immediate:true,reason:'evidence'},next,item);
  };
  const currentRole=(midi:number)=>{if(order.hintPolicy!=='guided')return '음 조각';const role=order.targetMidi.findIndex(note=>pitchClass(note)===pitchClass(midi));return role===0?'근음':role===1?'3음':role===2?'5음':'살펴볼 음';};
  return <div className="app-shell" data-reduced-motion={session.settings.reducedMotion?'true':'false'}>
    <a className="skip-link" href="#main-content">본문으로 바로 가기</a>
    <header className="site-header"><button className="brand" onClick={()=>navigate('home')}><ShopMark/><span>화음 수리점{' '}<small>CHORD REPAIR SHOP</small></span><span className="sr-only"> 시작 화면</span></button><span className="header-note">천천히, 한 음씩.</span>{screen!=='home'&&<button className="quiet" onClick={()=>navigate('orders')}>주문 목록</button>}<button className="quiet" onClick={()=>navigate('ensemble')}>진열과 합주</button><button className="quiet" onClick={()=>navigate('sandbox')}>자유 실험</button></header>
    <main id="main-content" tabIndex={-1}>
      {screen==='ensemble'?<Collection orders={orders} receipts={receipts} services={services} settings={session.settings} onClose={closeSpecial} onEnable={()=>void enable()} onVolume={changeVolume} onMute={toggleMute}/>:screen==='sandbox'?<Sandbox orders={orders} services={services} settings={session.settings} onClose={closeSpecial} onEnable={()=>void enable()} onVolume={changeVolume} onMute={toggleMute}/>:screen==='home'?<section className="home-hero"><div className="home-copy"><span className="eyebrow"><span className="tiny-spark" aria-hidden="true">✳</span> 작은 소리를 돌보는 곳</span><h1>화음 수리점</h1><p className="hero-subtitle">조금 다른 세 음,<br/>당신의 손에서 다시 만나도록.</p><p className="home-description">손님이 맡긴 악기의 음을 하나씩 살펴보세요.<br/>듣고, 바꾸고, 음 사이의 관계를 발견하는<br className="desktop-only"/> 여덟 번의 작은 수리입니다.</p><div className="home-actions"><button className="primary" disabled={enabling} onClick={()=>void enable(true)}>{enabling?'소리 준비 중…':'소리 켜고 시작'} <span aria-hidden="true">→</span></button><button className="secondary" onClick={beginSilent}>소리 없이 시작</button></div><p className="small muted">처음에는 기기 음량을 낮춰 주세요.<br/>소리를 듣지 않아도 모든 수리를 마칠 수 있어요.</p></div><div className="home-art"><picture className="workshop-picture"><source media="(max-width: 700px)" srcSet="/assets/chord-repair-shop/backgrounds/bg-workbench-day-mobile.webp"/><img src="/assets/chord-repair-shop/backgrounds/bg-workbench-day.webp" width="1440" height="1080" alt="" fetchPriority="high"/></picture><div className="welcome-slip"><span className="eyebrow">오늘도 문을 열었습니다</span><strong>완벽한 귀보다<br/>궁금한 마음이면 충분해요.</strong><span className="small">수리 주문 8개 · 시간 제한 없음</span></div></div></section>:screen==='orders'?<section className="orders-screen"><span className="eyebrow">수리점의 주문 장부</span><h1 tabIndex={-1}>기다리고 있는 작은 소리들</h1><p className="muted">첫 주문부터 하나씩 살펴보세요.</p><div className="order-grid">{orders.map((item,index)=><button key={item.id} className="order-card" disabled={item.id!==session.orderId&&!canOpenOrder(item.id,receipts)} onClick={()=>openOrder(item)} data-testid={`order-${item.id}`}><span className="order-number">{String(index+1).padStart(2,'0')}</span><span><strong>{item.title}</strong><small>{targetName(item)}</small></span><span className="order-tag">{completedOrderIds(receipts).includes(item.id)?'완료':canOpenOrder(item.id,receipts)?'열기 →':'앞 주문 뒤에'}</span></button>)}</div><p className="notice" data-testid="course-progress">수리 완료 {completedOrderIds(receipts).length} / 8 · {isEnsembleUnlocked(receipts)?'교대 합주가 열렸어요':'여덟 악기를 수리하면 교대 합주가 열려요'}</p></section>:<>
        <div className="workbench-nav"><button className="text-button" onClick={()=>navigate('orders')}>← 주문 목록</button><span>주문 <b>{String(orderNumber).padStart(2,'0')}</b> / 08</span><button className="text-button" onClick={()=>{if(silent)void enable();else{stop();dispatch({type:'SET_SETTINGS',patch:{mute:true}});}}}>{silent?'소리 꺼짐':'소리 켜짐'}</button></div>
        {audioMessage&&<p className="notice" data-testid="audio-state-message" role="status">{audioMessage}</p>}{audioNotice&&<p className="notice" role="status">{audioNotice}</p>}{returnNotice&&!audioMessage&&<p className="notice">작업은 그대로예요. 다시 듣기를 누르면 재생돼요.</p>}
        {stage==='orderIntro'?<section className="intro paper"><div className="eyebrow">수리 의뢰서 · {order.id}</div><h1 tabIndex={-1}>{order.title}</h1><InstrumentScene orderId={order.id}/><p className="customer-message">“이 작은 악기의 화음을 다시 맞춰 주실래요?”</p><div className="intro-target"><span className="eyebrow">이번 주문</span><h2>{targetName(order)}</h2><p>음 조각을 누르고 다른 음으로 바꿔 보세요.<br/>몇 번을 바꾸어도 괜찮아요.</p></div><div className="original-line"><span>원래 들어 있던 음</span><strong>{order.initialMidi.map(midi=>noteName(midi,order,session.settings.notation)).join(' · ')}</strong></div><button className="primary" onClick={()=>dispatch({type:'START_ORDER'})}>작업대 열기 <span aria-hidden="true">→</span></button><p className="small muted">음이름을 보며 진행해도 좋아요.</p></section>:<div className="workbench-layout">
          <aside className="order-slip paper"><div className="slip-heading"><span className="eyebrow">수리 의뢰서</span><span className="serial">{order.id}</span></div><h2>{targetName(order)}</h2><p>{order.title}</p><div className="dashed-rule"/><span className="eyebrow">원래 음</span><div className="original-notes">{order.initialMidi.map((midi,index)=><span key={index}>{noteName(midi,order,session.settings.notation)}</span>)}</div><p className="slip-footer">작은 변화에 귀를 기울여요.<br/>급하게 고칠 필요는 없어요.</p><span className="receipt-holes" aria-hidden="true">○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○</span></aside>
          <section className="work-area">
            {editing?<div data-testid="workbench" data-revision={session.revision}>
              <div className="section-heading"><div><span className="eyebrow">한 음씩 살펴보기</span><h1 id="workbench-heading" tabIndex={-1}>나의 작업대</h1></div><span className="step-tag">01 · 수리하기</span></div><InstrumentScene orderId={order.id} completed={stage==='completed'}/>
              <LearningTools key={session.attemptId} order={order} session={session} dispatch={dispatch}/>{order.id==='CR04'&&<p className="small muted">건반의 B♭ / A♯는 같은 높이예요. 이번 화음의 3음은 B♭로 읽어요.</p>}<div className="current-heading"><h2>현재 음</h2><span className="small muted">바꿀 음 조각을 선택하세요</span></div><div className="note-slots">{session.notes.map((midi,index)=>{const editable=order.editableSlots.includes(index);const selected=editorOpen&&session.selectedSlot===index;return <button key={index} id={`slot-${index}`} data-testid={`note-slot-${index}`} className={`note-slot ${selected?'selected':''} ${!editable?'locked':''}`} aria-disabled={!editable} aria-pressed={selected} aria-describedby={!editable?`lock-${index}`:undefined} onClick={()=>openSlot(index)}><span className="slot-index">음 조각 {index+1}</span><strong>{noteName(midi,order,session.settings.notation)}</strong><span className="slot-role">{currentRole(midi)}</span><span className="slot-state">{editable?(selected?'선택됨 · 바꾸기':'눌러서 바꾸기'):'잠김 · 그대로 두기'}</span>{!editable&&<span className="sr-only" id={`lock-${index}`}>이 음은 이번 주문에서 바꾸지 않아요.</span>}</button>;})}</div>
              <Transport snapshot={snapshot} services={services} silent={silent} onEnable={()=>void enable()} volume={session.settings.volume} muted={session.settings.mute} onVolumeChange={changeVolume} onToggleMute={toggleMute} onStop={stop}/>
              {session.lastGrade&&stage==='feedback'&&<div className="feedback" data-testid="repair-feedback" role="status"><strong>조금 더 살펴볼까요?</strong>{order.id==='CR01'&&session.notes[1]===62&&<p>장3화음의 3음은 근음보다 4반음 위에 있어요. C에서 하나씩 세어 볼까요?</p>}<p>{session.lastGrade.status==='invalid'?'주문을 확인하지 못했어요. 다시 시도해 주세요.':`주문은 ${targetName(order)}이에요. 현재 음을 다른 음으로 바꾸어 다시 비교해 보세요.`}</p><button className="text-button" onClick={()=>dispatch({type:'EDIT'})}>다시 살펴보기 →</button></div>}
              {editorOpen&&session.selectedSlot!==null?<section className="editor paper"><div className="editor-heading"><h2>다른 음으로 바꾸기</h2><button className="text-button" onClick={closeEditor} aria-label="음 편집 닫기">닫기 ×</button></div><div className="input-mode" aria-label="음 선택 도구"><button aria-pressed={session.settings.inputMode==='keyboard'} onClick={()=>dispatch({type:'SET_SETTINGS',patch:{inputMode:'keyboard'}})}>가상건반</button><button aria-pressed={session.settings.inputMode==='pads'} onClick={()=>dispatch({type:'SET_SETTINGS',patch:{inputMode:'pads'}})}>큰 음 버튼</button></div><NoteInput order={order} currentMidi={session.notes[session.selectedSlot]} mode={session.settings.inputMode} notation={session.settings.notation} services={services} silent={silent} onClose={closeEditor} onCommit={midi=>dispatch({type:'SELECT_PITCH',midi})}/></section>:<div className="editor-invitation"><span aria-hidden="true">↑</span> 바꿔 보고 싶은 음 조각을 눌러 주세요.</div>}
              <p className="undo-note small muted">최근 50번의 음 변경까지 되돌릴 수 있어요.</p><div className="actionbar"><button disabled={session.undo.length===0} onClick={()=>{dispatch({type:'UNDO'});setEditorOpen(false);}}>되돌리기</button><button onClick={event=>{event.currentTarget.focus();if(changed)setModal('reset');else dispatch({type:'RESET'});}}>원래대로</button><button onClick={event=>{event.currentTarget.focus();setModal('help');}}>도움</button><button className="primary check-button" disabled={stage==='checking'||session.demoSnapshot!==null} onClick={()=>{if(stage==='feedback')dispatch({type:'EDIT'});dispatch({type:'CHECK'});setEditorOpen(false);}}>수리 확인 <span aria-hidden="true">→</span></button></div>
            </div>:stage==='reflection'?<section className="reflection paper"><span className="success-label">✓ 주문 조건에 맞아요</span>{!canShowExplanation(session)?<><span className="eyebrow">02 · 관계 살펴보기</span><h1 id="reflection-question" tabIndex={-1}>{musicalText(order.reflection.prompt)}</h1><p className="muted">수리를 마치기 전에, 바뀐 관계를 생각해 보세요.</p><div className="reflection-options">{reflectionOptions(session,order).map(option=><button key={option.id} onClick={()=>dispatch({type:'ANSWER',questionId:`${order.id}:reflection`,optionId:option.id})}>{musicalText(option.text)}<span aria-hidden="true">→</span></button>)}</div><LearningTools key={`reflection-${session.attemptId}`} order={order} session={session} dispatch={dispatch}/><div className="reflection-links"><button className="text-button" onClick={()=>dispatch({type:'SKIP'})}>건너뛰기</button><button className="text-button" onClick={()=>dispatch({type:'SHOW_EXPLANATION'})}>해설 먼저 보기</button></div></>:<><h1 id="reflection-explanation" tabIndex={-1}>무엇이 달라졌을까요?</h1>{session.evidence.latestReflectionAnswer?.correct===false&&<p className="notice">수리는 맞았어요. 이유는 한 번 더 살펴볼까요?</p>}<RelationshipExplanation order={order}/><details><summary>관계 질문 다시 생각하기</summary><p>{musicalText(order.reflection.prompt)}</p><div className="reflection-options">{reflectionOptions(session,order).map(option=><button key={option.id} onClick={()=>dispatch({type:'ANSWER',questionId:`${order.id}:reflection`,optionId:option.id})}>{musicalText(option.text)}</button>)}</div></details><button className="primary" onClick={()=>dispatch({type:'CONTINUE'})}>수리 마치기 <span aria-hidden="true">→</span></button></>}</section>:stage==='completed'?<section className="completion paper"><div className="completion-stamp" aria-hidden="true"><span>✓</span>수리 완료</div><span className="eyebrow">한 음씩, 한 걸음씩</span><h1 id="completion-heading" tabIndex={-1}>{orderNumber===1?'첫 번째 수리, 완료!':`${orderNumber}번째 수리, 완료!`}</h1><p>세 음을 살펴보고 새로운 화음을 만들었어요.<br/>수리한 악기가 진열장에 놓였어요.</p><InstrumentScene orderId={order.id} completed={stage==='completed'}/><div className="completed-chord">{session.notes.map((midi,index)=><span key={index}>{noteName(midi,order,session.settings.notation)}</span>)}</div><Transport snapshot={snapshot} services={services} silent={silent} onEnable={()=>void enable()} volume={session.settings.volume} muted={session.settings.mute} onVolumeChange={changeVolume} onToggleMute={toggleMute} onStop={stop}/><EvidenceSummary session={session} order={order}/>{orders[orderNumber]&&<button className="primary" onClick={()=>openOrder(orders[orderNumber])}>다음 주문 <span aria-hidden="true">→</span></button>}<button className="primary" onClick={()=>navigate('orders')}>주문 목록으로 <span aria-hidden="true">→</span></button><button className="text-button practice-button" onClick={()=>{dispatch({type:'NEW_PRACTICE',attemptId:newAttempt(),seed:seed()});setEditorOpen(false);}}>이 주문 다시 연습하기</button></section>:null}
          </section></div>}
      </>}
    </main>
    <footer className="site-footer"><span>화음 수리점</span><span>각자의 속도로, 함께 울리는 음.</span></footer>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    {modal==='reset'&&<Modal title="시작 음으로 돌아갈까요?" onClose={()=>setModal(null)}><p>이 주문의 현재 음만 처음 상태로 되돌려요. 사용한 도움, 설정, 완료 기록은 그대로 남아요.</p><div className="modal-actions"><button autoFocus onClick={()=>setModal(null)}>계속 고치기</button><button className="primary" onClick={()=>{dispatch({type:'RESET'});setEditorOpen(false);setModal(null);}}>시작 음으로 되돌리기</button></div></Modal>}
    {modal==='help'&&<Modal title="작업대 사용 안내" onClose={()=>setModal(null)}><ol className="help-steps"><li>현재 음 조각을 눌러요.</li><li>가상건반이나 큰 음 버튼에서 원하는 음을 골라요.</li><li>준비되면 수리 확인을 눌러요.</li></ol><p>방향키로 이동하고 Enter 또는 Space로 선택할 수 있어요. Escape를 누르면 음 편집을 닫아요.</p><button className="primary" onClick={()=>setModal(null)}>알겠어요</button></Modal>}
  </div>;
}

export function RelationshipExplanation({order}:{order:Order}){
  const differences=order.initialMidi.flatMap((midi,index)=>midi===order.targetMidi[index]?[]:[{index,before:midi,after:order.targetMidi[index]}]);
  const unchanged=order.initialMidi.filter(midi=>order.targetMidi.includes(midi));
  const changedRole=order.id==='CR07'?'5음':order.id==='CR08'?'근음':'3음';
  const endpoint=order.id==='CR07'?2:1;
  return <div data-testid="relationship-explanation" className="relationship-explanation"><p><b>{changedRole}</b>을 바꾸었어요.</p><div className="change-pairs">{differences.map(change=><div key={change.index}><span>{noteName(change.before,order)}</span><b aria-hidden="true">→</b><strong>{noteName(change.after,order)}</strong></div>)}</div><p><b>{unchanged.map(midi=>noteName(midi,order,'letters')).join('와 ')}</b>는 그대로 두었어요.</p>{order.id==='CR08'?<p>기준이 되는 근음이 E에서 F로 바뀌었어요. F에서 A♭까지 3반음, C까지 7반음이에요.</p>:<p>근음에서 {changedRole}까지의 거리가 {order.initialMidi[endpoint]-order.initialMidi[0]}반음에서 {order.targetMidi[endpoint]-order.targetMidi[0]}반음으로 바뀌었어요.</p>}<DistanceDiagram from={order.targetMidi[0]} to={order.targetMidi[endpoint]} order={order}/><p className="small muted">반음은 이웃한 두 음 사이의 거리예요. 음점의 개수가 아니라, 그 사이 간격을 세어요.</p></div>;
}
