import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

type RenderCase={name:string;midis:number[];sampleRate:number;volume:number;muted?:boolean;timbre?:'reference'|'pluck'|'reed'|'bell'};
type RenderResult=RenderCase&{
  frames:number;finite:boolean;peak:number;peakDbfs:number|null;rms:number;
  leadingPeak:number;tailPeak:number;estimatedHz:number|null;expectedHz:number|null;
  harmonicRatios:number[]|null;endedVoices:number;config:Record<string,unknown>;
};
type Diagnostics=Record<string,unknown>&{phase:string;contextCreations:number;musicalVoices:number};

async function openHarness(page:Page){
  // Keep the real same-origin modules, but avoid app navigation and the Vite HMR client
  // while other staged implementation work edits the application during this suite.
  await page.route('**/__s05_audio_harness__',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>S05 Web Audio verification</title></head><body></body></html>',
  }));
  await page.goto('/__s05_audio_harness__');
}

async function evidence(testInfo:TestInfo,name:string,data:unknown){
  const record={
    recordedAt:new Date().toISOString(),test:testInfo.title,project:testInfo.project.name,
    node:process.version,platform:process.platform,baseURL:testInfo.project.use.baseURL,
    verification:'Automated browser Web Audio only; no human listening, physical device, sound-pressure or speaker latency verification.',
    ...data as Record<string,unknown>,
  };
  const directory=join(process.cwd(),'docs','evidence');
  mkdirSync(directory,{recursive:true});
  const file=join(directory,`S05-offline-${testInfo.project.name}-${name}.json`);
  writeFileSync(file,JSON.stringify(record,null,2)+'\n','utf8');
  await testInfo.attach(`S05-offline-${name}`,{path:file,contentType:'application/json'});
}

async function render(page:Page,cases:RenderCase[]):Promise<RenderResult[]>{
  return page.evaluate(async fixtures=>{
    // These are the exact factories used by the runtime, transformed by Vite.
    // No replica synthesis or mock AudioContext is used in this harness.
    const voiceUrl='/src/audio/create-voice.ts';
    const mixerUrl='/src/audio/mixer.ts';
    const typesUrl='/src/audio/types.ts';
    const {createVoice}=await import(/* @vite-ignore */ voiceUrl);
    const {createMixer}=await import(/* @vite-ignore */ mixerUrl);
    const {REFERENCE_CONFIG,TIMBRE_CONFIGS}=await import(/* @vite-ignore */ typesUrl);
    const results=[];
    for(const fixture of fixtures){
      const context=new OfflineAudioContext(1,Math.ceil(1.2*fixture.sampleRate),fixture.sampleRate);
      const mixer=createMixer(context,fixture.volume);
      let endedVoices=0;let finishEnded:()=>void=()=>undefined;const allEnded=new Promise<void>(resolve=>{finishEnded=resolve;});
      if(fixture.muted)mixer.setMuted(true);
      fixture.midis.forEach((midi,index)=>createVoice(context,{
        id:`${fixture.name}-${index}`,groupId:fixture.name,midi,at:.02,gate:.9,velocity:1,
        priority:'normal',generation:1,timbre:fixture.timbre??'reference',
      },mixer.input,()=>{endedVoices++;if(endedVoices===fixture.midis.length)finishEnded();}));
      const buffer=await context.startRendering();
      // Firefox delivers ended tasks after the rendering promise, unlike Chromium.
      await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Offline ended callbacks did not finish')),1500);void allEnded.then(()=>{clearTimeout(timer);resolve();});});
      const samples=buffer.getChannelData(0);
      let peak=0,sumSquares=0,finite=true,leadingPeak=0,tailPeak=0;
      samples.forEach((sample,index)=>{
        finite=finite&&Number.isFinite(sample);
        peak=Math.max(peak,Math.abs(sample));
        sumSquares+=sample*sample;
        if(index<Math.floor(.019*fixture.sampleRate))leadingPeak=Math.max(leadingPeak,Math.abs(sample));
        if(index>=Math.ceil(1.06*fixture.sampleRate))tailPeak=Math.max(tailPeak,Math.abs(sample));
      });
      let estimatedHz:null|number=null;
      let harmonicRatios:null|number[]=null;
      const expectedHz=fixture.midis.length===1?440*2**((fixture.midis[0]-69)/12):null;
      if(expectedHz!==null&&peak>0){
        // Positive-going zero crossings inside the stable sustain isolate the period.
        const crossings:number[]=[];
        for(let index=Math.ceil(.2*fixture.sampleRate);index<Math.floor(.8*fixture.sampleRate);index++){
          if(samples[index]<=0&&samples[index+1]>0){
            const fraction=-samples[index]/(samples[index+1]-samples[index]);
            crossings.push(index+fraction);
          }
        }
        if(crossings.length>1)estimatedHz=fixture.sampleRate*(crossings.length-1)/(crossings[crossings.length-1]-crossings[0]);
        if(fixture.midis[0]===69){
          // Half a second contains exactly 220 A4 periods, avoiding spectral leakage.
          const first=Math.round(.2*fixture.sampleRate),last=Math.round(.7*fixture.sampleRate);
          const amplitudes=[1,2,3].map(harmonic=>{
            let real=0,imaginary=0;
            for(let index=first;index<last;index++){
              const phase=2*Math.PI*expectedHz*harmonic*index/fixture.sampleRate;
              real+=samples[index]*Math.cos(phase);imaginary+=samples[index]*Math.sin(phase);
            }
            return 2*Math.hypot(real,imaginary)/(last-first);
          });
          harmonicRatios=amplitudes.map(value=>value/amplitudes[0]);
        }
      }
      mixer.dispose();
      results.push({...fixture,frames:samples.length,finite,peak,peakDbfs:peak>0?20*Math.log10(peak):null,
        rms:Math.sqrt(sumSquares/samples.length),leadingPeak,tailPeak,estimatedHz,expectedHz,harmonicRatios,endedVoices,
        config:JSON.parse(JSON.stringify(TIMBRE_CONFIGS[fixture.timbre??'reference']??REFERENCE_CONFIG)) as Record<string,unknown>});
    }
    return results;
  },cases);
}

function assertAudible(result:RenderResult){
  expect(result.finite,result.name).toBe(true);
  expect(result.rms,result.name).toBeGreaterThan(.00001);
  expect(result.peakDbfs,result.name).not.toBeNull();
  expect(result.peakDbfs!,result.name).toBeLessThanOrEqual(-1);
  expect(result.leadingPeak,result.name).toBeLessThan(1e-7);
  expect(result.tailPeak,result.name).toBeLessThan(1e-7);
  expect(result.endedVoices,result.name).toBe(result.midis.length);
  expect(result.config).toMatchObject({version:1,attack:.008,decay:.07,sustain:.55,release:.12,gate:.9,master:.35});
}

test('@native-audio S05 actual offline reference matrix: six chords, 24 voices, two rates and volumes',async({page,browser},testInfo)=>{
  await openHarness(page);
  const chords=[
    {name:'C',midis:[60,64,67]},{name:'Cm',midis:[60,63,67]},
    {name:'F',midis:[65,69,72]},{name:'Fm',midis:[65,68,72]},
    {name:'G',midis:[67,71,74]},{name:'Gm',midis:[67,70,74]},
    // Same-frequency/phase sources are a more conservative peak stress than a spread chord.
    {name:'24-phase-aligned-C4',midis:Array.from({length:24},()=>60)},
  ];
  const fixtures=[44100,48000].flatMap(sampleRate=>[.35,1].flatMap(volume=>chords.map(chord=>({...chord,sampleRate,volume}))));
  const results=await render(page,fixtures);
  await evidence(testInfo,'matrix',{browserVersion:browser.version(),results});
  expect(results).toHaveLength(28);
  results.forEach(assertAudible);
  for(const sampleRate of [44100,48000])for(const chord of chords){
    const low=results.find(result=>result.sampleRate===sampleRate&&result.name===chord.name&&result.volume===.35)!;
    const full=results.find(result=>result.sampleRate===sampleRate&&result.name===chord.name&&result.volume===1)!;
    // Checks that the user master is applied once, with no hidden volume-dependent gain.
    expect(low.rms/full.rms).toBeCloseTo(.35,5);
    expect(low.peak/full.peak).toBeCloseTo(.35,5);
  }
});

test('@native-audio S05 actual offline mute and zero master produce silence',async({page,browser},testInfo)=>{
  await openHarness(page);
  const fixtures=[44100,48000].flatMap(sampleRate=>[
    {name:'zero-master',midis:[60,64,67],sampleRate,volume:0},
    {name:'muted-master',midis:[60,63,67],sampleRate,volume:1,muted:true},
  ]);
  const results=await render(page,fixtures);
  await evidence(testInfo,'silence',{browserVersion:browser.version(),results});
  results.forEach(result=>{
    expect(result.finite,result.name).toBe(true);
    expect(result.peak,result.name).toBeLessThan(1e-7);
    expect(result.rms,result.name).toBeLessThan(1e-7);
    expect(result.endedVoices,result.name).toBe(result.midis.length);
  });
});

test('@native-audio S05 actual offline MIDI 60 to 74 pitch and A4 reference partials',async({page,browser},testInfo)=>{
  await openHarness(page);
  const fixtures=[44100,48000].flatMap(sampleRate=>Array.from({length:15},(_,index)=>({
    name:`midi-${60+index}`,midis:[60+index],sampleRate,volume:1,
  })));
  const results=await render(page,fixtures);
  await evidence(testInfo,'frequencies',{browserVersion:browser.version(),method:'Interpolated positive zero crossings in 0.2–0.8s sustain; A4 partial correlation over 220 complete periods.',results});
  results.forEach(result=>{
    assertAudible(result);
    expect(result.estimatedHz,result.name).not.toBeNull();
    expect(Math.abs(result.estimatedHz!-result.expectedHz!),result.name).toBeLessThan(.05);
    if(result.midis[0]===69){
      expect(result.estimatedHz!).toBeCloseTo(440,2);
      expect(result.harmonicRatios![1]).toBeCloseTo(.18,3);
      expect(result.harmonicRatios![2]).toBeCloseTo(.08,3);
    }
  });
});

async function diagnosticSnapshot(page:Page):Promise<Diagnostics>{
  const harness=page.locator('#s05-audio-harness');
  await harness.dispatchEvent('audio-snapshot');
  return JSON.parse((await harness.getAttribute('data-diagnostics'))!) as Diagnostics;
}

test('@native-audio S05 browser clicks unlock one real context and finite C4 Eb4 E4 G4 previews',async({page,browser},testInfo)=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await openHarness(page);
  await page.evaluate(async()=>{
    const serviceUrl='/src/audio/AudioService.ts';
    const {AudioService}=await import(/* @vite-ignore */ serviceUrl);
    const service=new AudioService();
    const harness=document.createElement('section');
    harness.id='s05-audio-harness';
    harness.setAttribute('aria-label','Automated S05 audio harness');
    const snapshot=()=>{harness.dataset.diagnostics=JSON.stringify(service.getDiagnostics());};
    harness.addEventListener('audio-snapshot',snapshot);
    for(const midi of [60,63,64,67]){
      const button=document.createElement('button');
      button.type='button';button.textContent=`S05 preview ${midi}`;
      button.addEventListener('click',async()=>{
        const enabled=await service.enable();
        harness.dataset.enabled=String(enabled);
        if(enabled)service.previewNote(midi);
        snapshot();
      });
      harness.append(button);
    }
    const stop=document.createElement('button');stop.type='button';stop.textContent='S05 stop';
    stop.addEventListener('click',()=>{service.stopAll();service.stopAll();snapshot();});
    harness.append(stop);
    harness.addEventListener('audio-dispose',()=>{service.dispose();snapshot();});
    document.body.prepend(harness);snapshot();
  });
  const initial=await diagnosticSnapshot(page);
  expect(initial).toMatchObject({phase:'locked',contextCreations:0,musicalVoices:0});
  const observations:{midi:number;playing:Diagnostics;ended:Diagnostics;observedElapsedAudioSeconds:number}[]=[];
  for(const midi of [60,63,64,67]){
    await page.getByRole('button',{name:`S05 preview ${midi}`,exact:true}).click();
    await expect(page.locator('#s05-audio-harness')).toHaveAttribute('data-enabled','true');
    await expect.poll(async()=>(await diagnosticSnapshot(page)).musicalVoices).toBeGreaterThan(0);
    const playing=await diagnosticSnapshot(page);
    expect(playing.contextCreations).toBe(1);
    expect(playing.contextState).toBe('running');
    expect(playing.musicalVoices).toBeLessThanOrEqual(24);
    await expect.poll(async()=>(await diagnosticSnapshot(page)).musicalVoices,{intervals:[10,25,50]}).toBe(0);
    const ended=await diagnosticSnapshot(page);
    expect(ended.phase).toBe('ready');
    observations.push({midi,playing,ended,observedElapsedAudioSeconds:Number(ended.currentTime)-Number(playing.currentTime)});
  }
  await page.getByRole('button',{name:'S05 preview 60',exact:true}).click();
  await expect.poll(async()=>(await diagnosticSnapshot(page)).musicalVoices).toBeGreaterThan(0);
  await page.getByRole('button',{name:'S05 stop',exact:true}).click();
  await expect.poll(async()=>(await diagnosticSnapshot(page)).musicalVoices).toBe(0);
  const afterStop=await diagnosticSnapshot(page);
  await page.locator('#s05-audio-harness').dispatchEvent('audio-dispose');
  const afterDispose=await diagnosticSnapshot(page);
  await evidence(testInfo,'browser-gesture',{browserVersion:browser.version(),initial,observations,afterStop,afterDispose,pageErrors:errors});
  expect(afterStop.contextCreations).toBe(1);
  expect(afterDispose).toMatchObject({musicalVoices:0,listenerBindings:0,contextState:'absent',subscriptions:0});
  expect(errors).toEqual([]);
});


test('@native-audio S11 actual offline pluck reed bell retain exact fundamental and headroom',async({page,browser},testInfo)=>{
  await openHarness(page);
  const fixtures:RenderCase[]=[44100,48000].flatMap(sampleRate=>(['pluck','reed','bell'] as const).flatMap(timbre=>[
    {name:timbre+'-A4',midis:[69],sampleRate,volume:1,timbre},
    {name:timbre+'-24C4',midis:Array.from({length:24},()=>60),sampleRate,volume:1,timbre},
  ]));
  const results=await render(page,fixtures);
  await evidence(testInfo,'S11-timbres',{browserVersion:browser.version(),results});
  for(const result of results){expect(result.finite).toBe(true);expect(result.rms).toBeGreaterThan(.00001);expect(result.peakDbfs!).toBeLessThanOrEqual(-1);expect(result.tailPeak).toBeLessThan(1e-7);expect(result.endedVoices).toBe(result.midis.length);if(result.midis.length===1)expect(Math.abs(result.estimatedHz!-440)).toBeLessThan(.05);}
});
