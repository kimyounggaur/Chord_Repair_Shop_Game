import {test,expect,type Page} from '@playwright/test';
import type {SessionState} from '../../src/domain/session/types';

type Harness={resolveEnable:(ready:boolean)=>void;setAudio:(phase:SessionState['audio'],message:string)=>void;state:()=>SessionState|null;stopCount:()=>number;unmount:()=>void};
type HarnessWindow=Window&{__uiAudio:Harness};

async function mount(page:Page){
  await page.route('**/__s06_ui_audio__',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>S06 UI lifecycle</title></head><body><div id="root"></div></body></html>'}));
  await page.goto('/__s06_ui_audio__');
  await page.evaluate(async()=>{
    const appUrl='/src/app/App.tsx';const reactUrl='/node_modules/.vite/deps/react.js';const clientUrl='/node_modules/.vite/deps/react-dom_client.js';
    const [{App},{default:React},{default:client}]=await Promise.all([import(/* @vite-ignore */appUrl),import(/* @vite-ignore */reactUrl),import(/* @vite-ignore */clientUrl)]);
    let resolveEnable:(ready:boolean)=>void=()=>undefined;let stopped=0;let current:SessionState|null=null;
    const services={enable:()=>new Promise<boolean>(resolve=>{resolveEnable=resolve;}),previewNote:()=>undefined,playOriginal:()=>undefined,playCurrent:()=>undefined,compare:()=>undefined,arpeggiate:()=>undefined,stopAll:()=>{stopped++;},status:()=> 'locked'};
    const observe=(state:SessionState)=>{current=state;};
    let update:(phase:SessionState['audio'],message:string)=>void=()=>undefined;
    function Host(){const [view,setView]=React.useState({phase:undefined as SessionState['audio']|undefined,message:''});update=(phase,message)=>setView({phase,message});return React.createElement(App,{services,onSessionChange:observe,audioStatus:view.phase,audioMessage:view.message});}
    const root=client.createRoot(document.getElementById('root')!);root.render(React.createElement(Host));
    (window as unknown as HarnessWindow).__uiAudio={resolveEnable:ready=>resolveEnable(ready),setAudio:(phase,message)=>update(phase,message),state:()=>current,stopCount:()=>stopped,unmount:()=>root.unmount()};
  });
  await expect(page.getByRole('button',{name:'소리 켜고 시작',exact:true})).toBeVisible();
}

test('silent choice invalidates a pending enable without late settings change',async({page})=>{
  await mount(page);await page.getByRole('button',{name:'소리 켜고 시작',exact:true}).click();
  await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();
  await page.evaluate(()=>(window as unknown as HarnessWindow).__uiAudio.resolveEnable(true));
  await expect.poll(()=>page.evaluate(()=>(window as unknown as HarnessWindow).__uiAudio.state()?.settings.mute)).toBe(true);
  await expect(page.getByRole('heading',{name:'처음 맡긴 오르골',exact:true})).toBeVisible();
});

for(const cancel of ['navigation','pagehide','unmount'] as const){
  test(`pending enable cannot continue after ${cancel}`,async({page})=>{
    await mount(page);await page.getByRole('button',{name:'소리 켜고 시작',exact:true}).click();
    if(cancel==='navigation')await page.getByRole('button',{name:'화음 수리점 CHORD REPAIR SHOP 시작 화면',exact:true}).click();
    else if(cancel==='pagehide')await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
    else await page.evaluate(()=>(window as unknown as HarnessWindow).__uiAudio.unmount());
    const before=await page.evaluate(()=>JSON.stringify((window as unknown as HarnessWindow).__uiAudio.state()));
    await page.evaluate(async()=>{(window as unknown as HarnessWindow).__uiAudio.resolveEnable(true);await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
    expect(await page.evaluate(()=>JSON.stringify((window as unknown as HarnessWindow).__uiAudio.state()))).toBe(before);
    if(cancel!=='unmount')await expect(page.getByRole('heading',{name:'화음 수리점',exact:true})).toBeVisible();
  });
}

test('external audio state preserves input focus; volume and mute do not change notes or hints',async({page})=>{
  await mount(page);await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();
  await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
  await page.getByTestId('note-slot-1').click();
  await expect(page.getByTestId('note-input-63')).toBeFocused();
  await page.evaluate(()=>(window as unknown as HarnessWindow).__uiAudio.setAudio('paused','작업은 그대로예요. 다시 듣기를 누르면 재생돼요.'));
  await expect(page.getByTestId('audio-state-message')).toContainText('작업은 그대로예요');
  await expect(page.getByTestId('note-input-63')).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as HarnessWindow).__uiAudio.state()?.audio)).toBe('paused');
  const slider=page.getByRole('slider',{name:'음량',exact:true});
  await expect(slider).toHaveAttribute('min','0');await expect(slider).toHaveAttribute('max','1');await expect(slider).toHaveValue('0.35');
  await slider.focus();await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('0.4');
  await page.getByRole('button',{name:'음소거 해제',exact:true}).click();
  await page.evaluate(()=>(window as unknown as HarnessWindow).__uiAudio.resolveEnable(true));
  await page.getByRole('button',{name:'음소거',exact:true}).click();
  const state=await page.evaluate(()=>(window as unknown as HarnessWindow).__uiAudio.state());
  expect(state?.settings).toMatchObject({volume:.4,mute:true});expect(state?.notes).toEqual([60,63,67]);expect(state?.revision).toBe(0);expect(state?.evidence.maxRepairHintLevel).toBe(0);
});
