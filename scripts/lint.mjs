import {readdirSync,readFileSync} from 'node:fs';
const files=(p)=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(p+'/'+e.name):[p+'/'+e.name]);
let errors=[];
for(const f of files('src').filter(f=>/\.tsx?$/.test(f))){
  const s=readFileSync(f,'utf8');
  if(/@ts-ignore|@ts-nocheck|dangerouslySetInnerHTML/.test(s))errors.push(f+': unsafe escape');
  const code=s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
  if(/(?:[:<]|\bas)\s*any\b/.test(code))errors.push(f+': explicit any');
  if(f.includes('/domain/')){
    if(/from ['"](?:react(?:-dom)?|.*(?:audio|persistence|ui|app)\/)/.test(code))errors.push(f+': domain dependency');
    if(/\b(?:window|document|AudioContext|OfflineAudioContext|indexedDB|localStorage|sessionStorage)\b/.test(code))errors.push(f+': domain browser dependency');
  }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Architecture and unsafe-escape checks passed');
