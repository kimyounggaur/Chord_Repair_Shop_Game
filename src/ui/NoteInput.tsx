import {useCallback,useEffect,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import type {Order} from '../content/types';
import {noteName,spokenNote} from './components';
import type {WorkbenchServices} from './services';

type Props={order:Order;currentMidi:number;mode:'keyboard'|'pads';notation?:'letters'|'solfege';onCommit:(midi:number)=>void;onClose:()=>void;services:WorkbenchServices;silent:boolean};
type Gesture={x:number;y:number;canceled:boolean};
const black=(midi:number)=>[1,3,6,8,10].includes(midi%12);

export function NoteInput({order,currentMidi,mode,notation='letters',onCommit,onClose,services,silent}:Props){
  const [focusMidi,setFocusMidi]=useState(currentMidi);
  const root=useRef<HTMLDivElement>(null);
  const scroll=useRef<HTMLDivElement>(null);
  const gestures=useRef(new Map<number,Gesture>());
  const cancelled=useRef(false);
  const cancel=useCallback(()=>{cancelled.current=true;for(const gesture of gestures.current.values())gesture.canceled=true;services.stopAll();},[services]);
  const clear=useCallback(()=>{cancel();gestures.current.clear();},[cancel]);
  useEffect(()=>{window.addEventListener('blur',clear);window.addEventListener('pagehide',clear);return()=>{window.removeEventListener('blur',clear);window.removeEventListener('pagehide',clear);clear();};},[clear]);
  useEffect(()=>{setFocusMidi(currentMidi);const button=root.current?.querySelector<HTMLButtonElement>(`[data-midi="${currentMidi}"]`);button?.focus({preventScroll:true});button?.scrollIntoView({block:'nearest',inline:'nearest'});},[currentMidi,mode]);
  const moveFocus=(midi:number)=>{const next=Math.min(order.allowedMidi[1],Math.max(order.allowedMidi[0],midi));setFocusMidi(next);root.current?.querySelector<HTMLButtonElement>(`[data-midi="${next}"]`)?.focus({preventScroll:true});root.current?.querySelector<HTMLButtonElement>(`[data-midi="${next}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});};
  const keyboard=(event:KeyboardEvent<HTMLButtonElement>,midi:number)=>{
    const step=mode==='pads'?4:1;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();moveFocus(event.key==='Home'?order.allowedMidi[0]:event.key==='End'?order.allowedMidi[1]:midi+(event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:event.key==='ArrowUp'?-step:step));}
    if(event.key==='Escape'){event.preventDefault();clear();onClose();}
    if(event.repeat&&(event.key==='Enter'||event.key===' '))event.preventDefault();
  };
  const down=(event:PointerEvent<HTMLButtonElement>,midi:number)=>{
    if(gestures.current.size===0)cancelled.current=false;
    gestures.current.set(event.pointerId,{x:event.clientX,y:event.clientY,canceled:false});
    if(gestures.current.size>1||event.isPrimary===false)cancel();
    else if(!silent)services.previewNote(midi);
  };
  const midis=Array.from({length:order.allowedMidi[1]-order.allowedMidi[0]+1},(_,i)=>order.allowedMidi[0]+i);
  const whiteNotes=midis.filter(midi=>!black(midi));
  const key=(midi:number)=>{
    const isBlack=black(midi);const position=isBlack?whiteNotes.filter(note=>note<midi).length*56-18:whiteNotes.indexOf(midi)*56;
    return <button key={midi} type="button" className={mode==='pads'?`note-pad ${midi===currentMidi?'current':''}`:`piano-key ${isBlack?'black':'white'} ${midi===currentMidi?'current':''}`} style={mode==='keyboard'?{left:position}:undefined} data-midi={midi} data-testid={`note-input-${midi}`} tabIndex={focusMidi===midi?0:-1} aria-label={`${noteName(midi,order,notation)} ${midi===currentMidi?'현재 음':mode==='pads'?'선택':''}${spokenNote(midi,order,notation)!==noteName(midi,order,notation)?`, ${spokenNote(midi,order,notation)}`:''}`} aria-pressed={midi===currentMidi} onFocus={()=>setFocusMidi(midi)} onKeyDown={event=>keyboard(event,midi)} onPointerDown={event=>down(event,midi)} onClick={event=>{if(event.detail!==0&&(cancelled.current||gestures.current.size>0))return;onCommit(midi);}}><span>{noteName(midi,order,notation)}</span>{' '}<small aria-hidden="true">{midi===currentMidi?'현재':mode==='pads'?'선택':''}</small></button>;
  };
  return <div ref={root} className={`note-input ${mode}`} role="group" aria-label="C4부터 D5까지 음 선택" onPointerMove={event=>{const gesture=gestures.current.get(event.pointerId);if(gesture&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>8)cancel();}} onPointerUp={event=>{const gesture=gestures.current.get(event.pointerId);if(gesture?.canceled)cancelled.current=true;gestures.current.delete(event.pointerId);}} onPointerCancel={clear} onLostPointerCapture={event=>{if(gestures.current.has(event.pointerId))clear();}} onScrollCapture={cancel}>
    {mode==='pads'?<div className="note-pad-grid">{midis.map(key)}</div>:<><div className="piano-scroll" ref={scroll} tabIndex={-1}><div className="piano" style={{width:whiteNotes.length*56}}>{midis.map(key)}</div></div><div className="piano-navigation"><button onClick={()=>scroll.current?.scrollBy({left:-168,behavior:'auto'})}>← 낮은 쪽</button><span className="small">옆으로 밀어 더 보기</span><button onClick={()=>scroll.current?.scrollBy({left:168,behavior:'auto'})}>높은 쪽 →</button></div></>}
    <p className="input-tip small">방향키로 음을 살펴보고 Enter 또는 Space로 선택해요. Esc는 닫기.</p>
  </div>;
}
