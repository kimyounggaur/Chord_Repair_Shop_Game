import { describe, expect, it } from 'vitest';
import raw from '../../src/content/orders.v1.json';
import { ContentError, loadOrders, parseOrdersJson, validateOrders } from '../../src/content/loader';
import { formatPitch } from '../../src/domain/music';

describe('bundled order validation',()=>{
  it('loads the exact eight immutable orders as parsed pitches',()=>{
    const orders=loadOrders();
    expect(orders.map(order=>order.id)).toEqual(['CR01','CR02','CR03','CR04','CR05','CR06','CR07','CR08']);
    expect(orders.map(order=>order.reflection.answerIndex)).toEqual([0,0,0,1,0,0,0,0]);
    expect(orders.map(order=>order.editableSlots)).toEqual([[1],[1],[0,1,2],[0,1,2],[0,1,2],[0,1,2],[0,1,2],[0,1,2]]);
    expect(formatPitch(orders[3].target[1])).toBe('Bb4');
    expect(Object.isFrozen(orders[0].target[1])).toBe(true);
    expect(Object.isFrozen(orders[0].reflection.options)).toBe(true);
    expect(raw[0].root).toBe('C4');
  });
  const mutations: readonly [string,(items: typeof raw)=>void][] = [
    ['missing field',items=>{delete (items[0] as Partial<typeof raw[0]>).title;}],
    ['extra field',items=>{Object.assign(items[0],{surprise:true});}],
    ['duplicate id',items=>{items[1].id='CR01';}],
    ['wrong enum',items=>{items[0].quality='diminished';}],
    ['coerced enum',items=>{Object.assign(items[0],{primaryConcept:['root']});}],
    ['wrong version',items=>{items[0].contentVersion='2.0.0';}],
    ['NaN MIDI',items=>{items[0].initialMidi[0]=NaN;}],
    ['wrong tuple size',items=>{items[0].initial.push('C4');}],
    ['changed target MIDI',items=>{items[0].targetMidi[1]=65;}],
    ['target spelling corruption',items=>{items[3].target[1]='A#4';}],
    ['missing map key',items=>{delete (items[0].displaySpellingMap as Partial<typeof raw[0]['displaySpellingMap']>)['74'];}],
    ['extra map key',items=>{Object.assign(items[0].displaySpellingMap,{'075':'Eb5'});}],
    ['map MIDI mismatch',items=>{items[0].displaySpellingMap['63']='E4';}],
    ['empty editable slots',items=>{items[0].editableSlots=[];}],
    ['duplicate editable slots',items=>{items[2].editableSlots=[0,1,1];}],
    ['unreachable locked target',items=>{items[0].initial[0]='D4';items[0].initialMidi[0]=62;}],
    ['already correct permutation',items=>{items[2].initial=['C5','F4','A4'];items[2].initialMidi=[72,65,69];}],
    ['out of range',items=>{items[0].allowedMidi=[48,84];}],
    ['bad answer index',items=>{items[3].reflection.answerIndex=4;}],
    ['changed reference answer',items=>{items[3].reflection.answerIndex=0;}],
    ['empty option',items=>{items[0].reflection.options[0]='';}],
    ['oversized title',items=>{items[0].title='x'.repeat(201);}],
  ];
  it.each(mutations)('rejects %s',(_name,mutate)=>{
    const items=structuredClone(raw);mutate(items);
    expect(()=>validateOrders(items)).toThrow(ContentError);
  });
  it('rejects wrong object shapes and bounded arrays',()=>{
    for(const input of [null,{},[],new Array(8),[...raw,...raw]]) expect(()=>validateOrders(input)).toThrow(ContentError);
  });
  it('rejects duplicate raw JSON properties, including escaped equivalent keys',()=>{
    expect(()=>parseOrdersJson('[{"id":"CR01","id":"CR02"}]')).toThrow(/DUPLICATE_KEY/);
    expect(()=>parseOrdersJson('[{"id":"CR01","\\u0069d":"CR02"}]')).toThrow(/DUPLICATE_KEY/);
    expect(()=>parseOrdersJson('{')).toThrow(ContentError);
    expect(parseOrdersJson(JSON.stringify(raw))).toHaveLength(8);
  });
});
