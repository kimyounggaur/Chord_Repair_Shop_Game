import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {Order} from '../../src/content/types';
const musicalText=(text:string)=>text.replace(/([A-G])b/g,'$1♭').replace(/([A-G])#/g,'$1♯');
const orders=JSON.parse(readFileSync('src/content/orders.v1.json','utf8')) as Order[];
test('all eight original orders: wrong submission, direct repair, question and reward',async({page})=>{
  test.setTimeout(90000);await page.goto('/');await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();
  for(const [index,order] of orders.entries()){
    await expect(page.getByRole('heading',{name:order.title,exact:true})).toBeVisible();await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
    await expect(page.getByTestId('hint-panel')).toHaveCount(0);await expect(page.getByTestId('relationship-explanation')).toHaveCount(0);
    if(index>=4)await expect(page.locator('.slot-role')).toHaveText(['음 조각','음 조각','음 조각']);
    await page.getByRole('button',{name:'수리 확인',exact:true}).click();await expect(page.getByTestId('repair-feedback')).toBeVisible();
    for(const slot of order.editableSlots){if(order.initialMidi[slot]===order.targetMidi[slot])continue;await page.getByTestId(`note-slot-${slot}`).click();await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();await page.getByTestId(`note-input-${order.targetMidi[slot]}`).click();}
    await page.getByRole('button',{name:'수리 확인',exact:true}).click();await expect(page.getByRole('heading',{name:musicalText(order.reflection.prompt),exact:true})).toBeVisible();await expect(page.getByTestId('relationship-explanation')).toHaveCount(0);
    if(index===1)await page.getByRole('button',{name:'건너뛰기',exact:true}).click();else if(index===2)await page.getByRole('button',{name:'해설 먼저 보기',exact:true}).click();else await page.getByRole('button',{name:musicalText(order.reflection.options[index===3?0:order.reflection.answerIndex]),exact:true}).click();
    await expect(page.getByTestId('relationship-explanation')).toBeVisible();if(index===6)await expect(page.getByTestId('relationship-explanation')).toContainText('6반음에서 7반음');if(index===7)await expect(page.getByTestId('relationship-explanation')).toContainText('근음이 E에서 F');
    await page.getByRole('button',{name:'수리 마치기',exact:true}).click();await expect(page.getByRole('region',{name:'이번 연습 기록'})).toContainText('다시 살펴봄');
    if(index<7)await page.getByRole('button',{name:'다음 주문',exact:true}).click();
  }
  await page.getByRole('button',{name:'주문 목록으로',exact:true}).click();await expect(page.getByTestId('course-progress')).toContainText('수리 완료 8 / 8');for(const order of orders)await expect(page.getByTestId(`order-${order.id}`)).toBeEnabled();
});
test('hint distance tool, demonstration return and tutorial exposure use explicit actions',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
  await page.getByRole('button',{name:'도움 2 · 거리',exact:true}).click();await expect(page.getByTestId('hint-panel')).toContainText('음점 5개 사이, 간격 4개');await page.getByRole('combobox',{name:'도착 음'}).selectOption('67');await expect(page.getByTestId('workbench')).toHaveAttribute('data-revision','0');
  await page.getByRole('button',{name:'도움 3 · 시범',exact:true}).click();await expect(page.getByTestId('note-slot-1')).toContainText('E4');await expect(page.getByRole('button',{name:'수리 확인',exact:true})).toBeDisabled();await page.getByRole('button',{name:'내 상태로 돌아가기',exact:true}).click();await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');
  await page.getByRole('button',{name:'처음 안내 다시 보기'}).click();for(let i=0;i<4;i++)await page.getByRole('button',{name:'다음 안내'}).click();await expect(page.getByTestId('tutorial')).toContainText('C와 G는 그대로');await page.getByRole('button',{name:'안내 건너뛰기'}).click();await expect(page.getByTestId('tutorial')).toHaveCount(0);
});
