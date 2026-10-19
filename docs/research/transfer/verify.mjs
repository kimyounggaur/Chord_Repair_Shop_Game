import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync('docs/research/transfer/items.json','utf8'));
const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const midi=name=>{const match=/^([A-G])([#b]?)(-?\d+)$/.exec(name);assert.ok(match);return 12*(Number(match[3])+1)+natural[match[1]]+(match[2]==='#'?1:match[2]==='b'?-1:0);};
assert.equal(rows.length,6);
for(const row of rows){assert.ok(row.id.startsWith('transfer/'));assert.deepEqual(row.notes.map(midi),row.midi);if(row.intervals)assert.deepEqual(row.midi.map(value=>value-row.midi[0]),row.intervals);if(row.pitchClasses)assert.deepEqual(row.midi.map(value=>value%12).sort((a,b)=>a-b),row.pitchClasses);}
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${dir}/${entry.name}`):[`${dir}/${entry.name}`]);
const leaked=walk('src').filter(path=>readFileSync(path,'utf8').includes('transfer/'));assert.deepEqual(leaked,[]);
const result={status:'PASS',recordedAt:new Date().toISOString(),checked:rows.length,rows,appImports:leaked,scope:'Independent literal arithmetic and fixture separation only. Human research, musical listening, A/B equivalence and learning effects NOT RUN.'};
writeFileSync('docs/evidence/S12-transfer-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
