import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Every probe is inside one transaction and is ALWAYS rolled back.
// Public APIs and other database sessions cannot see these uncommitted rows.
export async function verifyLiveRLS(client,email){
 const suffix=randomUUID().replaceAll('-','').slice(0,14),publicSku='qa-public-'+suffix,hiddenSku='qa-hidden-'+suffix;
 const admin=(await client.query('select a.user_id from private.shop_admins a join auth.users u on a.user_id=u.id where lower(u.email)=lower($1)',[email])).rows[0];
 if(!admin)throw new Error('The specified Auth user does not have admin membership.');
 let assertions=0;
 const check=(actual,expected)=>{assert.deepEqual(actual,expected);assertions++;};
 await client.query('begin');
 const role=async(name,id='')=>{
  await client.query('reset role');
  await client.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id,JSON.stringify(id?{sub:id,role:name}:{role:name})]);
  await client.query('set local role '+name);
 };
 const denied=async(sql,params=[])=>{
  await client.query('savepoint permission_probe');let caught;
  try{await client.query(sql,params);}catch(err){caught=err;}
  await client.query('rollback to savepoint permission_probe');
  assert.ok(caught,'Expected write/read to be denied');assertions++;
  check(caught.code,'42501');
 };
 try{
  await client.query("insert into public.products(sku,title,category,supply,ni_tay,price_vnd,thumbnail_url,is_published)values($1,'Temporary uncommitted public probe','vong','stock',54,1,'https://example.invalid/qa.webp',true),($2,'Temporary uncommitted hidden probe','mat_day','sold',null,1,'https://example.invalid/qa.webp',false)",[publicSku,hiddenSku]);
  await role('anon');
  check((await client.query('select sku from public.products where sku in($1,$2) order by sku',[publicSku,hiddenSku])).rows.map(r=>r.sku),[publicSku]);
  check((await client.query('select public.is_shop_admin() as yes')).rows[0].yes,false);
  await denied('insert into public.products(sku)values($1)',['qa-denied-'+suffix]);
  await denied("update public.products set supply='sold' where sku=$1",[publicSku]);
  await denied('delete from public.products where sku=$1',[publicSku]);
  await role('authenticated',randomUUID());
  check((await client.query('select sku from public.products where sku in($1,$2)',[publicSku,hiddenSku])).rows.map(r=>r.sku),[publicSku]);
  check((await client.query("update public.products set supply='sold' where sku=$1 returning sku",[publicSku])).rowCount,0);
  check((await client.query('delete from public.products where sku=$1 returning sku',[publicSku])).rowCount,0);
  await denied('insert into public.products(sku)values($1)',['qa-denied-'+suffix]);
  await denied('insert into private.shop_admins(user_id)values($1)',[randomUUID()]);
  await denied("insert into storage.objects(bucket_id,name)values('product-media',$1)",['qa/'+suffix+'.webp']);
  await role('authenticated',admin.user_id);
  check((await client.query('select public.is_shop_admin() as yes')).rows[0].yes,true);
  check((await client.query('select sku from public.products where sku in($1,$2)',[publicSku,hiddenSku])).rowCount,2);
  // Keep PostgreSQL microseconds, as PostgREST does; JS Date truncates them.
  const previous=(await client.query('select updated_at::text as updated_at from public.products where sku=$1',[publicSku])).rows[0].updated_at;
  check((await client.query("update public.products set supply='sold' where sku=$1 and updated_at=$2 returning sku",[publicSku,previous])).rowCount,1);
  check((await client.query("update public.products set supply='stock' where sku=$1 and updated_at=$2 returning sku",[publicSku,previous])).rowCount,0);
  await client.query("insert into storage.objects(bucket_id,name)values('product-media',$1)",['qa/'+suffix+'.webp']);
  check((await client.query("select name from storage.objects where name=$1",['qa/'+suffix+'.webp'])).rowCount,1);
  await denied('select * from private.product_audit');
  check((await client.query('delete from public.products where sku=$1 returning sku',[hiddenSku])).rowCount,1);
  await client.query('reset role');
  await client.query('delete from private.shop_admins where user_id=$1',[admin.user_id]);
  await role('authenticated',admin.user_id);
  check((await client.query('select public.is_shop_admin() as yes')).rows[0].yes,false);
  check((await client.query("update public.products set supply='stock' where sku=$1 returning sku",[publicSku])).rowCount,0);
  // Supabase also rejects direct SQL DELETE via its own Storage trigger.
  // Keep that platform protection; application uploads use the Storage API.
  await denied('delete from storage.objects where name=$1 returning id',['qa/'+suffix+'.webp']);
 }finally{await client.query('rollback');}
 check((await client.query('select sku from public.products where sku in($1,$2)',[publicSku,hiddenSku])).rowCount,0);
 check((await client.query('select name from storage.objects where name=$1',['qa/'+suffix+'.webp'])).rowCount,0);
 check((await client.query('select user_id from private.shop_admins where user_id=$1',[admin.user_id])).rowCount,1);
 return {passed:true,assertions,rolledBack:true,adminMembershipPreserved:true};
}
