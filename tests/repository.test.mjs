import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
async function freshRepository(){
 const code=(await readFile(new URL('../dist/repository.js',import.meta.url),'utf8')).replace("import { config } from './config.js';",`const config={dataSource:'supabase',supabaseUrl:'https://shop.example',supabasePublishableKey:'sb_publishable_test',mediaBucket:'product-media'};`);
 return (await import('data:text/javascript;base64,'+Buffer.from(code+'\n//'+crypto.randomUUID()).toString('base64'))).repository;
}
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
test('live catalogue paginates beyond the API page and never substitutes preview inventory',async()=>{
 const original=globalThis.fetch, calls=[];try{
 const repository=await freshRepository();
 globalThis.fetch=async(url)=>{calls.push(url);return json(url.includes('offset=0')?Array.from({length:200},(_,id)=>({id})):[{id:200}]);};
 assert.equal((await repository.list()).length,201);assert.equal(calls.length,2);assert.ok(calls.every(u=>u.includes('is_published=eq.true')));
 globalThis.fetch=async()=>{throw new Error('offline');};
 await assert.rejects(repository.list(),/offline/);
 }finally{globalThis.fetch=original;}
});
test('successful authentication alone cannot open admin access',async()=>{
 const original=globalThis.fetch, calls=[];try{
 const repository=await freshRepository();globalThis.fetch=async(url)=>{calls.push(url);if(url.includes('/token?'))return json({access_token:'ordinary-user-token',refresh_token:'refresh',expires_in:3600,user:{email:'viewer@example.com'}});if(url.endsWith('/is_shop_admin'))return json(false);if(url.endsWith('/logout'))return new Response(null,{status:204});throw new Error('Unexpected request');};
 await assert.rejects(repository.signIn('viewer@example.com','example-pass'),/không có quyền/);
 await assert.rejects(repository.adminList(),/đăng nhập lại/);assert.ok(calls.some(u=>u.endsWith('/logout')));
 }finally{globalThis.fetch=original;}
});
test('admin writes carry auth, optimistic timestamp and preserve integer VND',async()=>{
 const original=globalThis.fetch, calls=[];try{
 const repository=await freshRepository();globalThis.fetch=async(url,options)=>{calls.push({url,options});if(url.includes('/token?'))return json({access_token:'admin-token',refresh_token:'refresh',expires_in:3600,user:{email:'owner@example.com'}});if(url.endsWith('/is_shop_admin'))return json(true);if(options.method==='PATCH')return json([]);return json([]);};
 await repository.signIn('owner@example.com','example-pass');
 await assert.rejects(repository.save({id:'abc',sku:'n246.1',price_vnd:800000},'2026-10-26T01:00:00Z'),/đã thay đổi/);
 const call=calls.at(-1);assert.match(call.url,/updated_at=eq.2026-10-26T01%3A00%3A00Z/);assert.equal(call.options.headers.Authorization,'Bearer admin-token');assert.equal(JSON.parse(call.options.body).price_vnd,800000);
 }finally{globalThis.fetch=original;}
});

test('photo/video uploads use authenticated progress transport, longer deadlines and actionable retry errors',async()=>{
 const originalFetch=globalThis.fetch,originalXHR=globalThis.XMLHttpRequest,instances=[];let behavior;
 class UploadXHR{
  constructor(){this.listeners={};this.headers={};this.upload={addEventListener:(name,fn)=>this.listeners[name]=fn};instances.push(this);}
  open(method,url){this.method=method;this.url=url;assert.equal(typeof this.listeners.progress,'function');}
  setRequestHeader(key,value){this.headers[key]=value;}
  send(body){this.body=body;queueMicrotask(()=>behavior(this));}
  abort(){this.onabort();}
 }
 try{
  globalThis.XMLHttpRequest=UploadXHR;
  globalThis.fetch=async url=>url.includes('/token?')?json({access_token:'admin-token',refresh_token:'refresh',expires_in:3600,user:{email:'owner@example.com'}}):json(true);
  const repository=await freshRepository();await repository.signIn('owner@example.com','fixture-pass');
  const progress=[];behavior=xhr=>{xhr.listeners.progress({lengthComputable:true,loaded:100,total:100});xhr.status=201;xhr.responseText='{}';xhr.onload();};
  const image=new File(['photo'],'phone.jpg',{type:'image/jpeg'});
  const url=await repository.upload(image,'images',{onProgress:p=>progress.push(p)}),request=instances.at(-1);
  assert.match(url,/\/public\/product-media\/images\/[a-f0-9-]+\.jpg$/);assert.equal(request.body,image);assert.equal(request.timeout,180000);
  assert.equal(request.headers.Authorization,'Bearer admin-token');assert.equal(request.headers.apikey,'sb_publishable_test');assert.equal(request.headers['Content-Type'],'image/jpeg');assert.equal(request.headers['x-upsert'],'false');assert.deepEqual(progress,[99]);
  await repository.upload({type:'video/mp4',size:40*1024*1024},'videos');assert.equal(instances.at(-1).timeout,300000);
  behavior=xhr=>xhr.ontimeout();await assert.rejects(repository.upload(image),/quá lâu.*Thử lại/);
  behavior=xhr=>xhr.onerror();await assert.rejects(repository.upload(image),/Mất kết nối.*Thử lại/);
  behavior=xhr=>{xhr.status=403;xhr.responseText='{}';xhr.onload();};await assert.rejects(repository.upload(image),/quyền quản trị/);
  await assert.rejects(repository.upload({type:'image/jpeg',size:8*1024*1024+1}),/8 MB/);
  await assert.rejects(repository.upload({type:'video/mp4',size:40*1024*1024+1},'videos'),/40 MB/);
  await assert.rejects(repository.upload({type:'image/heic',size:100}),'HEIC must be decoded before storage');
  await assert.rejects(repository.upload(image,'anything-else'),/không hợp lệ/);
 }finally{globalThis.fetch=originalFetch;globalThis.XMLHttpRequest=originalXHR;}
});

test('upload cancellation settles without treating sent bytes as a successful image',async()=>{
 const originalFetch=globalThis.fetch,originalXHR=globalThis.XMLHttpRequest;let sent;const hasSent=new Promise(resolve=>sent=resolve);
 try{
  globalThis.XMLHttpRequest=class {constructor(){this.upload={addEventListener(){}};}open(){}setRequestHeader(){}send(){sent();}abort(){this.onabort();}};
  globalThis.fetch=async url=>url.includes('/token?')?json({access_token:'admin-token',refresh_token:'refresh',expires_in:3600,user:{email:'owner@example.com'}}):json(true);
  const repository=await freshRepository();await repository.signIn('owner@example.com','fixture-pass');const controller=new AbortController();
  const upload=repository.upload(new File(['photo'],'a.jpg',{type:'image/jpeg'}),'images',{signal:controller.signal});await hasSent;controller.abort();
  await assert.rejects(upload,error=>error.name==='AbortError');
 }finally{globalThis.fetch=originalFetch;globalThis.XMLHttpRequest=originalXHR;}
});
