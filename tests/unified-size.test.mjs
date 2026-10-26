import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {sizeNumbers,formatSize} from '../dist/product-size.js';
import {productFromForm} from '../dist/product-form.js';
import {filterProducts,validateProduct,inquiryText} from '../dist/catalogue.js';
import {renderSizingImages} from '../dist/sizing-images.js';
import {renderRingSizingGuide} from '../dist/ring-sizing.js';

test('one flexible size preserves the entered text, with numeric indexes only for clear category-specific measurements',()=>{
 const cases=[['vong','54',54,null],['nhan','18,4',18.4,null],['vong','Ni 54 mm · bản 12 × 7',54,null],['vong_chuoi','Hạt 5,8 mm · chuỗi 160 mm',null,5.8],['vong_chuoi','6.5',null,6.5],['vong','54 × 12 × 7',null,null],['charm','12 × 8 × 4',null,null],['nhan','18,45',18.45,null],['vong_chuoi','6–8',null,null]];
 for(const [category,text,diameter,bead]of cases){
   const data=new FormData();for(const [key,value]of Object.entries({sku:'one',title:'Ngọc',category,supply:'stock',size_mm:text,price_vnd:'500000',batch_date:'2026-10-26',jade_material:'unknown',treatment:'unknown'}))data.set(key,value);
   const product=productFromForm(data,{images:['https://example.com/a']});
   assert.equal(product.size_mm,text);assert.equal(product.ni_tay,diameter);assert.equal(product.bead_diameter_mm,bead);assert.deepEqual(validateProduct(product),[]);
   assert.ok(inquiryText(product,'https://example.com').includes(text));
 }
 assert.equal(formatSize('12 × 8 × 4'),'12 × 8 × 4 mm');assert.equal(formatSize('Freesize'),'Freesize');
 assert.equal(sizeNumbers('vong','0').valid,false);
 const samples=[{id:'a',sku:'a',title:'A',category:'vong',is_published:true,size_mm:'54 × 12 × 7',ni_tay:null},{id:'b',sku:'b',title:'B',category:'vong',is_published:true,size_mm:'Ni 54 mm',ni_tay:54}];
 assert.deepEqual(filterProducts(samples,{category:'vong',size:54}).map(p=>p.id),['b']);
});

test('public guides retain images and all table rows while removing citation notes and external reference links',async()=>{
 const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
 const imageGuide=renderSizingImages(),ringGuide=renderRingSizingGuide();
 assert.doesNotMatch(app+imageGuide+ringGuide,/class="source-note"|class="sizing-source"|Tham khảo|tham khảo|mkjadejewelry|tiffany\.com|gia\.edu/);
 assert.equal((imageGuide.match(/<figure/g)||[]).length,6);assert.equal((ringGuide.match(/<tr(?: class="[^"]+")?><th scope="row">/g)||[]).length,9);
 const admin=await readFile(new URL('../dist/admin.html',import.meta.url),'utf8');
 assert.equal((admin.match(/name="size_mm"/g)||[]).length,1);
 assert.doesNotMatch(admin,/name="(?:ni_tay|bead_diameter_mm|dimensions)"/);
 assert.match(admin,/Size \(mm\)/);
});

test('Size migration preserves stored dimensions and all unrelated fields; database and client derive identical indexes',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;`);
 await db.exec(await readFile(new URL('./fixtures/catalogue-before-20261026.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../database/migrations/20261026_catalogue.sql',import.meta.url),'utf8'));
 await db.exec(`insert into public.products(sku,title,category,ni_tay,bead_diameter_mm,dimensions,price_vnd,thumbnail_url)values
 ('band','Vòng','vong',54,null,'Bản 12 × 7 mm',500000,'https://example.com/a'),
 ('chain','Chuỗi','vong_chuoi',null,5.8,'Chuỗi 160 mm',720000,'https://example.com/b'),
 ('pendant','Mặt','mat_day',null,null,'28 × 18 × 6 mm',1000000,'https://example.com/c');`);
 const before=(await db.query('select * from public.products order by sku')).rows;
 const policies=(await db.query('select * from pg_policies order by tablename,policyname')).rows;
 const migration=await readFile(new URL('../database/migrations/20261026_size_mm.sql',import.meta.url),'utf8');
 const functions=await readFile(new URL('../database/size-mm.sql',import.meta.url),'utf8');
 const apply=async()=>{await db.exec(migration);await db.exec('drop trigger if exists products_size_mm on public.products');await db.exec(functions);await db.exec('commit');};
 await apply();
 const after=(await db.query('select * from public.products order by sku')).rows;
 for(let i=0;i<after.length;i++){
   const {size_mm,updated_at,...kept}=after[i],{updated_at:oldTime,...old}=before[i];assert.deepEqual(kept,old);assert.ok(size_mm.includes(before[i].dimensions));
 }
 assert.deepEqual((await db.query('select * from pg_policies order by tablename,policyname')).rows,policies);
 for(const [category,text]of [['vong','54'],['nhan','18,4'],['vong','Ni 54 mm · bản 12 × 7'],['vong_chuoi','Hạt 6,5 mm'],['vong','54 × 12 × 7'],['charm','12 × 8 × 4'],['nhan','18,45']]){
   await db.query("update public.products set category=$1,size_mm=$2 where sku='band'",[category,text]);
   const row=(await db.query("select ni_tay,bead_diameter_mm from public.products where sku='band'")).rows[0],expected=sizeNumbers(category,text);
   assert.equal(row.ni_tay==null?null:Number(row.ni_tay),expected.ni_tay);assert.equal(row.bead_diameter_mm==null?null:Number(row.bead_diameter_mm),expected.bead_diameter_mm);
 }
 await db.exec("update public.products set size_mm=null where sku='chain'");await apply();
 assert.equal((await db.query("select size_mm,bead_diameter_mm from public.products where sku='chain'")).rows[0].size_mm,null);
 await assert.rejects(db.exec("update public.products set size_mm='' where sku='band'"),/category_size/);
 await assert.rejects(db.exec("update public.products set size_mm='0' where sku='band'"),/positive/);
 const schema=await readFile(new URL('../database/schema.sql',import.meta.url),'utf8');assert.ok(schema.replaceAll('\r\n','\n').includes(functions.replaceAll('\r\n','\n').trim()));
 }finally{await db.close();}
});
