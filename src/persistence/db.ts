export const DB_NAME='chord-repair-shop';
export const STORES=['meta','settings','attempts','progress','draft','backup'] as const;
export function openDatabase(factory:IDBFactory=indexedDB):Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  const request=factory.open(DB_NAME,1);request.onupgradeneeded=()=>{for(const name of STORES)if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name);};
  request.onerror=()=>reject(request.error??new Error('저장소를 열지 못했어요.'));request.onblocked=()=>reject(new Error('다른 탭이 저장소 변경을 막고 있어요.'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
});}
export type RawRecords={meta:unknown;settings:unknown;attempts:unknown[];progress:unknown[];draft:unknown;backup:unknown};
export function readRecords(tx:IDBTransaction,ready:(records:RawRecords)=>void){
  const records:RawRecords={meta:undefined,settings:undefined,attempts:[],progress:[],draft:undefined,backup:undefined};let pending=6;
  for(const name of STORES){const store=tx.objectStore(name);const request=name==='attempts'||name==='progress'?store.getAll():store.get(name==='meta'?'profile':name==='settings'?'main':name==='draft'?'active':'previous');request.onsuccess=()=>{Object.assign(records,{[name]:request.result});if(--pending===0)ready(records);};}
}
