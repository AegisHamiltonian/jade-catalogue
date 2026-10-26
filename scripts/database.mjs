import pg from 'pg';
import {readFile} from 'node:fs/promises';
const action=process.argv[2]||'inspect';
const input=await new Promise((resolve,reject)=>{
 let text='';if(process.stdin.isTTY)process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');process.stdin.resume();
 process.stdout.write('Ready for database connection JSON on stdin (input is hidden).\n');
 const onData=chunk=>{text+=chunk;if(text.length>65536)reject(new Error('Input too large'));if(text.includes('\n')||text.includes('\r')){process.stdin.off('data',onData);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();try{resolve(JSON.parse(text.trim()));}catch{reject(new Error('Invalid input'));}}};process.stdin.on('data',onData);
});
const ca=await readFile(new URL('../database/certs/supabase-root-2021.crt',import.meta.url),'utf8');
const client=new pg.Client({host:input.host||'db.rqbyaiqdhbvtssnanoap.supabase.co',port:5432,database:'postgres',user:input.user||'postgres',password:input.password,ssl:{ca,rejectUnauthorized:true,servername:input.servername||input.host||'db.rqbyaiqdhbvtssnanoap.supabase.co'},connectionTimeoutMillis:10000,query_timeout:20000,application_name:'ngan-giang-setup'});
try{
 await client.connect();
 if(action==='inspect'){
  const tables=(await client.query("select table_schema,table_name from information_schema.tables where table_schema in ('public','private') and table_type='BASE TABLE' order by 1,2")).rows;
  const columns=(await client.query("select column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name='products' order by ordinal_position")).rows;
  const policies=(await client.query("select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','private') order by 1,2,3")).rows;
  const authUsers=(await client.query('select count(*)::int as count from auth.users')).rows[0].count;
  console.log(JSON.stringify({connected:true,tlsAuthorized:client.connection.stream.authorized,tables,columns,policies,authUserCount:authUsers},null,2));
 }else if(action==='apply'){
  const exists=(await client.query("select to_regclass('public.products') as table_name")).rows[0].table_name;
  if(exists)throw new Error('Existing products table found. Inspect and migrate in place; fresh schema will not be applied.');
  await client.query(await readFile(new URL('../database/schema.sql',import.meta.url),'utf8'));
  await client.query(await readFile(new URL('../database/storage.sql',import.meta.url),'utf8'));
  await client.query("notify pgrst, 'reload schema'");
  console.log(JSON.stringify({applied:true,products:(await client.query('select count(*)::int as count from public.products')).rows[0].count,adminCount:(await client.query('select count(*)::int as count from private.shop_admins')).rows[0].count}));
 }else if(action==='grant-admin'){
  if(typeof input.email!=='string'||!input.email.includes('@'))throw new Error('An existing Auth user email is required.');
  const result=await client.query('insert into private.shop_admins(user_id) select id from auth.users where lower(email)=lower($1) on conflict(user_id)do nothing returning user_id',[input.email]);
  const count=(await client.query('select count(*)::int as count from private.shop_admins a join auth.users u on u.id=a.user_id where lower(u.email)=lower($1)',[input.email])).rows[0].count;
  if(count!==1)throw new Error('No matching Authentication user exists. Create the user in Supabase Authentication first.');
  console.log(JSON.stringify({adminGranted:true,newMembership:result.rowCount===1}));
 }else if(action==='probe'){
  const {verifyLiveRLS}=await import('./live-rls.mjs');
  console.log(JSON.stringify(await verifyLiveRLS(client,input.email)));
 }else if(action==='verify'){
  console.log(JSON.stringify({products:(await client.query('select count(*)::int as count from public.products')).rows[0].count,adminCount:(await client.query('select count(*)::int as count from private.shop_admins')).rows[0].count,rls:(await client.query("select relrowsecurity from pg_class where oid='public.products'::regclass")).rows[0].relrowsecurity,policies:(await client.query("select policyname,cmd,roles from pg_policies where schemaname='public' and tablename='products'")).rows,mediaBucket:(await client.query("select id,public,file_size_limit from storage.buckets where id='product-media'")).rows},null,2));
 }else throw new Error('Unknown database action');
}catch(error){
 const message=String(error.message||'Database operation failed').split(input.password||'__never__').join('[redacted]');
 console.error(JSON.stringify({error:error.code||error.name,message}));process.exitCode=1;
}finally{await client.end().catch(()=>{});}
