// Diagnostic only, excluded from the application and release identity.
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true}),rows=[];
for(let index=0;index<12;index++){
 const page=await browser.newPage();await page.routeWebSocket('**/*',socket=>socket.close());await page.goto('http://127.0.0.1:5486');await page.getByRole('button',{name:/소리 켜고 시작/}).click();await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
 await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').find(row=>new URL(row.name).pathname==='/src/app/runtime.tsx').name;
  const {audioService:a}=await import(url);window.__previewAudit={calls:[],audio:a};const rows=window.__previewAudit.calls;
  const group=a.scheduleGroup.bind(a);a.scheduleGroup=events=>{const before={kind:'schedule',at:events[0]?.at,now:a.currentTime,generation:a.generation};const result=group(events);rows.push({...before,result,after:a.currentTime});return result;};
  const stop=a.stopAll;a.stopAll=()=>{rows.push({kind:'stop',generation:a.generation,stack:new Error().stack});return stop();};
  document.addEventListener('scroll',event=>rows.push({kind:'scroll',target:event.target.className}),true);
 });
 await page.getByTestId('note-slot-1').click();await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
 const before=await page.evaluate(()=>window.__previewAudit.audio.getDiagnostics());await page.getByTestId('note-input-64').dispatchEvent('pointerdown',{pointerId:1,clientX:20,clientY:20,pointerType:'touch',isPrimary:true});await page.waitForTimeout(180);
 rows.push({index,before,...await page.evaluate(()=>({after:window.__previewAudit.audio.getDiagnostics(),calls:window.__previewAudit.calls}))});await page.close();
}
await browser.close();writeFileSync('docs/evidence/S11-preview-diagnostic.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows.map(row=>({index:row.index,scheduled:row.after.scheduledEvents,groups:row.calls.filter(call=>call.kind==='schedule'),stops:row.calls.filter(call=>call.kind==='stop').length,scroll:row.calls.filter(call=>call.kind==='scroll')})),null,2));
