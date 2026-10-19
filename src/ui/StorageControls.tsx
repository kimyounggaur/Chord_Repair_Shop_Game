import {useState} from 'react';
import type {SessionEvent} from '../domain/session/types';
import type {StorageController,StorageView} from '../persistence/controller';
import {createExport,downloadText,prepareImport} from '../persistence/import-export';
import type {ProgressExport} from '../persistence/schemas';
import {Modal} from './components';
export function StorageControls({controller,view,dispatch,stop}:{controller:StorageController;view:StorageView;dispatch:(event:SessionEvent)=>void;stop:()=>void}){
  const [opened,setOpened]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState<{data:ProgressExport;revision:number}|null>(null),[reset,setReset]=useState(false),[clearSettings,setClearSettings]=useState(false);
  const action=async(fn:()=>void|Promise<void>)=>{setError('');try{await fn();}catch(failure){setError(failure instanceof Error?failure.message:'작업을 마치지 못했어요.');}};
  const readOnly=view.mode==='readonly'||view.mode==='recovery';
  return <aside className="storage-bar" aria-label="기기 내 저장"><p role="status" data-testid="storage-status">{view.mode==='saving'?'저장 중…':view.mode==='dirty'?'변경 내용을 저장할 준비 중이에요…':view.message}</p><div className="tool-row"><button onClick={event=>{event.currentTarget.focus();stop();setOpened(true);}}>설정과 기록</button>{view.mode==='readonly'&&<><button onClick={()=>void action(controller.reload)}>기록 새로 불러오기</button><button onClick={()=>void action(controller.takeover)}>이 탭에서 이어서 편집</button><span className="small">다른 탭이 마지막으로 확인된 뒤 15초가 지나면 이어받을 수 있어요.</span></>}{['failed','memoryOnly'].includes(view.mode)&&<button onClick={()=>void action(controller.retry)}>저장 다시 시도</button>}</div>
    {error&&!opened&&<p role="alert">{error}</p>}
    {opened&&<Modal title="설정과 이 기기의 기록" onClose={()=>{setOpened(false);setPending(null);setReset(false);}}>
      <p>이 게임의 기록은 현재 기기와 브라우저에만 저장돼요. 다른 기기로 옮기려면 직접 내보내고 가져와 주세요.</p>
      <fieldset disabled={readOnly} className="settings-fields"><legend>사용 방식</legend><label><input type="checkbox" checked={view.profile.settings.reducedMotion} onChange={event=>dispatch({type:'SET_SETTINGS',patch:{reducedMotion:event.target.checked}})}/> 움직임 줄이기</label><label>음이름 표기<select value={view.profile.settings.notation} onChange={event=>dispatch({type:'SET_SETTINGS',patch:{notation:event.target.value as 'letters'|'solfege'}})}><option value="letters">C · D · E</option><option value="solfege">고정도 병기 · 도 C</option></select></label><label>음 입력<select value={view.profile.settings.inputMode} onChange={event=>dispatch({type:'SET_SETTINGS',patch:{inputMode:event.target.value as 'keyboard'|'pads'}})}><option value="keyboard">가상건반</option><option value="pads">큰 음 버튼</option></select></label></fieldset>
      <div className="tool-row"><button onClick={()=>void action(async()=>{await controller.flush();downloadText(createExport(controller.getSnapshot().profile));})}>기록 내보내기</button>{view.mode==='recovery'&&<button onClick={()=>void action(()=>downloadText(controller.exportRaw(),'chord-repair-diagnostic.json'))}>읽을 수 있는 원본 내보내기</button>}</div>
      <p className="small muted">최근 상세 시도 100개와 주문별 첫 시도·최신 요약을 보관해요. 내보내기는 진행과 설정을 담고, 작업 중인 음·되돌리기·재생 상태는 담지 않아요.</p>
      <label className="import-label">기록 가져오기 · JSON, 최대 256KB<input type="file" accept="application/json,.json" disabled={readOnly} onChange={event=>{const file=event.target.files?.[0];if(file)void action(async()=>{await controller.flush();const data=await prepareImport(file);setPending({data,revision:controller.getSnapshot().profile.revision});});event.target.value='';}}/></label>
      {pending&&<div className="notice"><p>완료 {pending.data.progress.filter(row=>row.receipt).length}개, 상세 시도 {pending.data.attempts.length}개로 현재 기록과 설정을 교체해요. 기존 정상 기록은 복구 백업에 보관해요. 자동 병합하지 않아요.</p><div className="tool-row"><button onClick={()=>setPending(null)}>가져오기 취소</button><button onClick={()=>void action(async()=>{stop();await controller.replace(pending.data,pending.revision);setPending(null);setOpened(false);})}>확인하고 기록 교체</button></div></div>}
      {view.mode==='recovery'&&<section><h3>복구 선택</h3><p>손상된 원본은 자동으로 지우지 않았어요.</p>{view.backup?<button onClick={()=>void action(async()=>{stop();await controller.replace(view.backup!,view.profile.revision,true);setOpened(false);})}>이전 정상 기록으로 복구</button>:<p>검증을 통과한 이전 백업도 없어요. 원본 내보내기 후 새 시작을 선택할 수 있어요.</p>}</section>}
      <button className="text-button" disabled={view.mode==='readonly'} onClick={()=>setReset(true)}>학습 기록 새로 시작</button>
      {reset&&<div className="notice"><p>화음 수리점의 이 브라우저 학습 기록만 초기화해요. 정상 기존 기록은 복구 백업으로 남아요.</p><label><input type="checkbox" checked={clearSettings} onChange={event=>setClearSettings(event.target.checked)}/> 설정도 기본값으로 되돌리기</label><div className="tool-row"><button onClick={()=>setReset(false)}>초기화 취소</button><button onClick={()=>void action(async()=>{stop();await controller.reset(clearSettings);setReset(false);setOpened(false);})}>확인하고 새로 시작</button></div></div>}
      {error&&<p role="alert">{error}</p>}<button className="primary" onClick={()=>{setOpened(false);setPending(null);setReset(false);}}>설정 닫기</button>
    </Modal>}
  </aside>;
}
