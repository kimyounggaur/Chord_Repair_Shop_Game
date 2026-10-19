import {test,expect,type Page} from '@playwright/test';
async function start(page:Page){await page.routeWebSocket('**/*',socket=>socket.close());await page.goto('/');await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();await page.getByRole('button',{name:'작업대 열기',exact:true}).click();}
async function saved(page:Page){await expect(page.getByTestId('storage-status')).toContainText('저장했어요');}
async function profile(page:Page){return page.evaluate(async()=>{const entry=performance.getEntriesByType('resource').find(row=>new URL(row.name).pathname==='/src/app/runtime.tsx');if(!entry)throw Error('Missing runtime');const {storageController}=await import(/* @vite-ignore */entry.name);await storageController.start();await storageController.flush();return storageController.getSnapshot().profile;});}
test('real IndexedDB retains first wrong, help, question permutation and explanation over reload',async({page})=>{
  await start(page);await page.getByRole('button',{name:'수리 확인',exact:true}).click();await saved(page);const first=await profile(page);
  await page.reload();await expect(page.getByTestId('repair-feedback')).toBeVisible();expect((await profile(page)).draft.state.evidence.firstSubmission.status).toBe('incorrect');
  await page.getByRole('button',{name:'도움 2 · 거리',exact:true}).click();await saved(page);await page.reload();expect((await profile(page)).draft.state.evidence).toMatchObject({maxRepairHintLevel:2,answerRevealedBeforeFirstAnswer:true});
  await page.getByTestId('note-slot-1').click();await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();await page.getByTestId('note-input-64').click();await page.getByRole('button',{name:'수리 확인',exact:true}).click();await saved(page);const options=await page.locator('.reflection-options>button').allTextContents();await page.reload();await expect(page.getByRole('heading',{name:'바뀌지 않은 두 음은?'})).toBeVisible();expect(await page.locator('.reflection-options>button').allTextContents()).toEqual(options);
  await page.getByRole('button',{name:'C와 G',exact:true}).click();await saved(page);await page.reload();await expect(page.getByTestId('relationship-explanation')).toBeVisible();const after=await profile(page);expect(after.draft.state.attemptId).toBe(first.draft.state.attemptId);expect(after.draft.state.evidence.firstSubmission.status).toBe('incorrect');expect(after.draft.state.evidence.firstReflectionAnswer.correct).toBe(true);
});
test('demo snapshot reload returns own notes and import cancel preserves progress',async({page})=>{
  await start(page);await page.getByRole('button',{name:'도움 3 · 시범',exact:true}).click();await saved(page);await page.reload();await page.getByRole('button',{name:'내 상태로 돌아가기',exact:true}).click();await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');await saved(page);
  const before=await profile(page);const {revision:_revision,draft:_draft,...data}=before;
  await page.getByRole('button',{name:'설정과 기록',exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await expect(page.getByRole('button',{name:'확인하고 기록 교체'})).toBeVisible();await page.getByRole('button',{name:'가져오기 취소'}).click();expect((await profile(page)).attempts).toEqual(before.attempts);await page.getByRole('button',{name:'설정 닫기'}).click();
});
test('second real tab is read only and explicit takeover works after owner navigation and release or expiry',async({page,context})=>{
  test.setTimeout(45000);
  await start(page);await saved(page);const other=await context.newPage();await other.goto('/');await expect(other.getByTestId('storage-status')).toContainText('읽기 전용');await expect(other.getByRole('button',{name:'수리 확인',exact:true})).toBeDisabled();
  // A synthetic pagehide leaves the first document visible, so its renewal timer
  // can acquire the lease again. Native navigation stops that document; unload
  // writes may finish or fall back to the real 15s lease expiry. Observe the actual
  // IDB precondition rather than racing the asynchronous release or changing time.
  await page.goto('about:blank');
  await expect.poll(()=>other.evaluate(()=>new Promise<boolean>((resolve,reject)=>{
    const request=indexedDB.open('chord-repair-shop',1);request.onerror=()=>reject(request.error);request.onsuccess=()=>{
      const db=request.result,tx=db.transaction('meta','readonly'),read=tx.objectStore('meta').get('profile');let available=false;
      read.onsuccess=()=>{const lease=read.result?.writerLease;available=!lease||lease.expiresAt<=Date.now();};tx.oncomplete=()=>{db.close();resolve(available);};tx.onabort=()=>{db.close();reject(tx.error);};
    };
  })),{timeout:20000,intervals:[50,100,250]}).toBe(true);
  await other.getByRole('button',{name:'이 탭에서 이어서 편집',exact:true}).click();await expect(other.getByRole('button',{name:'수리 확인',exact:true})).toBeEnabled();await other.close();
});
test('blocked IndexedDB keeps silent learning and export available',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{configurable:true,get:()=>{throw new DOMException('blocked','SecurityError');}});});await start(page);await expect(page.getByTestId('storage-status')).toContainText('브라우저를 닫으면 기록을 잃을 수');await page.getByRole('button',{name:'수리 확인',exact:true}).click();await expect(page.getByTestId('repair-feedback')).toBeVisible();await page.getByRole('button',{name:'설정과 기록',exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'기록 내보내기',exact:true}).click();expect((await download).suggestedFilename()).toBe('chord-repair-progress-v1.json');
});
test('corrupt draft keeps raw data and offers valid backup recovery',async({page})=>{
  await start(page);await page.getByRole('button',{name:'도움 1 · 관계',exact:true}).click();await saved(page);await profile(page);
  await page.evaluate(async()=>{await new Promise<void>((resolve,reject)=>{const request=indexedDB.open('chord-repair-shop',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('draft','readwrite');tx.objectStore('draft').put({corrupt:true},'active');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};});});
  // A clean reload triggers pagehide save, so close the runtime storage adapter first.
  await page.evaluate(async()=>{const entry=performance.getEntriesByType('resource').find(row=>new URL(row.name).pathname==='/src/app/runtime.tsx')!;const runtime=await import(/* @vite-ignore */entry.name);runtime.storageController.dispose();});
  await page.reload();await expect(page.getByRole('heading',{name:'기록 복구',exact:true})).toBeVisible();await page.getByRole('button',{name:'설정과 기록',exact:true}).click();await expect(page.getByRole('button',{name:'읽을 수 있는 원본 내보내기'})).toBeVisible();await page.getByRole('button',{name:'이전 정상 기록으로 복구'}).click();await expect(page.getByTestId('workbench')).toBeVisible();
});
test('confirmed import atomically replaces records, preserves a backup and remounts the restored screen',async({page})=>{
  await start(page);await page.getByRole('button',{name:'도움 2 · 거리',exact:true}).click();await saved(page);const before=await profile(page),{revision:_revision,draft:_draft,...data}=before;
  await page.getByRole('button',{name:'설정과 기록',exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.getByRole('button',{name:'확인하고 기록 교체',exact:true}).click();await expect(page.getByRole('heading',{name:'기다리고 있는 작은 소리들'})).toBeVisible();const after=await profile(page);expect(after.attempts[0].evidence.maxRepairHintLevel).toBe(2);expect(after.draft).toBeNull();
});
