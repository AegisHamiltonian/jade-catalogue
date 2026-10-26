import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {config} from '../dist/config.js';
const results=[];
async function call(path,method='GET',body){
 const response=await fetch(config.supabaseUrl+path,{method,headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json().catch(()=>null);
 const result={method,path,status:response.status,...(data?.code?{code:data.code}:{})};results.push(result);return {response,data};
}
const read=await call('/rest/v1/products?select=id,sku&is_published=eq.true&limit=1');assert.equal(read.response.status,200);assert.ok(Array.isArray(read.data));
const role=await call('/rest/v1/rpc/is_shop_admin','POST',{});assert.equal(role.response.status,200);assert.equal(role.data,false);
// Empty INSERT cannot create any row even if permissions were misconfigured.
const insert=await call('/rest/v1/products','POST',{});assert.ok([401,403].includes(insert.response.status));assert.equal(insert.data.code,'42501');
// Random absent ID: these probes cannot modify an existing shop product.
const absent=randomUUID();
for(const [method,body]of [['PATCH',{supply:'sold'}],['DELETE',undefined]]){
 const result=await call('/rest/v1/products?id=eq.'+absent,method,body);assert.ok([401,403].includes(result.response.status));assert.equal(result.data.code,'42501');
}
const output={checkedAt:new Date().toISOString(),passed:true,results};
await writeFile(new URL('../docs/live-api-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
