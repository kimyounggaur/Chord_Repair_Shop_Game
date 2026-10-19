import bundledJson from './orders.v1.json?raw';
import { gradeChord } from '../domain/grading';
import { equalMultiset, formatPitch, generateTriad, parseSpelledPitch, toMidi, type Quality, type SpelledPitch, type Triad } from '../domain/music';
import type { Order } from './types';
export type { Order } from './types';

export class ContentError extends Error {
  readonly code:'INVALID_CONTENT'|'DUPLICATE_KEY';
  readonly path:string;
  constructor(path:string,message:string,code:'INVALID_CONTENT'|'DUPLICATE_KEY'='INVALID_CONTENT') {
    super(`${code} at ${path}: ${message}`);this.name='ContentError';this.code=code;this.path=path;
  }
}

const fail=(path:string,message:string):never=>{throw new ContentError(path,message);};
const record=(value:unknown,path:string):Record<string,unknown>=>{
  if(!value || typeof value!=='object' || Array.isArray(value) || Object.getPrototypeOf(value)!==Object.prototype) return fail(path,'Expected a plain object');
  return value as Record<string,unknown>;
};
const keys=(value:Record<string,unknown>,expected:readonly string[],path:string):void=>{
  if(Object.keys(value).length!==expected.length || expected.some(key=>!Object.hasOwn(value,key))) fail(path,'Unexpected or missing fields');
};
const string=(value:unknown,path:string,max=200):string=>{
  if(typeof value!=='string' || !value.trim() || value.length>max) return fail(path,'Expected a bounded nonempty string');
  return value;
};
const tuple=(value:unknown,length:number,path:string):unknown[]=>{
  if(!Array.isArray(value) || value.length!==length || Array.from({length},(_,i)=>!Object.hasOwn(value,i)).some(Boolean)) return fail(path,`Expected ${length} entries`);
  return value;
};
const integer=(value:unknown,min:number,max:number,path:string):number=>{
  if(typeof value!=='number' || !Number.isInteger(value) || value<min || value>max) return fail(path,'Integer out of bounds');
  return value;
};
const pitch=(value:unknown,path:string):SpelledPitch=>{
  try {return parseSpelledPitch(string(value,path,12));} catch(error) {if(error instanceof ContentError) throw error;return fail(path,'Invalid pitch spelling');}
};
const sameArray=(a:readonly unknown[],b:readonly unknown[]):boolean=>a.length===b.length && a.every((value,i)=>value===b[i]);
function deepFreeze<T>(value:T):T {
  if(value && typeof value==='object') {Object.values(value).forEach(deepFreeze);Object.freeze(value);}
  return value;
}

const ORDER_FIELDS=['schemaVersion','contentVersion','id','title','root','quality','initial','target','initialMidi','targetMidi','editableSlots','allowedMidi','displaySpellingMap','registerMode','spellingRequired','inversion','primaryConcept','hintPolicy','reflection'];

/** Validates decoded raw objects. The JSON text entrypoint additionally rejects duplicate keys. */
export function validateOrders(value:unknown):readonly Order[] {
  const items=tuple(value,8,'orders');
  const ids=new Set<string>();
  const result=items.map((item,index):Order=>{
    const path=`orders[${index}]`;
    const row=record(item,path);keys(row,ORDER_FIELDS,path);
    if(row.schemaVersion!==1 || row.contentVersion!=='1.0.0') fail(path,'Unsupported schema/content version');
    const id=string(row.id,`${path}.id`,4);
    if(id!==`CR${String(index+1).padStart(2,'0')}` || ids.has(id)) fail(`${path}.id`,'Expected unique CR01–CR08 in order');
    ids.add(id);
    const title=string(row.title,`${path}.title`);
    const root=pitch(row.root,`${path}.root`);
    if(row.quality!=='major' && row.quality!=='minor') fail(`${path}.quality`,'Unsupported quality');
    const quality=row.quality as Quality;
    const initial=tuple(row.initial,3,`${path}.initial`).map((n,i)=>pitch(n,`${path}.initial[${i}]`)) as unknown as Triad;
    const target=tuple(row.target,3,`${path}.target`).map((n,i)=>pitch(n,`${path}.target[${i}]`)) as unknown as Triad;
    const initialMidi=tuple(row.initialMidi,3,`${path}.initialMidi`).map((n,i)=>integer(n,60,74,`${path}.initialMidi[${i}]`)) as [number,number,number];
    const targetMidi=tuple(row.targetMidi,3,`${path}.targetMidi`).map((n,i)=>integer(n,60,74,`${path}.targetMidi[${i}]`)) as [number,number,number];
    if(!sameArray(initial.map(toMidi),initialMidi) || !sameArray(target.map(toMidi),targetMidi)) fail(path,'Spelling and MIDI disagree');
    let generated:Triad;
    try {generated=generateTriad(root,quality);} catch {return fail(path,'Unsupported target triad');}
    if(!sameArray(target.map(n=>formatPitch(n)),generated.map(n=>formatPitch(n)))) fail(`${path}.target`,'Target differs from root and quality');
    if(!sameArray(tuple(row.allowedMidi,2,`${path}.allowedMidi`),[60,74])) fail(path,'Input range must remain 60…74');
    if(row.registerMode!=='exact' || row.spellingRequired!==false || row.inversion!==0) fail(path,'MVP requires exact/false/0 constraints');
    const requiredEditable=index<2?[1]:[0,1,2];
    const editableSlots=tuple(row.editableSlots,requiredEditable.length,`${path}.editableSlots`).map((n,i)=>integer(n,0,2,`${path}.editableSlots[${i}]`));
    if(!sameArray(editableSlots,requiredEditable) || new Set(editableSlots).size!==editableSlots.length) fail(path,'Invalid editable slot policy');
    for(let slot=0;slot<3;slot++) if(!editableSlots.includes(slot) && formatPitch(initial[slot])!==formatPitch(target[slot])) fail(path,'A locked slot prevents reaching the target');
    if(equalMultiset(initialMidi,targetMidi)) fail(path,'Initial chord is already correct');
    const map=record(row.displaySpellingMap,`${path}.displaySpellingMap`);
    keys(map,Array.from({length:15},(_,i)=>String(i+60)),`${path}.displaySpellingMap`);
    const displaySpellingMap:Record<number,SpelledPitch>={};
    for(const [key,value] of Object.entries(map)) {
      const mapped=pitch(value,`${path}.displaySpellingMap.${key}`);
      if(toMidi(mapped)!==Number(key)) fail(path,'Display spelling does not match its MIDI key');
      displaySpellingMap[Number(key)]=mapped;
    }
    if(typeof row.primaryConcept!=='string' || !['major-third','minor-third','fifth','root'].includes(row.primaryConcept)) fail(path,'Invalid primary concept');
    const primaryConcept=row.primaryConcept as Order['primaryConcept'];
    const hintPolicy=index<2?'guided':'optional';
    if(row.hintPolicy!==hintPolicy) fail(path,'Invalid hint policy');
    const reflection=record(row.reflection,`${path}.reflection`);keys(reflection,['prompt','options','answerIndex'],`${path}.reflection`);
    const prompt=string(reflection.prompt,`${path}.reflection.prompt`,500);
    const options=tuple(reflection.options,3,`${path}.reflection.options`).map((n,i)=>string(n,`${path}.reflection.options[${i}]`));
    const answerIndex=integer(reflection.answerIndex,0,options.length-1,`${path}.reflection.answerIndex`);
    if(answerIndex!==(id==='CR04'?1:0)) fail(path,'Reflection answer differs from the reference version');
    const order:Order={schemaVersion:1,contentVersion:'1.0.0',id,title,root,quality,initial,target,initialMidi,targetMidi,editableSlots,allowedMidi:[60,74],displaySpellingMap,registerMode:'exact',spellingRequired:false,inversion:0,primaryConcept,hintPolicy,reflection:{prompt,options,answerIndex}};
    if(gradeChord(order.target,order).status!=='correct' || gradeChord(order.initial,order).status!=='incorrect') fail(path,'Target/initial grading contract failed');
    return order;
  });
  return deepFreeze(result);
}

/** JSON.parse validates grammar first; a bounded structural scan detects keys before parsing can erase duplicates. */
export function parseOrdersJson(text:string):readonly Order[] {
  if(typeof text!=='string' || text.length>200_000) fail('json','Input is not bounded JSON text');
  let decoded:unknown;
  try {decoded=JSON.parse(text);} catch {return fail('json','Malformed JSON');}
  let cursor=0;
  const whitespace=()=>{while(/\s/.test(text[cursor]??'') && cursor<text.length) cursor++;};
  const readString=():string=>{
    const start=cursor++;
    while(cursor<text.length) {const char=text[cursor++];if(char==='\\') cursor++;else if(char==='"') break;}
    return JSON.parse(text.slice(start,cursor)) as string;
  };
  const scan=(depth:number):void=>{
    if(depth>16) fail('json','Excessive nesting');
    whitespace();
    if(text[cursor]==='{') {
      cursor++;whitespace();const seen=new Set<string>();let count=0;
      while(text[cursor]!=='}') {
        whitespace();const key=readString();
        if(seen.has(key)) throw new ContentError('json',`Duplicate property ${key}`,'DUPLICATE_KEY');
        seen.add(key);if(++count>100) fail('json','Too many object properties');
        whitespace();cursor++;scan(depth+1);whitespace();if(text[cursor]===',') cursor++;
      }
      cursor++;
    } else if(text[cursor]==='[') {
      cursor++;whitespace();let count=0;
      while(text[cursor]!==']') {if(++count>100) fail('json','Too many array entries');scan(depth+1);whitespace();if(text[cursor]===',') cursor++;}
      cursor++;
    } else if(text[cursor]==='"') readString();
    else {while(cursor<text.length && !/[\s,\]}]/.test(text[cursor])) cursor++;}
  };
  scan(0);
  return validateOrders(decoded);
}

let cached:readonly Order[]|undefined;
export function loadOrders():readonly Order[] {
  cached ??= parseOrdersJson(bundledJson);
  return cached;
}
