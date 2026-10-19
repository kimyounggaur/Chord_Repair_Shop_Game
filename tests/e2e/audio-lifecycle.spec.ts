import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

type Diagnostics={phase:string;generation:number;musicalVoices:number;peakVoices:number;contextCreations:number;scheduledEvents:number;pendingRequests:number;listenerBindings:number;currentTime:number;contextState:string;muted:boolean;volume:number;transport:{mode:string|null;activeGeneration:number|null;timerCount:number;pending:boolean}};
type Observation={label:string;diagnostics:Diagnostics};

async function openApp(page:Page){
  // The product has no WebSocket feature. Isolate this run from concurrent Vite HMR
  // reloads without replacing application code or suppressing browser page errors.
  await page.routeWebSocket('**/*',socket=>socket.close());
  await page.goto('/');
}

async function diagnostics(page:Page):Promise<Diagnostics>{
  return page.evaluate(async()=>{
    // Vite may put ?t=... on imports after concurrent edits. Reuse the exact URL
    // that the App loaded so a second diagnostic-only singleton is never created.
    const runtimeResource=performance.getEntriesByType('resource').find(entry=>new URL(entry.name).pathname==='/src/app/runtime.tsx');
    if(!runtimeResource)throw new Error('The application runtime module was not loaded');
    const {audioService,audioTransport}=await import(/* @vite-ignore */ runtimeResource.name);
    return {...audioService.getDiagnostics(),transport:audioTransport.getDiagnostics()};
  });
}

async function record(testInfo:TestInfo,name:string,browserVersion:string,observations:Observation[],extra:Record<string,unknown>={}){
  const file=join(process.cwd(),'docs','evidence',`S06-browser-${testInfo.project.name}-${name}.json`);
  mkdirSync(join(process.cwd(),'docs','evidence'),{recursive:true});
  writeFileSync(file,JSON.stringify({recordedAt:new Date().toISOString(),test:testInfo.title,
    browserVersion,project:testInfo.project.name,node:process.version,
    verification:'Actual application UI with native browser AudioContext. Lifecycle events are synthetic automation. No physical listening, iOS/Android device, phone interruption, Bluetooth or acoustic latency result is implied.',
    observations,...extra},null,2)+'\n','utf8');
  await testInfo.attach(name,{path:file,contentType:'application/json'});
}

async function start(page:Page){
  await openApp(page);
  await page.getByRole('button',{name:/소리 켜고 시작/}).click();
  await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
  await expect.poll(async()=>(await diagnostics(page)).contextState).toBe('running');
}

async function compare(page:Page){
  const before=await diagnostics(page);
  await page.getByRole('button',{name:'전후 비교',exact:true}).click();
  await expect.poll(async()=>(await diagnostics(page)).scheduledEvents).toBeGreaterThan(before.scheduledEvents);
  const playing=await diagnostics(page);
  expect(playing.transport.mode).toBe('compare');
  expect(playing.transport.activeGeneration).toBe(playing.generation);
  return playing;
}

async function idle(page:Page){
  await expect.poll(async()=>(await diagnostics(page)).musicalVoices,{intervals:[10,25,50]}).toBe(0);
  const snapshot=await diagnostics(page);
  expect(snapshot.pendingRequests).toBe(0);
  expect(snapshot.transport).toMatchObject({mode:null,timerCount:0,pending:false});
  return snapshot;
}

async function staysQuiet(page:Page,seconds=2.6){
  const stopped=await idle(page);
  // Observe beyond the stale comparison's 2.40-second completion boundary.
  await page.waitForTimeout(seconds*1000);
  const later=await diagnostics(page);
  expect(later.musicalVoices).toBe(0);
  expect(later.scheduledEvents).toBe(stopped.scheduledEvents);
  expect(later.contextCreations).toBe(stopped.contextCreations);
  return later;
}

test('@native-audio S06 actual UI stays locked until a gesture and silent start creates no context',async({page,browser},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await openApp(page);
  const initial=await diagnostics(page);
  expect(initial).toMatchObject({contextCreations:0,musicalVoices:0,scheduledEvents:0,phase:'locked'});
  await page.getByRole('button',{name:'소리 없이 시작',exact:true}).click();
  await page.getByRole('button',{name:'작업대 열기',exact:true}).click();
  await expect(page.getByRole('button',{name:'전후 비교',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'재생 정지',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'재생 정지',exact:true}).click();
  const silent=await diagnostics(page);
  expect(silent).toMatchObject({contextCreations:0,musicalVoices:0,scheduledEvents:0});
  await page.getByRole('button',{name:'소리 켜기',exact:true}).click();
  await expect.poll(async()=>(await diagnostics(page)).contextState).toBe('running');
  const enabled=await diagnostics(page);
  expect(enabled).toMatchObject({contextCreations:1,musicalVoices:0,scheduledEvents:0});
  await expect(page.getByRole('button',{name:'전후 비교',exact:true})).toBeEnabled();
  expect(errors).toEqual([]);
  await record(testInfo,'unlock',browser.version(),[{label:'initial',diagnostics:initial},{label:'silent-start',diagnostics:silent},{label:'enabled-by-click',diagnostics:enabled}],{pageErrors:errors});
});

test('@native-audio S06 original current comparison and arpeggio buttons schedule native audio',async({page,browser},testInfo)=>{
  await start(page);
  const observations:Observation[]=[];
  for(const name of ['원래 화음 듣기','현재 화음 듣기','전후 비교','한 음씩']){
    const before=await diagnostics(page);
    await page.getByRole('button',{name,exact:true}).click();
    await expect.poll(async()=>(await diagnostics(page)).scheduledEvents).toBeGreaterThan(before.scheduledEvents);
    const playing=await diagnostics(page);
    expect(playing.contextState).toBe('running');
    expect(playing.contextCreations).toBe(1);
    expect(playing.musicalVoices).toBeGreaterThan(0);
    expect(playing.peakVoices).toBeLessThanOrEqual(24);
    observations.push({label:name,diagnostics:playing});
    await page.getByRole('button',{name:'재생 정지',exact:true}).click();
    observations.push({label:`${name}:stopped`,diagnostics:await idle(page)});
  }
  await record(testInfo,'controls',browser.version(),observations);
});

test('@native-audio S06 editing a live comparison invalidates its old generation and future chord',async({page,browser},testInfo)=>{
  await start(page);
  await page.getByTestId('note-slot-1').click();
  await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
  const playing=await compare(page);
  // Keyboard activates the actual edit without adding a pointer preview request.
  await page.getByTestId('note-input-64').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('workbench')).toHaveAttribute('data-revision','1');
  await expect(page.getByTestId('note-slot-1')).toContainText('E4');
  const stopped=await idle(page);
  expect(stopped.generation).toBeGreaterThan(playing.generation);
  const later=await staysQuiet(page);
  await record(testInfo,'edit-cancellation',browser.version(),[{label:'comparison',diagnostics:playing},{label:'after-edit',diagnostics:stopped},{label:'past-stale-comparison-end',diagnostics:later}]);
});

test('@native-audio S06 undo reset and order-list navigation cancel ongoing comparison',async({page,browser},testInfo)=>{
  await start(page);
  const observations:Observation[]=[];
  const edit=async()=>{
    await page.getByTestId('note-slot-1').click();
    await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
    await page.getByTestId('note-input-64').focus();await page.keyboard.press('Enter');
  };
  await edit();
  let playing=await compare(page);
  await page.getByRole('button',{name:'되돌리기',exact:true}).click();
  let stopped=await idle(page);expect(stopped.generation).toBeGreaterThan(playing.generation);
  await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');
  observations.push({label:'undo',diagnostics:await staysQuiet(page)});
  await edit();
  playing=await compare(page);
  await page.getByRole('button',{name:'원래대로',exact:true}).click();
  await page.getByRole('button',{name:'시작 음으로 되돌리기',exact:true}).click();
  stopped=await idle(page);expect(stopped.generation).toBeGreaterThan(playing.generation);
  await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');
  observations.push({label:'reset',diagnostics:await staysQuiet(page)});
  playing=await compare(page);
  await page.getByRole('button',{name:'주문 목록',exact:true}).click();
  stopped=await idle(page);expect(stopped.generation).toBeGreaterThan(playing.generation);
  await expect(page.getByRole('heading',{name:'기다리고 있는 작은 소리들'})).toBeVisible();
  observations.push({label:'order-list-navigation',diagnostics:await staysQuiet(page)});
  await record(testInfo,'navigation-cancellation',browser.version(),observations);
});

test('@native-audio S06 ten rapid comparison clicks retain one context and bounded voices then stop',async({page,browser},testInfo)=>{
  await start(page);
  const observations:Observation[]=[];
  let generation=(await diagnostics(page)).generation;
  for(let index=0;index<10;index++){
    const playing=await compare(page);
    expect(playing.generation).toBeGreaterThan(generation);generation=playing.generation;
    expect(playing.contextCreations).toBe(1);
    expect(playing.musicalVoices).toBeLessThanOrEqual(24);
    expect(playing.peakVoices).toBeLessThanOrEqual(24);
    observations.push({label:`compare-${index+1}`,diagnostics:playing});
  }
  await page.getByRole('button',{name:'재생 정지',exact:true}).click();
  await page.getByRole('button',{name:'재생 정지',exact:true}).click();
  observations.push({label:'stopped-through-old-completion',diagnostics:await staysQuiet(page)});
  await record(testInfo,'rapid-compare-stop',browser.version(),observations);
});

test('@native-audio S06 pointer cancel and window blur release preview without committing the note',async({page,browser},testInfo)=>{
  await start(page);
  await page.getByTestId('note-slot-1').click();
  await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
  const observations:Observation[]=[];
  for(const cancellation of ['pointercancel','blur']){
    const note=page.getByTestId('note-input-64');
    const before=await diagnostics(page);
    await note.dispatchEvent('pointerdown',{pointerId:1,clientX:20,clientY:20,pointerType:'touch',isPrimary:true});
    await expect.poll(async()=>(await diagnostics(page)).scheduledEvents).toBeGreaterThan(before.scheduledEvents);
    if(cancellation==='pointercancel')await note.dispatchEvent('pointercancel',{pointerId:1,pointerType:'touch'});
    else await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    observations.push({label:cancellation,diagnostics:await idle(page)});
    await expect(page.getByTestId('workbench')).toHaveAttribute('data-revision','0');
    await expect(page.getByTestId('note-slot-1')).toContainText('E♭4');
  }
  await record(testInfo,'preview-cancellation',browser.version(),observations,{eventSource:'Synthetic pointer and blur events exercise actual UI handlers; not native touchscreen evidence.'});
});

test('@native-audio S06 pagehide pageshow stop and suspend without automatic return playback',async({page,browser},testInfo)=>{
  await start(page);
  const playing=await compare(page);
  await expect.poll(async()=>(await diagnostics(page)).currentTime,{intervals:[10,25]}).toBeGreaterThan(playing.currentTime+.15);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  await expect.poll(async()=>(await diagnostics(page)).contextState).toBe('suspended');
  const hidden=await idle(page);
  expect(hidden.generation).toBeGreaterThan(playing.generation);
  expect(hidden.phase).toBe('paused');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  const returned=await staysQuiet(page);
  expect(returned.contextState).toBe('suspended');
  expect(returned.phase).toBe('paused');
  await expect(page.getByText('작업은 그대로예요. 다시 듣기를 누르면 재생돼요.',{exact:true}).first()).toBeVisible();
  const resumed=await compare(page);
  expect(resumed.contextState).toBe('running');expect(resumed.contextCreations).toBe(1);
  await page.getByRole('button',{name:'재생 정지',exact:true}).click();
  await idle(page);
  await record(testInfo,'page-lifecycle',browser.version(),[{label:'playing',diagnostics:playing},{label:'pagehide',diagnostics:hidden},{label:'pageshow-no-autoplay',diagnostics:returned},{label:'explicit-restart',diagnostics:resumed}]);
});

test('@native-audio S06 simulated visibility hidden and visible keep edits and wait for a new gesture',async({page,browser},testInfo)=>{
  await start(page);
  await page.getByTestId('note-slot-1').click();
  await page.getByRole('button',{name:'큰 음 버튼',exact:true}).click();
  await page.getByTestId('note-input-64').focus();await page.keyboard.press('Enter');
  const playing=await compare(page);
  await expect.poll(async()=>(await diagnostics(page)).currentTime,{intervals:[10,25]}).toBeGreaterThan(playing.currentTime+.15);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async()=>(await diagnostics(page)).contextState).toBe('suspended');
  const hidden=await idle(page);expect(hidden.phase).toBe('paused');
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const returned=await staysQuiet(page);expect(returned.contextState).toBe('suspended');
  await expect(page.getByTestId('workbench')).toHaveAttribute('data-revision','1');
  await expect(page.getByTestId('note-slot-1')).toContainText('E4');
  await expect(page.getByText('작업은 그대로예요. 다시 듣기를 누르면 재생돼요.',{exact:true}).first()).toBeVisible();
  const resumed=await compare(page);expect(resumed.contextState).toBe('running');
  await page.getByRole('button',{name:'재생 정지',exact:true}).click();await idle(page);
  await record(testInfo,'visibility',browser.version(),[{label:'playing-edited-snapshot',diagnostics:playing},{label:'hidden',diagnostics:hidden},{label:'visible-no-autoplay',diagnostics:returned},{label:'explicit-restart',diagnostics:resumed}],{eventSource:'document.hidden/visibilityState getters overridden for synthetic lifecycle coverage; real device backgrounding not performed.'});
});
