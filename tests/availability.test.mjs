import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterProducts,groupByAvailability,groupByBatch} from '../dist/catalogue.js';

const product=(id,supply,price,batch='2026-10-26',extra={})=>({id,sku:id,title:id,supply,price_vnd:price,batch_date:batch,created_at:batch+'T10:00:00Z',is_published:true,category:'nhan',jade_color:'Xanh lục',jade_texture:'Nếp băng',ni_tay:18.4,size_mm:'18,4',...extra});
const products=[product('sold-new','sold',200000,'2026-10-27'),product('stock-old','stock',700000),product('order-old','order',600000),product('sold-high','sold',900000),product('hidden','sold',300000,'2026-10-27',{is_published:false})];

test('sold items follow every available batch without disappearing; each group retains the chosen sort',()=>{
 for(const sort of ['newest','price-up','price-down']){
  const filtered=filterProducts(products,{sort});
  const groups=groupByAvailability(filtered);
  assert.deepEqual(groups.map(g=>g.key),['available','sold']);
  assert.deepEqual(groups[0].items,filtered.filter(p=>p.supply!=='sold'));
  assert.deepEqual(groups[1].items,filtered.filter(p=>p.supply==='sold'));
  assert.deepEqual(groups.flatMap(g=>g.items).map(p=>p.id).sort(),['order-old','sold-high','sold-new','stock-old']);
  assert.deepEqual(Object.keys(groupByBatch(groups[0].items)),['2026-10-26']);
  if(sort==='newest')assert.deepEqual(Object.keys(groupByBatch(groups[1].items)),['2026-10-27','2026-10-26']);
 }
 assert.equal(products[0].id,'sold-new');
});

test('availability sections respect intersecting filters, saved items, empty results and explicit status choices',()=>{
 const filters={category:'nhan',color:'Xanh lục',texture:'Nếp băng',price:'500to1',size:'18.4',sort:'price-up'};
 const groups=groupByAvailability(filterProducts(products,filters));
 assert.deepEqual(groups.map(g=>g.items.map(p=>p.id)),[['order-old','stock-old'],['sold-high']]);
 for(const supply of ['stock','order','sold']){
  const groups=groupByAvailability(filterProducts(products,{supply}));
  assert.equal(groups.length,1);assert.equal(groups[0].key,supply==='sold'?'sold':'available');
  assert.ok(groups[0].items.every(p=>p.supply===supply));
 }
 assert.deepEqual(groupByAvailability(filterProducts(products,{...filters,color:'Tím'})),[]);
 assert.deepEqual(groupByAvailability(filterProducts(products,{savedOnly:true,saved:['stock-old','sold-new']})).map(g=>g.items.map(p=>p.id)),[['stock-old'],['sold-new']]);
 const changed=products.map(p=>p.id==='stock-old'?{...p,supply:'sold'}:p);
 assert.deepEqual(groupByAvailability(filterProducts(changed)).map(g=>g.items.map(p=>p.id)),[['order-old'],['sold-new','sold-high','stock-old']]);
});

test('public status filter contains four properly opened options including stock',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const select=html.match(/<select name="supply" id="supply">([\s\S]*?)<\/select>/)[1];
 const options=[...select.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)].map(([,value,label])=>({value,label}));
 assert.deepEqual(options,[{value:'',label:'Tình trạng'},{value:'stock',label:'Hàng có sẵn'},{value:'order',label:'Nhận đặt'},{value:'sold',label:'Đã hết hàng'}]);
 assert.doesNotMatch(select,/<\/option\s+[^>]/);
});
