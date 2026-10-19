import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
const entries=Object.entries(lock.packages).filter(([path])=>path).map(([path,p])=>({path,version:p.version,license:p.license??'not recorded in lockfile',dev:!!p.dev,resolved:p.resolved,integrity:p.integrity}));
mkdirSync('docs/evidence',{recursive:true});
writeFileSync('docs/evidence/dependency-ledger.json',JSON.stringify({generatedAt:new Date().toISOString(),source:'package-lock.json',scope:'Declared package licenses, not a legal review',entries},null,2)+'\n');
console.log(JSON.stringify({packages:entries.length,unrecordedLicenses:entries.filter(e=>e.license==='not recorded in lockfile').length}));
