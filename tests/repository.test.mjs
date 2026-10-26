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
