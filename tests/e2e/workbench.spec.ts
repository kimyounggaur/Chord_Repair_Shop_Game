import {test,expect,type Page} from '@playwright/test';

async function start(page:Page,pads=true){
  await page.goto('/');
  await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();
  await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
  await page.getByTestId('note-slot-1').click();
  if(pads)await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
}
const pitch=(page:Page,midi:number)=>page.getByTestId(`note-input-${midi}`);
const revision=(page:Page)=>page.getByTestId('workbench');

test('silent CR01 wrong, repair, unrevealed question, and completion',async({page})=>{
  await start(page);
  await pitch(page,62).click();
  await page.getByRole('button',{name:'수리 확인',exact:true}).click();
  await expect(page.getByTestId('repair-feedback')).toContainText('다시');
  await page.getByTestId('note-slot-1').click();
  await pitch(page,64).click();
  await page.getByRole('button',{name:'수리 확인',exact:true}).click();
  await expect(page.getByRole('heading',{name:'바뀌지 않은 두 음은?'})).toBeVisible();
  await expect(page.getByTestId('relationship-explanation')).toHaveCount(0);
  await page.getByRole('button',{name:'C와 G',exact:true}).click();
  await expect(page.getByTestId('relationship-explanation')).toContainText('4반음');
  await page.getByRole('button',{name:'수리 마치기',exact:true}).click();
  await expect(page.getByRole('heading',{name:'첫 번째 수리, 완료!'})).toBeVisible();
});

test('current focus, locked slots, same MIDI, undo, reset cancel and confirm',async({page})=>{
  await start(page,false);
  await expect(pitch(page,63)).toBeFocused();
  await expect(page.getByTestId('note-slot-0')).toHaveAttribute('aria-disabled','true');
  await page.getByTestId('note-slot-0').click({force:true});
  await expect(revision(page)).toHaveAttribute('data-revision','0');
  await pitch(page,64).click();
  await pitch(page,64).click();
  await expect(revision(page)).toHaveAttribute('data-revision','1');
  await page.getByRole('button',{name:'되돌리기',exact:true}).click();
  await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');
  await page.getByTestId('note-slot-1').click();
  await pitch(page,64).click();
  await page.getByRole('button',{name:'원래대로',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('이 주문의 현재 음만');
  await page.getByRole('button',{name:'계속 고치기',exact:true}).click();
  await expect(page.getByTestId('note-slot-1')).toContainText('E4');
  await page.getByRole('button',{name:'원래대로',exact:true}).click();
  await page.getByRole('button',{name:'시작 음으로 되돌리기',exact:true}).click();
  await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');
});

test('piano and pads share input, roving keys, Enter Space and Escape',async({page})=>{
  await start(page,false);
  await expect(page.locator('.note-input button[tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect(pitch(page,64)).toBeFocused();
  await expect(revision(page)).toHaveAttribute('data-revision','0');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('note-slot-1')).toContainText('E4');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('note-slot-1')).toBeFocused();
  await expect(page.locator('.note-input')).toHaveCount(0);
  await page.getByTestId('note-slot-1').click();
  await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
  await pitch(page,64).click();
  await expect(page.getByTestId('note-slot-1')).toContainText('E4');
});

test('canceled pointers, scroll and multitouch never commit a note',async({page})=>{
  await start(page);
  const key=pitch(page,64);
  for(const cancellation of ['pointercancel','lostpointercapture','scroll','pointermove','multitouch']){
    await key.dispatchEvent('pointerdown',{pointerId:1,clientX:20,clientY:20,pointerType:'touch',isPrimary:true});
    if(cancellation==='scroll')await page.locator('.note-input').dispatchEvent('scroll');
    else if(cancellation==='multitouch')await key.dispatchEvent('pointerdown',{pointerId:2,clientX:25,clientY:25,pointerType:'touch',isPrimary:false});
    else await key.dispatchEvent(cancellation,{pointerId:1,clientX:60,clientY:80,pointerType:'touch'});
    await key.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch'});
    await key.dispatchEvent('click',{detail:1});
    await expect(revision(page)).toHaveAttribute('data-revision','0');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  }
  await key.click();
  await expect(revision(page)).toHaveAttribute('data-revision','1');
});

test('native touch release commits once after implicit capture release',async({browser,browserName})=>{
  // Firefox supports touch emulation but Playwright does not offer isMobile there.
  const context=await browser.newContext({hasTouch:true,isMobile:browserName!=='firefox',viewport:{width:390,height:844},baseURL:process.env.BASE_URL??'http://127.0.0.1:5486'});
  const page=await context.newPage();await start(page);
  await pitch(page,64).tap();
  await expect(revision(page)).toHaveAttribute('data-revision','1');
  await pitch(page,64).tap();
  await expect(revision(page)).toHaveAttribute('data-revision','1');
  await expect(page.getByTestId('note-slot-1')).toContainText('E4');
  await context.close();
});

for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
  test(`layout ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);await start(page);
    const key=await pitch(page,64).boundingBox();expect(key?.width).toBeGreaterThanOrEqual(48);expect(key?.height).toBeGreaterThanOrEqual(48);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.getByRole('button',{name:'수리 확인',exact:true}).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button',{name:'수리 확인',exact:true})).toBeInViewport();
    await pitch(page,64).scrollIntoViewIfNeeded();
    const center=await pitch(page,64).boundingBox();
    expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.getAttribute('data-testid'),{x:center!.x+center!.width/2,y:center!.y+center!.height/2})).toBe('note-input-64');
    await page.evaluate(()=>window.scrollTo(0,0));
    await expect(page.locator('.skip-link')).not.toBeInViewport();
    await page.screenshot({path:`output/playwright/S04-${viewport.width}x${viewport.height}.png`,fullPage:true});
  });
}

test('200 percent layout and 56px piano keys remain usable',async({page})=>{
  await page.setViewportSize({width:780,height:844});await start(page,false);
  await page.evaluate(()=>{document.documentElement.style.zoom='2';});
  await expect(page.locator('.piano-key.white').first()).toHaveCSS('width','56px');
  await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await pitch(page,64).click();
  await page.getByRole('button',{name:'수리 확인',exact:true}).click();
  await expect(page.getByRole('heading',{name:'바뀌지 않은 두 음은?'})).toBeVisible();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'output/playwright/S04-zoom200.png',fullPage:true});
});
