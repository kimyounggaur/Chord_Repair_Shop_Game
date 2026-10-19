import {describe,it,expect,vi,afterEach} from 'vitest';
import {AudioService} from '../../src/audio/AudioService';
import {REFERENCE_CONFIG,normalizedHarmonics} from '../../src/audio/types';
import {envelopeValueAt} from '../../src/audio/envelope';
import {createVoice} from '../../src/audio/create-voice';
import {createMixer} from '../../src/audio/mixer';
import {midiToFrequency} from '../../src/domain/music/pitch';
import type {NoteEvent} from '../../src/audio/types';
import {FakeAudioContext} from './fake-audio';

const event=(overrides:Partial<NoteEvent>={}):NoteEvent=>({id:'one',groupId:'one',midi:69,at:.05,gate:.9,velocity:1,priority:'normal',generation:0,...overrides});
const setup=()=>{const context=new FakeAudioContext();const createContext=vi.fn(()=>context.asAudioContext());const engine=new AudioService({createContext,isHidden:()=>false});return {context,engine,createContext};};
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
afterEach(()=>vi.useRealTimers());

describe('S05 audio contracts',()=>{
  it('pins the initial synthesis envelope and a single .35 master',()=>{
    expect(REFERENCE_CONFIG).toMatchObject({version:1,attack:.008,decay:.070,sustain:.55,release:.120,gate:.9,master:.35});
    expect(new AudioService().getDiagnostics()).toMatchObject({contextCreations:0,musicalVoices:0,phase:'locked',volume:.35});
  });
  it('normalizes only sub-Nyquist integer harmonics',()=>{
    const partials=normalizedHarmonics(440,48000,[1,.18,.08]);
    expect(partials.reduce((sum,p)=>sum+p.amplitude,0)).toBeCloseTo(1,12);
    expect(normalizedHarmonics(8000,48000,[1,.18,.08]).map(p=>p.frequency)).toEqual([8000,16000]);
  });
  it('models attack, decay, sustain, release and shortened gates',()=>{
    expect(envelopeValueAt(0,0,.9,REFERENCE_CONFIG)).toBe(0);
    expect(envelopeValueAt(.008,0,.9,REFERENCE_CONFIG)).toBe(1);
    expect(envelopeValueAt(.078,0,.9,REFERENCE_CONFIG)).toBeCloseTo(.55);
    expect(envelopeValueAt(1.02,0,.9,REFERENCE_CONFIG)).toBe(0);
    expect(envelopeValueAt(.004,0,.004,REFERENCE_CONFIG)).toBeCloseTo(.5);
    expect(envelopeValueAt(.124,0,.004,REFERENCE_CONFIG)).toBe(0);
  });
  it('uses S01 A4=440 and all 15 input MIDI frequencies',()=>{
    expect(midiToFrequency(69)).toBe(440);
    const context=new FakeAudioContext();for(let midi=60;midi<=74;midi++)createVoice(context.asBaseAudioContext(),event({id:String(midi),midi}),context.destination as unknown as AudioNode);
    expect(context.sources.filter((_,i)=>i%3===0).map(s=>s.frequency.calls[0].value)).toEqual(Array.from({length:15},(_,i)=>440*2**((60+i-69)/12)));
  });
  it.each([-1,NaN,Infinity])('rejects invalid gate %s before creating nodes',gate=>{
    const context=new FakeAudioContext();expect(()=>createVoice(context.asBaseAudioContext(),event({gate}),context.destination as unknown as AudioNode)).toThrow();expect(context.sources).toHaveLength(0);
  });
  it('constructs one lazy context, never during subscribe/StrictMode cleanup/setup',async()=>{
    const {engine,context,createContext}=setup();const listener=vi.fn();const cleanup=engine.subscribe(listener);cleanup();cleanup();engine.subscribe(listener);
    expect(createContext).not.toHaveBeenCalled();await engine.enable();await engine.enable();expect(createContext).toHaveBeenCalledTimes(1);expect(context.listeners.size).toBe(1);expect(engine.getDiagnostics().subscriptions).toBe(1);engine.dispose();expect(context.listeners.size).toBe(0);
  });
  it('treats three harmonic oscillators as one musical voice and cleans every connection',async()=>{
    const {engine,context}=setup();await engine.enable();expect(engine.scheduleGroup([event()])).toBe(true);expect(context.sources).toHaveLength(3);expect(engine.getDiagnostics().musicalVoices).toBe(1);
    context.advance(1.07);expect(engine.getDiagnostics().musicalVoices).toBe(0);expect(context.sources.every(s=>s.disconnects===1)).toBe(true);expect(context.gains.slice(1).every(g=>g.disconnects===1)).toBe(true);
  });
  it('stops future sources before start and remains idempotent',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup([event({at:5})]);engine.stopAll();engine.stopAll();expect(engine.getDiagnostics().musicalVoices).toBe(0);expect(context.sources.every(s=>s.stops.at(-1)===0)).toBe(true);expect(context.sources.every(s=>s.starts.length===1&&s.disconnects===1)).toBe(true);
  });
  it('keeps a shortened fallback cancellation ramp continuous',()=>{
    const context=new FakeAudioContext();const voice=createVoice(context.asBaseAudioContext(),event(),context.destination as unknown as AudioNode);const gain=context.gains[0].gain;gain.cancelAndHoldAtTime=undefined;
    voice.stop(.2,.1);voice.stop(.25,.01);const lastSet=gain.calls.filter(c=>c.method==='set').at(-1);expect(lastSet?.value).toBeCloseTo((.8/24)*.55*.5,12);expect(voice.endsAt).toBe(.26);
  });
  it('automatically ends preview with no pointerup',async()=>{
    const {engine,context}=setup();engine.previewNote(60);await flush();expect(engine.getDiagnostics().musicalVoices).toBe(1);expect(context.sources[0].starts).toEqual([.02]);expect(context.sources[0].stops[0]).toBeCloseTo(.49);context.advance(.50);expect(engine.getDiagnostics().musicalVoices).toBe(0);
  });
  it('S11 admits a fresh preview after a 16ms audio-clock step without another async enable',async()=>{
    const {engine,context}=setup();await engine.enable();const enable=vi.spyOn(engine,'enable'),admit=engine.scheduleGroup.bind(engine);
    vi.spyOn(engine,'scheduleGroup').mockImplementation(events=>{context.advance(context.currentTime+.016);return admit(events);});
    engine.previewNote(60);await flush();expect(engine.getDiagnostics().scheduledEvents).toBe(1);expect(enable).not.toHaveBeenCalled();engine.dispose();
  });
  it('S11 late preview remains canceled and tells the user to retry without replaying a stale queue',async()=>{
    const {engine,context}=setup();await engine.enable();const admit=engine.scheduleGroup.bind(engine);
    vi.spyOn(engine,'scheduleGroup').mockImplementation(events=>{context.advance(context.currentTime+.04);return admit(events);});
    engine.previewNote(60);await flush();expect(engine.getDiagnostics().scheduledEvents).toBe(0);expect(engine.message()).toContain('다시 눌러');context.advance(5);expect(engine.getDiagnostics().scheduledEvents).toBe(0);engine.dispose();
  });
  it('uses 8ms preview eviction and keeps the entire incoming comparison group pending until three slots free',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup(Array.from({length:24},(_,i)=>event({id:String(i),groupId:String(i),priority:'preview',at:.01})));context.advance(.02);
    const group=[60,64,67].map((midi,i)=>event({id:`cmp${i}`,groupId:'cmp',priority:'compare',midi,at:.1}));expect(engine.scheduleGroup(group)).toBe(true);expect(engine.getDiagnostics()).toMatchObject({musicalVoices:24,pendingRequests:1});expect(context.sources.slice(0,9).every(s=>s.stops.at(-1)===.028)).toBe(true);context.advance(.028);expect(engine.getDiagnostics()).toMatchObject({musicalVoices:24,pendingRequests:0,peakVoices:24});expect(context.sources.slice(-9).map(s=>s.starts[0])).toEqual(Array(9).fill(.1));
  });
  it('does not steal a comparison voice to admit lower priority sound',async()=>{
    const {engine}=setup();await engine.enable();engine.scheduleGroup(Array.from({length:24},(_,i)=>event({id:String(i),priority:'compare'})));expect(engine.scheduleGroup([event({id:'preview',priority:'preview'})])).toBe(false);expect(engine.getDiagnostics().musicalVoices).toBe(24);
  });
  it('rejects a group whose start precedes the required eviction fade',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup(Array.from({length:24},(_,i)=>event({id:String(i),priority:'preview',at:.01})));context.advance(.02);
    expect(engine.scheduleGroup([60,64,67].map((midi,i)=>event({id:`near${i}`,groupId:'near',midi,at:.025,priority:'compare'})))).toBe(false);expect(engine.getDiagnostics()).toMatchObject({pendingRequests:0,scheduledEvents:24});
  });
  it('announces an accepted admission that becomes late instead of silently losing it',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup(Array.from({length:24},(_,i)=>event({id:String(i),priority:'preview',at:.01})));context.advance(.02);engine.scheduleGroup([event({id:'later',priority:'compare',at:.05})]);context.advance(.1);expect(engine.status()).toBe('paused');expect(engine.message()).toContain('다시 듣기');expect(engine.getDiagnostics().scheduledEvents).toBe(24);
  });
  it('rejects a second queued group instead of overwriting the accepted group',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup(Array.from({length:24},(_,i)=>event({id:String(i),priority:'preview',at:.01})));context.advance(.02);expect(engine.scheduleGroup([event({id:'accepted',at:.07,priority:'compare'})])).toBe(true);expect(engine.scheduleGroup([event({id:'second',at:.095,priority:'compare'})])).toBe(false);context.advance(.028);expect(context.sources.at(-1)?.starts).toEqual([.07]);expect(engine.getDiagnostics()).toMatchObject({musicalVoices:24,scheduledEvents:25,peakVoices:24});
  });
  it('can replace the oldest preview with a 25th preview after its fade',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup(Array.from({length:24},(_,i)=>event({id:String(i),priority:'preview',at:.01})));context.advance(.02);expect(engine.scheduleGroup([event({id:'25',priority:'preview',at:.05})])).toBe(true);context.advance(.028);expect(engine.getDiagnostics()).toMatchObject({musicalVoices:24,scheduledEvents:25,peakVoices:24});
  });
  it('cancels queued admission with its generation',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup(Array.from({length:24},(_,i)=>event({id:String(i),priority:'preview',at:.01})));context.advance(.02);engine.scheduleGroup([event({id:'later',priority:'compare',at:.1})]);engine.cancelGeneration(0);context.advance(.04);expect(engine.getDiagnostics()).toMatchObject({musicalVoices:0,pendingRequests:0,scheduledEvents:24});
  });
  it('uses user volume once and ramps from tracked automation with native and fallback support',()=>{
    const context=new FakeAudioContext();const mixer=createMixer(context.asBaseAudioContext());expect(mixer.valueAt(0)).toBe(.35);mixer.setVolume(.35);expect(context.gains[0].gain.calls).toEqual([{method:'set',value:.35,at:0}]);mixer.setMuted(true);expect(mixer.valueAt(.01)).toBe(0);context.currentTime=.005;context.gains[0].gain.cancelAndHoldAtTime=undefined;mixer.setMuted(false);expect(context.gains[0].gain.calls.slice(-3)).toEqual([{method:'cancel',at:.005},{method:'set',value:.175,at:.005},{method:'linear',value:.35,at:.015}]);
  });
  it('does not start a stale request when resume resolves after stop',async()=>{
    const {engine,context}=setup();context.deferred=true;engine.previewNote(60);engine.stopAll();context.resolveResume?.();await flush();expect(context.sources).toHaveLength(0);expect(engine.status()).toBe('paused');
  });
  it('shares pending resume while preserving only the latest request',async()=>{
    const {engine,context}=setup();context.deferred=true;engine.previewNote(60);engine.previewNote(64);expect(context.resumeCalls).toBe(1);context.resolveResume?.();await flush();expect(context.sources).toHaveLength(3);expect(context.sources[0].frequency.calls[0].value).toBeCloseTo(midiToFrequency(64));
  });
  it('keeps resume rejection recoverable with no scheduled audio',async()=>{
    const {engine,context}=setup();context.resumeError=true;expect(await engine.enable()).toBe(false);expect(engine.status()).toBe('locked');expect(context.sources).toHaveLength(0);context.resumeError=false;expect(await engine.enable()).toBe(true);
  });
  it('recreates a closed context only on the next explicit enable',async()=>{
    const first=new FakeAudioContext(),second=new FakeAudioContext();let calls=0;const engine=new AudioService({createContext:()=>{calls++;return (calls===1?first:second).asAudioContext();},isHidden:()=>false});await engine.enable();first.changeState('closed');expect(calls).toBe(1);await engine.enable();expect(calls).toBe(2);expect(first.listeners.size).toBe(0);expect(second.listeners.size).toBe(1);expect(engine.getDiagnostics().listenerBindings).toBe(1);
  });
  it('closes the owned context on explicit disposal and releases all listeners',async()=>{
    const {engine,context}=setup();await engine.enable();engine.dispose();engine.dispose();expect(context.closeCalls).toBe(1);expect(context.listeners.size).toBe(0);expect(engine.getDiagnostics()).toMatchObject({musicalVoices:0,listenerBindings:0,subscriptions:0,contextState:'absent'});
  });
  it('falls back to sine once on synthesis failure and makes repeated failure unavailable',async()=>{
    const {engine,context}=setup();await engine.enable();context.failureCount=1;expect(engine.scheduleGroup([event()])).toBe(true);expect(context.sources).toHaveLength(1);expect(engine.getDiagnostics().fallback).toBe(true);engine.stopAll();context.failureCount=2;expect(engine.scheduleGroup([event({id:'failure',generation:engine.generation})])).toBe(false);expect(engine.status()).toBe('unavailable');
  });
  it('unavailable context leaves silent learning possible without throwing',async()=>{
    const engine=new AudioService({createContext:()=>{throw new Error('unsupported');},isHidden:()=>false});expect(await engine.enable()).toBe(false);expect(engine.status()).toBe('unavailable');expect(()=>engine.stopAll()).not.toThrow();
  });
  it('keeps audio and wall clocks independent',async()=>{
    vi.useFakeTimers();const {engine,context}=setup();await engine.enable();engine.scheduleGroup([event()]);vi.advanceTimersByTime(5000);expect(engine.getDiagnostics().musicalVoices).toBe(1);context.advance(1.1);expect(engine.getDiagnostics().musicalVoices).toBe(0);
  });
  it('cancels non-running and hidden contexts and never resumes automatically on return',async()=>{
    const {engine,context}=setup();await engine.enable();engine.scheduleGroup([event({at:5})]);context.changeState('interrupted');expect(engine.scheduleGroup([event({generation:engine.generation})])).toBe(false);expect(engine.getDiagnostics().musicalVoices).toBe(0);engine.returned();expect(context.resumeCalls).toBe(1);expect(engine.status()).toBe('paused');
  });
  it('remains paused when suspend rejects and does not schedule until user enable',async()=>{
    const {engine,context}=setup();await engine.enable();context.suspendError=true;await engine.pause();expect(engine.status()).toBe('paused');expect(engine.isRunning()).toBe(false);expect(engine.scheduleGroup([event({generation:engine.generation})])).toBe(false);engine.returned();expect(engine.isRunning()).toBe(false);expect(await engine.enable()).toBe(true);
  });
});
