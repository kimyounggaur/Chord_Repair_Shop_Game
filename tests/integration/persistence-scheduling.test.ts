import {afterEach,describe,it,expect,vi} from 'vitest';
import {IDBFactory} from 'fake-indexeddb';
import {StorageController} from '../../src/persistence/controller';
import {openDatabase} from '../../src/persistence/db';
import {Repository} from '../../src/persistence/repository';
import {loadOrders} from '../../src/content/loader';
import {createSession,reduceSession} from '../../src/domain/session/reducer';
let controller:StorageController|undefined;
afterEach(()=>{controller?.dispose();controller=undefined;vi.useRealTimers();vi.unstubAllGlobals();});
async function setup(){
  vi.useFakeTimers({toFake:['Date','setTimeout','clearTimeout','setInterval','clearInterval']});vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('document',Object.assign(new EventTarget(),{hidden:false}));vi.stubGlobal('window',new EventTarget());vi.stubGlobal('BroadcastChannel',undefined);vi.stubGlobal('sessionStorage',{getItem:()=>null,setItem:()=>undefined});
  controller=new StorageController();await controller.start();const db=await openDatabase();return {controller,repo:new Repository(db)};
}
describe('S08 checkpoint scheduling',()=>{
  it('S11 never announces clean for an older commit while a newer checkpoint is queued',async()=>{
    const {controller,repo}=await setup(),order=loadOrders()[0];const phases:{revision:number;mode:string}[]=[];
    const unsubscribe=controller.subscribe(()=>{const view=controller.getSnapshot();phases.push({revision:view.profile.revision,mode:view.mode});});
    const state=reduceSession(createSession(order,'queue-banner',1),{type:'START_ORDER'},order).state;
    controller.handle({type:'SAVE',immediate:true,reason:'evidence'},state);
    const helped=reduceSession(state,{type:'HINT',area:'repair',level:1},order).state;controller.handle({type:'SAVE',immediate:true,reason:'evidence'},helped);await controller.flush();
    expect(phases.filter(row=>row.revision===1).some(row=>row.mode==='clean')).toBe(false);expect(controller.getSnapshot().mode).toBe('clean');expect((await repo.load()).profile?.draft?.state.evidence.maxRepairHintLevel).toBe(1);unsubscribe();repo.db.close();
  });
  it('S11 lifecycle before an order starts preserves settings without creating a course attempt',async()=>{
    const {controller,repo}=await setup(),order=loadOrders()[0];const home={...createSession(order,'unstarted-home',3),screen:'home' as const};
    controller.handle({type:'SAVE',immediate:true,reason:'hidden'},home);await controller.flush();
    expect((await repo.load()).profile).toMatchObject({attempts:[],progress:[],draft:null});
    const started=reduceSession(home,{type:'START_ORDER'},order).state;controller.handle({type:'SAVE',immediate:true,reason:'evidence'},started);await controller.flush();expect((await repo.load()).profile?.attempts).toHaveLength(1);repo.db.close();
  });
  it('uses 300ms trailing debounce and one-second maximum, and immediate help supersedes edit',async()=>{
    const {controller,repo}=await setup();const order=loadOrders()[0];let state=reduceSession(createSession(order,'scheduled',1),{type:'START_ORDER'},order).state;
    controller.handle({type:'SAVE',immediate:false,reason:'edit'},state);await vi.advanceTimersByTimeAsync(299);expect((await repo.load()).profile?.revision).toBe(0);await vi.advanceTimersByTimeAsync(1);await controller.flush();expect((await repo.load()).profile?.revision).toBe(1);
    for(let i=0;i<4;i++){state=reduceSession(state,{type:'SET_SETTINGS',patch:{volume:.4+i*.05}},order).state;controller.handle({type:'SAVE',immediate:false,reason:'settings'},state);await vi.advanceTimersByTimeAsync(250);}
    await controller.flush();expect((await repo.load()).profile?.settings.volume).toBeCloseTo(.55);
    state=reduceSession(state,{type:'HINT',area:'repair',level:2,revealsReflectionAnswer:true},order).state;controller.handle({type:'SAVE',immediate:true,reason:'evidence'},state);await controller.flush();await vi.advanceTimersByTimeAsync(1000);expect((await repo.load()).profile?.draft?.state.evidence).toMatchObject({maxRepairHintLevel:2,answerRevealedBeforeFirstAnswer:true});repo.db.close();
  });
  it('transaction abort becomes visible failure while accepted learning remains exportable',async()=>{
    const {controller,repo}=await setup(),order=loadOrders()[0];const state=reduceSession(createSession(order,'abort-visible',2),{type:'START_ORDER'},order).state;
    const commit=vi.spyOn(Repository.prototype,'commit').mockRejectedValueOnce(new DOMException('quota','QuotaExceededError'));
    controller.handle({type:'SAVE',immediate:true,reason:'evidence'},state);await controller.flush();expect(controller.getSnapshot().mode).toBe('failed');expect(controller.getSnapshot().profile.draft?.state.attemptId).toBe('abort-visible');expect((await repo.load()).profile?.revision).toBe(0);commit.mockRestore();await controller.retry();expect(controller.getSnapshot().mode).toBe('clean');repo.db.close();
  });
});
