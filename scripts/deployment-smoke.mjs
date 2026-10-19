import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {extname} from 'node:path';
import {installProbe} from './browser-probe.mjs';
const url=process.env.PRODUCTION_URL,expectedCommit=process.env.EXPECTED_COMMIT;
const reportPath=process.env.REPORT_PATH??'docs/evidence/S14-deployment-smoke.json';
const screenshotPath=process.env.SCREENSHOT_PATH??'output/playwright/S14-production-mobile.png';
if(!url?.startsWith('https://')||!expectedCommit?.match(/^[a-f0-9]{40}$/))throw new Error('Set actual HTTPS PRODUCTION_URL and full EXPECTED_COMMIT');
const candidate=JSON.parse(readFileSync('dist/release.json','utf8'));
const report={startedAt:new Date().toISOString(),url,expectedCommit,files:[],limitations:['Automated Chromium touch viewport; no physical device, human listening or AT result.','Uses an isolated QA profile and no authenticated browser cookies.']};
let browser;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
try{
  const response=await fetch(new URL('/release.json',url));expect(response.status).toBe(200);const deployed=await response.json();report.deployed=deployed;
  for(const key of ['releaseId','appVersion','contentVersion','sourceSha256','contentSha256','assetManifestSha256','lockfileSha256','artifactManifestSha256'])expect(deployed[key],key).toBe(candidate[key]);expect(deployed.gitCommit).toBe(expectedCommit);
  const mime={'.html':'text/html','.js':'javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.md':'text/'};
  for(const file of candidate.artifacts){const asset=await fetch(new URL('/'+file.path,url));expect(asset.status,file.path).toBe(200);const bytes=Buffer.from(await asset.arrayBuffer());expect(hash(bytes),file.path).toBe(file.sha256);const type=asset.headers.get('content-type'),cache=asset.headers.get('cache-control');if(mime[extname(file.path)])expect(type,file.path+' MIME').toContain(mime[extname(file.path)]);if(/^assets\/index-.*\.(js|css)$/.test(file.path)){expect(cache).toContain('immutable');expect(cache).toContain('max-age=31536000');}report.files.push({path:file.path,bytes:bytes.length,sha256:hash(bytes),type,cache});}
  const home=await fetch(url);expect(home.status).toBe(200);report.finalUrl=home.url;report.headers=Object.fromEntries(['content-type','content-security-policy','permissions-policy','cache-control','x-content-type-options','x-frame-options','referrer-policy'].map(key=>[key,home.headers.get(key)]));
  expect(report.headers['content-security-policy']).toContain("script-src 'self'");expect(report.headers['permissions-policy']).toContain('microphone=()');expect(report.headers['x-content-type-options']).toBe('nosniff');expect(report.headers['x-frame-options']).toBe('DENY');expect(report.headers['referrer-policy']).toBe('no-referrer');expect(report.headers['cache-control']).toContain('max-age=0');
  const route=await fetch(new URL('/repair-route-check',url));expect(route.status).toBe(200);expect(hash(Buffer.from(await route.arrayBuffer()))).toBe(candidate.artifacts.find(row=>row.path==='index.html').sha256);
  browser=await chromium.launch({headless:true});report.browser=browser.version();const context=await browser.newContext({baseURL:url,viewport:{width:390,height:844},hasTouch:true,isMobile:true});await context.addInitScript(installProbe);const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);const click=name=>page.getByRole('button',{name,exact:true}).click();await page.goto('/');await expect(page.getByRole('button',{name:'소리 없이 시작',exact:true})).toBeVisible();expect((await page.evaluate(()=>window.__chordProbe.snapshot())).contexts).toBe(0);
  await click('소리 없이 시작');await click('작업대 열기');await click('수리 확인');await expect(page.getByTestId('workbench')).toBeVisible();await page.getByTestId('note-slot-1').click();await click('큰 음 버튼');await page.getByTestId('note-input-64').tap();await click('소리 켜기');await click('현재 화음 듣기');await expect.poll(()=>page.evaluate(()=>window.__chordProbe.snapshot().scheduledVoices)).toBeGreaterThanOrEqual(3);await click('재생 정지');
  await click('수리 확인');await expect(page.locator('.reflection-options button')).toHaveCount(3);await click('건너뛰기');await click('수리 마치기');
  for(let index=1;index<8;index++){await click('다음 주문');await click('작업대 열기');await click('도움 3 · 시범');await click('시범 상태로 연습');await click('수리 확인');await click('건너뛰기');await click('수리 마치기');}
  await expect(page.getByTestId('storage-status')).toContainText('저장했어요');await page.reload();await click('진열과 합주');await expect(page.locator('.collection-screen')).toContainText('수리 완료 8 / 8');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/repair-route-check');await page.reload();await click('진열과 합주');await expect(page.locator('.collection-screen')).toContainText('수리 완료 8 / 8');report.spaRouteReload='PASS';
  await page.screenshot({path:screenshotPath,fullPage:true});report.probe=await page.evaluate(()=>window.__chordProbe.snapshot());expect(report.probe.violations).toEqual([]);expect(errors).toEqual([]);report.pageErrors=errors;report.externalRequests=requests.filter(request=>new URL(request).origin!==new URL(url).origin);expect(report.externalRequests).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{report.endedAt=new Date().toISOString();writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,url:report.finalUrl,releaseId:report.deployed?.releaseId,commit:report.deployed?.gitCommit,files:report.files.length,error:report.error},null,2));await browser?.close();}
