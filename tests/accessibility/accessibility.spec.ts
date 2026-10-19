import {test,expect,type Page,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import type {Order} from '../../src/content/types';
const orders=JSON.parse(readFileSync('src/content/orders.v1.json','utf8')) as Order[];
async function keyActivate(page:Page,target:Locator){for(let i=0;i<150;i++){if(await target.evaluate(element=>element===document.activeElement)){await page.keyboard.press('Enter');return;}await page.keyboard.press('Tab');}throw Error('Target unreachable by keyboard');}
async function axe(page:Page,name:string){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa']).analyze();writeFileSync(`docs/evidence/S09-axe-${test.info().project.name}-${name}.json`,JSON.stringify(result.violations,null,2));expect(result.violations).toEqual([]);}
test('keyboard alone repairs all eight orders and preserves question-first flow',async({page})=>{
  test.setTimeout(120000);await page.goto('/');await keyActivate(page,page.getByRole('button',{name:'소리 없이 시작',exact:true}));
  for(const [index,order] of orders.entries()){
    await keyActivate(page,page.getByRole('button',{name:'작업대 열기',exact:true}));
    for(const slot of order.editableSlots){if(order.initialMidi[slot]===order.targetMidi[slot])continue;await keyActivate(page,page.getByTestId(`note-slot-${slot}`));await expect(page.getByTestId(`note-input-${order.initialMidi[slot]}`)).toBeFocused();const difference=order.targetMidi[slot]-order.initialMidi[slot];for(let step=0;step<Math.abs(difference);step++)await page.keyboard.press(difference>0?'ArrowRight':'ArrowLeft');await page.keyboard.press('Space');await page.keyboard.press('Escape');await expect(page.getByTestId(`note-slot-${slot}`)).toBeFocused();}
    await keyActivate(page,page.getByRole('button',{name:'수리 확인',exact:true}));await expect(page.getByTestId('relationship-explanation')).toHaveCount(0);await keyActivate(page,page.getByRole('button',{name:'건너뛰기',exact:true}));await keyActivate(page,page.getByRole('button',{name:'수리 마치기',exact:true}));if(index<7)await keyActivate(page,page.getByRole('button',{name:'다음 주문',exact:true}));
  }await keyActivate(page,page.getByRole('button',{name:'주문 목록으로',exact:true}));await expect(page.getByTestId('course-progress')).toContainText('8 / 8');
});
test('axe home, workbench, question, settings; modal keyboard escape and return',async({page})=>{
  await page.goto('/');await expect(page.getByRole('button',{name:'소리 없이 시작',exact:true})).toBeVisible();await axe(page,'home');await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();await page.getByRole('button',{name:'작업대 열기',exact:true}).click();await page.getByTestId('note-slot-1').click();await axe(page,'workbench');
  await expect(page.getByTestId('note-input-63')).toHaveAccessibleName(/E 플랫 4/);await page.getByTestId('note-input-64').focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'수리 확인',exact:true}).click();await axe(page,'question');
  const trigger=page.getByRole('button',{name:'설정과 기록',exact:true});await trigger.click();await axe(page,'settings');for(let i=0;i<20;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog'))).toBe(true);}await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});
for(const layout of [{width:320,height:740,zoom:1},{width:390,height:844,zoom:1},{width:768,height:1024,zoom:1},{width:844,height:390,zoom:1},{width:780,height:844,zoom:2},{width:1280,height:960,zoom:4}]){
  test(`reflow ${layout.width}x${layout.height} CSS zoom ${layout.zoom}`,async({page})=>{
    await page.setViewportSize(layout);await page.goto('/');await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();await page.getByRole('button',{name:'작업대 열기',exact:true}).click();await page.getByTestId('note-slot-1').click();await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();await page.evaluate(zoom=>document.documentElement.style.zoom=String(zoom),layout.zoom);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.getByTestId('note-input-64').click();await page.getByRole('button',{name:'수리 확인',exact:true}).click();await expect(page.getByRole('heading',{name:'바뀌지 않은 두 음은?'})).toBeVisible();
    await page.getByRole('button',{name:'설정과 기록',exact:true}).click();await page.getByRole('button',{name:'설정 닫기',exact:true}).click();await page.screenshot({path:`output/playwright/S09-${test.info().project.name}-${layout.width}-${layout.height}-zoom${layout.zoom}.png`,fullPage:true});
  });
}
test('system reduced motion is initial preference; fixed-do display does not alter evidence',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();await expect(page.locator('[data-reduced-motion]')).toHaveAttribute('data-reduced-motion','true');await page.getByRole('button',{name:'작업대 열기',exact:true}).click();await page.getByRole('button',{name:'설정과 기록',exact:true}).click();await page.getByLabel('음이름 표기').selectOption('solfege');await page.getByRole('button',{name:'설정 닫기',exact:true}).click();await expect(page.getByTestId('note-slot-0')).toContainText('도 C4');await expect(page.getByTestId('workbench')).toHaveAttribute('data-revision','0');
});
