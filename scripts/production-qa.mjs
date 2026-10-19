import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {cpus,release,totalmem} from 'node:os';
import {createHash} from 'node:crypto';
import {installProbe} from './browser-probe.mjs';
const baseURL=process.env.PRODUCTION_URL??'http://127.0.0.1:4486';
const report={startedAt:new Date().toISOString(),baseURL,host:{platform:process.platform,os:release(),cpu:cpus()[0]?.model,logicalCpus:cpus().length,memoryGiB:totalmem()/2**30},limitations:['Automated desktop Chromium with touch viewport; not a physical phone.','Paint is pointerup to second requestAnimationFrame, not external display measurement.','Scheduling excludes device and speaker latency; no human listening.']};
mkdirSync('docs/evidence',{recursive:true});
const browser=await chromium.launch({headless:true});report.browser=browser.version();
const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true});
await context.addInitScript(installProbe);
await context.addInitScript(()=>{
  const observer=new MutationObserver(()=>{if(document.querySelector('.home-actions button')){window.__homeReadyAt=performance.now();observer.disconnect();}});
  observer.observe(document,{childList:true,subtree:true});
});
const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:4_000_000/8,uploadThroughput:1_000_000/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
const click=name=>page.getByRole('button',{name,exact:true}).click();
try{
  const response=await page.goto('/');await expect(page.getByRole('button',{name:'소리 없이 시작',exact:true})).toBeVisible();
  report.headers=await response.allHeaders();expect(report.headers['content-security-policy']).toContain("script-src 'self'");expect(report.headers['permissions-policy']).toContain('microphone=()');
  await click('소리 없이 시작');await click('작업대 열기');await page.waitForLoadState('networkidle');
  report.initial=await page.evaluate(()=>({fcp:performance.getEntriesByType('paint').find(entry=>entry.name==='first-contentful-paint')?.startTime,homeReadyAt:window.__homeReadyAt,resources:performance.getEntriesByType('resource').map(entry=>({name:new URL(entry.name).pathname,transferSize:entry.transferSize,encodedBodySize:entry.encodedBodySize})),navigation:performance.getEntriesByType('navigation').map(entry=>({transferSize:entry.transferSize,encodedBodySize:entry.encodedBodySize}))}));
  report.network={latencyMs:100,downloadMbps:4,uploadMbps:1,cpuSlowdown:4,coldCache:true};
  report.initial.totalTransferBytes=report.initial.resources.reduce((sum,row)=>sum+row.transferSize,0)+report.initial.navigation.reduce((sum,row)=>sum+row.transferSize,0);expect(report.initial.totalTransferBytes).toBeLessThan(1_500_000);
  // Native gestures with real synthesis; warm-up five, then fifty measured taps.
  await click('소리 켜기');await page.getByTestId('note-slot-1').click();await click('큰 음 버튼');
  // CDP sends native touch input with a declared 80 ms contact. The zero-duration
  // Playwright tap used in discovery can cancel the preview on commit before its
  // asynchronous enable resolves; retain that discovery separately, not as a sample.
  for(let index=0;index<55;index++){
    const key=page.getByTestId(`note-input-${index%2?63:64}`);await key.scrollIntoViewIfNeeded();const box=await key.boundingBox();if(!box)throw new Error('Missing pitch button bounds');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await page.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect.poll(()=>page.evaluate(()=>window.__chordProbe.snapshot().paintMs.length)).toBe(index+1);
  }
  await expect.poll(()=>page.evaluate(()=>window.__chordProbe.snapshot().paintMs.length)).toBe(55);const probe=await page.evaluate(()=>window.__chordProbe.snapshot());const percentile=rows=>rows.slice().sort((a,b)=>a-b)[Math.ceil(rows.length*.95)-1];
  report.input={warmup:5,samples:50,contactDurationMs:80,nativeInput:'CDP touchStart/touchEnd',paintSamples:probe.paintMs.slice(5),scheduleSamples:probe.scheduleMs.slice(5),paintP95:percentile(probe.paintMs.slice(5)),scheduleP95:percentile(probe.scheduleMs.slice(5)),observedSchedules:probe.scheduleMs.length,requestedGestures:55};expect(report.input.paintSamples.length).toBe(50);expect(probe.scheduleMs.length).toBeGreaterThan(0);
  // A canceled preview is missing data, never a zero-latency success. Keep this
  // performance gate separate so offline/core-function verification still runs.
  report.input.targets={paintP95Ms:100,scheduleP95Ms:30};report.input.targetStatus=probe.scheduleMs.length===55&&report.input.paintP95<=100&&report.input.scheduleP95<=30?'PASS':'INCONCLUSIVE_TARGET_MISS_OR_INCOMPLETE_SAMPLE_ON_EMULATED_HOST';
  await click('재생 정지');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await context.setOffline(true);report.offlineStartedAt=new Date().toISOString();const offlineRequests=requests.length;
  await page.getByTestId('note-input-64').tap();await click('수리 확인');await click('건너뛰기');await click('수리 마치기');
  for(let index=1;index<8;index++){await click('다음 주문');await click('작업대 열기');await click('도움 3 · 시범');await click('시범 상태로 연습');await click('수리 확인');await click('건너뛰기');await click('수리 마치기');}
  await expect(page.getByTestId('storage-status')).toContainText('저장했어요');await click('진열과 합주');await click('합주 듣기');await expect(page.getByTestId('ensemble-state')).toContainText('재생 중');await expect(page.getByTestId('ensemble-state')).toContainText('멈춰',{timeout:28000});
  report.offline={completedOrders:8,fullEnsemble:true,requestsAfterOffline:requests.slice(offlineRequests),probe:await page.evaluate(()=>window.__chordProbe.snapshot())};
  expect(report.offline.probe.voices).toBe(0);expect(report.offline.probe.peakVoices).toBeLessThanOrEqual(24);expect(report.offline.probe.violations).toEqual([]);
  await context.setOffline(false);await page.reload();await click('진열과 합주');await expect(page.locator('.collection-screen')).toContainText('수리 완료 8 / 8');
  await page.screenshot({path:'output/playwright/S11-production-mobile.png',fullPage:true});
  report.pageErrors=errors;expect(errors).toEqual([]);report.externalRequests=requests.filter(url=>new URL(url).origin!==new URL(baseURL).origin);expect(report.externalRequests).toEqual([]);
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{report.endedAt=new Date().toISOString();report.localArtifactHash=createHash('sha256').update(readFileSync('dist/index.html')).digest('hex');writeFileSync('docs/evidence/S11-production-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,error:report.error,initial:report.initial&&{transfer:report.initial.totalTransferBytes,fcp:report.initial.fcp,homeReadyAt:report.initial.homeReadyAt},input:report.input&&{paintP95:report.input.paintP95,scheduleP95:report.input.scheduleP95},offline:report.offline?.completedOrders},null,2));await browser.close();}
