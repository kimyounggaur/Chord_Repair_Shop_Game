// Loopback-only production verifier. Shares the deployed headers; no telemetry.
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {gzipSync} from 'node:zlib';
const root=resolve('dist');
const config=JSON.parse(readFileSync('vercel.json','utf8'));
const baseHeaders=Object.fromEntries(config.headers[0].headers.map(row=>[row.key,row.value]));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.md':'text/plain; charset=utf-8'};
const server=createServer((request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1:4486').pathname);
    let path=resolve(root,'.'+pathname);
    if(path!==root&&!path.startsWith(root+sep)){response.writeHead(403);response.end();return;}
    if(!existsSync(path)||!statSync(path).isFile()){
      if(extname(pathname)){response.writeHead(404,baseHeaders);response.end('Not found');return;}
      path=resolve(root,'index.html');
    }
    let bytes=readFileSync(path);const headers={...baseHeaders,'Content-Type':mime[extname(path)]??'application/octet-stream','Vary':'Accept-Encoding'};
    if(/^\/assets\/index-/.test(pathname))headers['Cache-Control']='public, max-age=31536000, immutable';
    if(/gzip/.test(request.headers['accept-encoding']??'')&&/\.(html|js|css|json|svg|md)$/.test(path)){bytes=gzipSync(bytes);headers['Content-Encoding']='gzip';}
    headers['Content-Length']=String(bytes.length);response.writeHead(200,headers);response.end(request.method==='HEAD'?undefined:bytes);
  }catch{response.writeHead(500);response.end('Preview error');}
});
server.listen(4486,'127.0.0.1',()=>console.log(`Production verification: http://127.0.0.1:4486 (${root})`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit()));
