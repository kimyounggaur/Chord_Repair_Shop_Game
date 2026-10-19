import {useEffect,useRef,type ReactNode} from 'react';
import artMap from '../content/order-art-map.json';
import type {Order} from '../content/types';
import {formatPitch,spellForTask} from '../domain/music';
import type {AudioSnapshot,WorkbenchServices} from './services';

export const noteName=(midi:number,order:Order,notation:'letters'|'solfege'='letters')=>{const name=formatPitch(spellForTask(midi,order.root,order.quality,order.displaySpellingMap),'unicode');const syllables:Record<string,string>={C:'도',D:'레',E:'미',F:'파',G:'솔',A:'라',B:'시'};return notation==='letters'?name:`${syllables[name[0]]}${name.slice(1).replace(/-?\d+$/,'')} ${name}`;};
export const spokenNote=(midi:number,order:Order,notation:'letters'|'solfege'='letters')=>noteName(midi,order,notation).replaceAll('♭',' 플랫 ').replaceAll('♯',' 샵 ');
export const targetName=(order:Order)=>`${formatPitch(order.root,'unicode').replace(/-?\d+$/,'')} ${order.quality==='major'?'장':'단'}3화음`;
export const musicalText=(text:string)=>text.replace(/([A-G])b/g,'$1♭').replace(/([A-G])#/g,'$1♯');

export function ShopMark({large=false}:{large?:boolean}){
  return <svg className={large?'shop-mark large':'shop-mark'} viewBox="0 0 120 120" fill="none" aria-hidden="true"><circle cx="60" cy="60" r="53" stroke="currentColor" strokeWidth="1.5"/><path d="M24 75 60 91l36-16V50L60 35 24 50v25Zm0-25 36 16 36-16M60 66v25M34 55V42m13 19V35m13 31V28m13 33V35m13 20V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M56 19h8m-4-4v8" stroke="currentColor" strokeWidth="1.5"/></svg>;
}

export function InstrumentScene({orderId='CR01',completed=false,customer=true}:{orderId?:string;completed?:boolean;customer?:boolean}){
  const mapping=artMap.orders.find(row=>row.order_id===orderId)??artMap.orders[0];const selected=completed?mapping.completion:mapping.before;
  const picture=(file:string,kind:string)=>{const src=file.replace('runtime/','/assets/chord-repair-shop/');return <picture className={kind}><source media="(max-width: 700px)" srcSet={src.replace('.webp','-mobile.webp')}/><img src={src} width={384} height={384} alt="" loading="lazy" decoding="async"/></picture>;};
  return <div className={customer?'instrument-art':'instrument-art prop-only'} aria-hidden="true">{customer&&picture(selected.customer,'customer-art')}{picture(selected.prop,'prop-art')}</div>;
}

export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  const returnTarget=useRef(document.activeElement as HTMLElement|null);
  useEffect(()=>{
    const previous=returnTarget.current,dialog=ref.current;
    const fit=()=>{if(!dialog)return;const zoom=Number(getComputedStyle(document.documentElement).zoom)||1;dialog.style.maxWidth=`${Math.max(100,(visualViewport?.width??innerWidth)/zoom-24)}px`;dialog.style.maxHeight=`${Math.max(100,(visualViewport?.height??innerHeight)/zoom-24)}px`;};
    fit();dialog?.showModal();window.addEventListener('resize',fit);visualViewport?.addEventListener('resize',fit);
    return()=>{window.removeEventListener('resize',fit);visualViewport?.removeEventListener('resize',fit);dialog?.close();requestAnimationFrame(()=>previous?.isConnected&&previous.focus());};
  },[]);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onKeyDown={event=>{
    if(event.key!=='Tab')return;const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(element=>element.getClientRects().length>0);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }} onCancel={event=>{event.preventDefault();onClose();}}><div className="eyebrow">잠깐 살펴보기</div><h2 id="modal-title">{title}</h2>{children}</dialog>;
}

export function Transport({snapshot,services,silent,onEnable,volume,muted,onVolumeChange,onToggleMute,onStop}:{snapshot:AudioSnapshot;services:WorkbenchServices;silent:boolean;onEnable:()=>void;volume:number;muted:boolean;onVolumeChange:(volume:number)=>void;onToggleMute:()=>void;onStop:()=>void}){
  return <section className="transport" aria-label="화음 듣기"><div className="transport-buttons"><button disabled={silent} onClick={()=>services.playOriginal(snapshot)} aria-label="원래 화음 듣기"><span aria-hidden="true">▷</span> 원래</button><button disabled={silent} onClick={()=>services.playCurrent(snapshot)} aria-label="현재 화음 듣기"><span aria-hidden="true">▷</span> 현재</button><button disabled={silent} onClick={()=>services.compare(snapshot)}>전후 비교</button><button disabled={silent} onClick={()=>services.arpeggiate(snapshot)}>한 음씩</button><button onClick={onStop} aria-label="재생 정지"><span aria-hidden="true">■</span> 정지</button></div><div className="audio-settings"><label>음량<input aria-label="음량" type="range" min="0" max="1" step="0.05" value={volume} aria-valuetext={`${Math.round(volume*100)}%`} onChange={event=>onVolumeChange(Number(event.target.value))}/><output>{Math.round(volume*100)}%</output></label><button aria-pressed={muted} onClick={onToggleMute}>{muted?'음소거 해제':'음소거'}</button></div>{silent?<p className="small muted">소리 없이 음 관계를 살펴보는 중이에요. <button className="text-button" onClick={onEnable}>소리 켜기</button></p>:<p className="small muted">원래 음과 지금 고친 음을 같은 소리로 비교해 보세요.</p>}</section>;
}

