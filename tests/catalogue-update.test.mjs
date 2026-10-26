import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {categoryNames,priceRanges,filterProducts,sizeLabel,validateProduct} from '../dist/catalogue.js';
import {productFromForm} from '../dist/product-form.js';
import {previewProducts} from '../dist/preview-products.js';
import {reclassifyChains} from '../scripts/reclassify-chains.mjs';

test('four price ranges cover every exact boundary once, including two million',()=>{
 const values=[1,499999,500000,999999,1000000,1999999,2000000,2000001];
 const products=values.map((price,i)=>({...previewProducts[0],id:String(i),sku:String(i),price_vnd:price}));
 const expected={under500:[1,499999],'500to1':[500000,999999],'1to2':[1000000,1999999,2000000],over2:[2000001]};
 const assigned=[];
 for(const [range,prices]of Object.entries(expected)){
   const found=filterProducts(products,{price:range}).map(p=>p.price_vnd).sort((a,b)=>a-b);
   assert.deepEqual(found,prices);assigned.push(...found);
 }
 assert.deepEqual(assigned.sort((a,b)=>a-b),values);
 assert.equal(filterProducts(products,{price:'unrecognized'}).length,values.length);
});

test('catalogue tabs and admin options expose the same six categories and four price ranges',async()=>{
 const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const admin=await readFile(new URL('../dist/admin.html',import.meta.url),'utf8');
 assert.deepEqual([...index.matchAll(/data-category="([^"]+)"[^>]*>([^<]+)<\/button>/g)].map(m=>[m[1],m[2]]),Object.entries(categoryNames));
 const select=admin.match(/<select name="category"[^>]*>(.*?)<\/select>/)[1];
 assert.deepEqual([...select.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(m=>[m[1],m[2]]),Object.entries(categoryNames));
 const price=index.match(/<select name="price"[^>]*>(.*?)<\/select>/)[1];
 assert.deepEqual([...price.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(m=>[m[1],m[2].replace('&lt;','<')]),Object.entries(priceRanges).map(([k,v])=>[k,v.label]));
 assert.doesNotMatch(admin,/name="certificate_(lab|url)"/);
 assert.match(admin,/name="certificate_number"/);
});

test('form round trips all six types and preserves stored certificate fields removed from the UI',()=>{
 for(const category of Object.keys(categoryNames)){
   const data=new FormData();
   for(const [key,value]of Object.entries({sku:'qa1',title:'Món ngọc',category,supply:'stock',price_vnd:500000,batch_date:'2026-10-26',ni_tay:category==='nhan'?18.4:54,bead_diameter_mm:'6.5',jade_material:'jadeite',treatment:'a',certificate_number:'CERT-1'}))data.set(key,String(value));
   const editing={id:'product-id',certificate_lab:'Stored lab',certificate_url:'https://example.com/cert.jpg'};
   const product=productFromForm(data,{editing,images:['https://example.com/real.jpg'],published:true});
   assert.equal(product.certificate_lab,editing.certificate_lab);assert.equal(product.certificate_url,editing.certificate_url);
   assert.equal(product.ni_tay,category==='vong'?54:category==='nhan'?18.4:null);
   assert.equal(product.bead_diameter_mm,category==='vong_chuoi'?6.5:null);
   assert.deepEqual(validateProduct(product),[]);
   const fresh=productFromForm(data,{images:['https://example.com/real.jpg']});
   assert.equal(fresh.certificate_lab,null);assert.equal(fresh.certificate_url,null);assert.deepEqual(validateProduct(fresh),[]);
 }
 assert.equal(sizeLabel({category:'vong_chuoi',ni_tay:null,bead_diameter_mm:5.8}),'Hạt 5,8 mm');
 assert.ok(validateProduct({...previewProducts[0],thumbnail_url:'https://example.com/a',category:'charm',ni_tay:null,bead_diameter_mm:6}).length);
});

test('existing database migrates in place; confirmed chains move measurements atomically with all other fields intact',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;`);
 await db.exec(await readFile(new URL('./fixtures/catalogue-before-20261026.sql',import.meta.url),'utf8'));
 await db.exec(`insert into public.products(sku,title,category,ni_tay,price_vnd,thumbnail_url,treatment,certificate_number,certificate_lab,certificate_url)values
 ('chain58','Vòng chuỗi','vong',5.8,500000,'https://example.com/a','a','CERT-1','Stored lab','https://example.com/cert.jpg'),
 ('chain65','Vòng chuỗi','vong',6.5,1000000,'https://example.com/b','unknown',null,null,null);`);
 const before=(await db.query('select * from public.products order by sku')).rows;
 const policiesBefore=(await db.query('select * from pg_policies order by tablename,policyname')).rows;
 const migration=await readFile(new URL('../database/migrations/20261026_catalogue.sql',import.meta.url),'utf8');
 await db.exec(migration);
 const after=(await db.query('select * from public.products order by sku')).rows.map(({bead_diameter_mm,...row})=>row);
 assert.deepEqual(after,before);
 assert.deepEqual((await db.query('select * from pg_policies order by tablename,policyname')).rows,policiesBefore);
 await db.exec(migration); // Safe retry after interrupted deployment.
 await assert.rejects(reclassifyChains(db,[{sku:'chain58',diameter:5.8},{sku:'chain65',diameter:99}]),/Measurement changed/);
 assert.equal((await db.query("select category from public.products where sku='chain58'")).rows[0].category,'vong');
 const converted=await reclassifyChains(db,[{sku:'chain58',diameter:5.8},{sku:'chain65',diameter:6.5}]);
 assert.equal(converted.unrelatedFieldsPreserved,true);
 const rows=(await db.query('select * from public.products order by sku')).rows;
 for(let i=0;i<rows.length;i++){
   const {category,ni_tay,bead_diameter_mm,updated_at,...kept}=rows[i];
   const {category:oldCat,ni_tay:oldNi,updated_at:oldAt,...oldKept}=before[i];
   assert.equal(category,'vong_chuoi');assert.equal(ni_tay,null);assert.equal(Number(bead_diameter_mm),Number(oldNi));assert.deepEqual(kept,oldKept);
 }
 assert.ok((await reclassifyChains(db,[{sku:'chain58',diameter:5.8}])).items[0].alreadyConverted);
 await db.exec("insert into public.products(sku,title,category,price_vnd,thumbnail_url)values('charm1','Charm','charm',400000,'https://example.com/c')");
 await assert.rejects(db.exec("update public.products set ni_tay=18 where sku='charm1'"),/category_size/);
 await assert.rejects(db.exec("update public.products set treatment='b' where sku='charm1'"),/treatment_evidence/);
 await db.exec("update public.products set treatment='b',certificate_number='CERT-2' where sku='charm1'");
 }finally{await db.close();}
});
