import {MAX_BYTES,validateExport,type Profile,type ProgressExport} from './schemas';
export function createExport(profile:Profile):string{const {schemaVersion,contentVersion,settings,attempts,progress}=profile;const result=JSON.stringify(validateExport({schemaVersion,contentVersion,settings,attempts,progress}));if(new TextEncoder().encode(result).length>MAX_BYTES)throw new Error('내보내기 기록이 256KB를 넘어요. 첫 시도 기록을 보존하기 위해 자동으로 줄이지 않았어요.');return result;}
export async function prepareImport(file:Pick<File,'size'|'text'>):Promise<ProgressExport>{
  if(file.size>MAX_BYTES)throw new Error('파일은 256KB(262,144바이트) 이하여야 해요.');const text=await file.text();if(new TextEncoder().encode(text).length>MAX_BYTES)throw new Error('UTF-8 데이터가 256KB를 넘어요.');
  let value:unknown;try{value=JSON.parse(text);}catch{throw new Error('JSON 파일을 읽을 수 없어요.');}return validateExport(value);
}
export function downloadText(text:string,name='chord-repair-progress-v1.json'){
  const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
