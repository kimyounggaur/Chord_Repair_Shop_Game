import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {installProbe} from './browser-probe.mjs';
const duration=20*60*1000,baseURL='http://127.0.0.1:4486';
const report={startedAt:new Date().toISOString(),durationRequestedMs:duration,baseURL,artifact:JSON.parse(readFileSync('dist/release.json','utf8')).artifactManifestSha256,samples:[],cycles:0,errors:[],method:'Real elapsed twenty minutes of production UI interaction. Native audio; test-only native-node/timer probes and CDP GC + DOM counters at each minute. No simulated clock. GC normalizes sampled heap, not application state. No human listening or physical device result.'};
const browser=await chromium.launch({headless:true});report.browser=browser.version();
const context=await browser.newContext({baseURL,viewport:{width:1280,height:960}});await context.addInitScript(installProbe);const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
const click=name=>page.getByRole('button',{name,exact:true}).click();const save=()=>writeFileSync('docs/evidence/S11-soak.json',JSON.stringify(report,null,2)+'\n');
async function sample(elapsed){await cdp.send('HeapProfiler.collectGarbage');const metrics=await cdp.send('Performance.getMetrics'),dom=await cdp.send('Memory.getDOMCounters'),probe=await page.evaluate(()=>window.__chordProbe.snapshot());const row={elapsedMs:elapsed,heapBytes:metrics.metrics.find(row=>row.name==='JSHeapUsedSize')?.value,...dom,probe:{...probe,paintMs:undefined,scheduleMs:undefined}};report.samples.push(row);expect(probe.voices).toBe(0);expect(probe.peakVoices).toBeLessThanOrEqual(24);expect(probe.contexts).toBe(1);expect(probe.violations).toEqual([]);save();console.log(JSON.stringify({elapsedMinutes:Math.round(elapsed/6000)/10,cycles:report.cycles,heap:row.heapBytes,listeners:dom.jsEventListeners,timers:probe.timers,voices:probe.voices}));}
try{
  await page.goto('/');await click('소리 없이 시작');for(let index=0;index<8;index++){await click('작업대 열기');await click('도움 3 · 시범');await click('시범 상태로 연습');await click('수리 확인');await click('건너뛰기');await click('수리 마치기');if(index<7)await click('다음 주문');}
  await click('진열과 합주');await click('합주 소리 켜기');await page.getByRole('button',{name:/수리로 돌아가기/}).click();
  // Begin the measured window after the one-time course setup, on a stable view.
  await page.getByRole('button',{name:'주문 목록',exact:true}).click();const start=Date.now();report.measuredStartedAt=new Date(start).toISOString();let nextSample=start;await sample(0);nextSample+=60000;
  while(Date.now()-start<duration){
    const index=report.cycles%8;await page.getByTestId(`order-CR0${index+1}`).click();if(await page.getByRole('button',{name:'작업대 열기',exact:true}).count())await click('작업대 열기');if(await page.getByRole('button',{name:'이 주문 다시 연습하기',exact:true}).count())await click('이 주문 다시 연습하기');
    if(await page.getByRole('button',{name:'작업대 열기',exact:true}).count())await click('작업대 열기');
    await page.getByTestId('note-slot-1').click();await click('큰 음 버튼');await page.getByTestId(`note-input-${index<2?64:69}`).click();await click('전후 비교');await page.waitForTimeout(140);await page.getByTestId('note-input-68').click();await click('전후 비교');await page.waitForTimeout(300);await click('재생 정지');
    await click('진열과 합주');await click('합주 듣기');await page.waitForTimeout(report.cycles%5===0?4500:1400);await click('합주 정지');
    await click('자유 실험');await click('G 단3화음');await page.getByTestId('note-input-67').click();await click('현재 화음 듣기');await page.waitForTimeout(180);await click('재생 정지');await click('주문 목록');await page.waitForTimeout(80);report.cycles++;
    if(Date.now()>=nextSample){await sample(Date.now()-start);nextSample+=60000;}
  }
  await page.waitForTimeout(500);await sample(Date.now()-start);report.elapsedMs=Date.now()-start;report.status='PASS';
  const stable=report.samples.filter(row=>row.elapsedMs>=60000);const first=stable[0],last=stable.at(-1);report.trend={firstHeap:first.heapBytes,lastHeap:last.heapBytes,growthBytes:last.heapBytes-first.heapBytes,firstListeners:first.jsEventListeners,lastListeners:last.jsEventListeners,firstTimers:first.probe.timers,lastTimers:last.probe.timers};
  if(last.heapBytes-first.heapBytes>5_000_000||last.jsEventListeners-first.jsEventListeners>20||last.probe.timers>first.probe.timers+2){report.status='INCONCLUSIVE_GROWTH_REVIEW_REQUIRED';process.exitCode=1;}
  expect(report.errors).toEqual([]);report.indexHashAtEnd=createHash('sha256').update(readFileSync('dist/index.html')).digest('hex');
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{report.endedAt=new Date().toISOString();save();console.log(JSON.stringify({status:report.status,cycles:report.cycles,elapsedMs:report.elapsedMs,error:report.error,trend:report.trend},null,2));await browser.close();}
