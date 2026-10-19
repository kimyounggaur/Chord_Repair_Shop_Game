import {it,expect} from 'vitest';
import {freshProfile} from '../../src/persistence/schemas';
import {createExport,prepareImport} from '../../src/persistence/import-export';
it('S11 deterministic bounded import fuzz rejects 600 malformed payloads without side effects',async()=>{
  const valid=JSON.parse(createExport(freshProfile()));let state=0x5476;
  for(let index=0;index<600;index++){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const input=structuredClone(valid),choice=index%6;
    if(choice===0)input.schemaVersion=2+(state%1000);
    if(choice===1)input.contentVersion=`unknown-${state}`;
    if(choice===2)input.settings.volume=2+(state%1000);
    if(choice===3)input.attempts=Array(101+(state%10)).fill({});
    if(choice===4)input[`unexpected-${state}`]={constructor:{polluted:true}};
    if(choice===5)input.settings.mute=['true','false',null,0][state%4];
    const text=JSON.stringify(input);await expect(prepareImport({size:new TextEncoder().encode(text).length,text:async()=>text})).rejects.toThrow();
  }
  expect(Object.prototype).not.toHaveProperty('polluted');
  const text=JSON.stringify(valid);await expect(prepareImport({size:text.length,text:async()=>text})).resolves.toMatchObject({schemaVersion:1});
});
