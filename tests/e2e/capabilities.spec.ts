import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test('actual engine capability and unavailable-audio fallback are explicit',async({page,browser,browserName},testInfo)=>{
  await page.goto('/');const capabilities=await page.evaluate(()=>({audio:typeof AudioContext,offline:typeof OfflineAudioContext,indexedDB:typeof indexedDB}));
  const nativeAvailable=capabilities.audio==='function';
  if(browserName==='webkit'&&process.platform==='win32')expect(nativeAvailable).toBe(false);
  else expect(nativeAvailable).toBe(true);
  writeFileSync(`docs/evidence/S11-capabilities-${testInfo.project.name}.json`,JSON.stringify({browser:browser.version(),host:process.platform,capabilities,nativeAudio:nativeAvailable?'Available; see separate native tests':'NOT RUN: APIs absent. Only unavailable-audio fallback tested.'},null,2)+'\n');
  await page.getByRole('button',{name:/소리 켜고 시작/}).click();await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
  if(!nativeAvailable){await expect(page.getByRole('button',{name:'전후 비교',exact:true})).toBeDisabled();await expect(page.getByText('소리를 준비하지 못했어요. 소리 없이도 계속할 수 있어요.')).toBeVisible();}
  else await expect(page.getByRole('button',{name:'전후 비교',exact:true})).toBeEnabled();
  await page.getByTestId('note-slot-1').click();await page.getByTestId('note-input-64').click();await page.getByRole('button',{name:'수리 확인',exact:true}).click();await page.getByRole('button',{name:'건너뛰기',exact:true}).click();await page.getByRole('button',{name:'수리 마치기',exact:true}).click();await expect(page.getByRole('heading',{name:'첫 번째 수리, 완료!'})).toBeVisible();
});
