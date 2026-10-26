import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewProducts as products} from '../dist/preview-products.js';
import {filterProducts,groupByBatch,normalize,validateProduct,inquiryText,productURL,safeMedia,escapeHTML} from '../dist/catalogue.js';
test('Vietnamese search finds names without accents and dotted SKUs',()=>{
 assert.equal(normalize('NHẪN ĐẸP'),'nhan dep');
 assert.deepEqual(filterProducts(products,{q:'n246.1'}).map(p=>p.sku),['n246.1']);
 assert.equal(filterProducts(products,{q:'tu la lan'}).length,2);
});
test('category, availability, color, texture, price and size intersect',()=>{
 const result=filterProducts(products,{category:'vong',supply:'stock',color:'Xanh nhạt',texture:'Nếp băng',price:'over2',size:54});
 assert.deepEqual(result.map(p=>p.sku),['v052']);
 assert.equal(filterProducts(products,{size:54}).length,0);
 assert.equal(filterProducts(products,{category:'nhan',size:18.4}).length,1);
 assert.equal(filterProducts(products,{category:'mat_day',size:18.4}).length,0);
});
test('hidden products are never returned and saved filtering is browser-specific',()=>{
 assert.equal(filterProducts([...products,{...products[0],is_published:false}]).length,8);
 assert.deepEqual(filterProducts(products,{savedOnly:true,saved:[products[2].id]}).map(p=>p.sku),['n188']);
});
test('newest uses batches and stable ordering, price sort is global',()=>{
 assert.deepEqual(Object.keys(groupByBatch(filterProducts(products))),['2026-10-26','2026-10-19']);
 const sorted=filterProducts(products,{sort:'price-up'});assert.equal(sorted[0].sku,'n188');assert.equal(sorted.at(-1).sku,'k003');
 assert.equal(products[0].sku,'v052');
});
test('product links carry exact SKU, clear private filters and encode safely',()=>{
 const link=productURL('n246.1','https://example.com/?q=personal&size=18#bo-suu-tap');
 assert.equal(link,'https://example.com/?san-pham=n246.1');
 assert.match(inquiryText(products[5],link),/mẫu tương tự/);
 assert.match(inquiryText(products[3],link),/điều kiện đặt/);
 assert.match(inquiryText(products[2],link),/n188/);
});
test('untrusted product content cannot inject markup or executable media',()=>{
 assert.equal(safeMedia('javascript:alert(1)'), '');assert.equal(safeMedia('data:text/html,<script>'), '');
 assert.equal(safeMedia('http://insecure.example/a.jpg'),'');assert.equal(safeMedia('./assets/honey-ring.webp'),'./assets/honey-ring.webp');
 assert.equal(escapeHTML('<img onerror="evil()">'),'&lt;img onerror=&quot;evil()&quot;&gt;');
});
test('publication validation preserves pendant null sizing, integer money and evidence',()=>{
 const p={...products[3],thumbnail_url:'https://example.com/a.jpg'};assert.deepEqual(validateProduct(p),[]);
 assert.ok(validateProduct({...p,ni_tay:54}).length);
 assert.ok(validateProduct({...p,price_vnd:1.2}).length);
 assert.ok(validateProduct({...p,treatment:'a'}).length);
 assert.deepEqual(validateProduct({...p,treatment:'a',certificate_lab:'Lab',certificate_number:'G123',certificate_url:'https://example.com/cert.jpg'}),[]);
 assert.deepEqual(validateProduct({...p,treatment:'a',certificate_number:'G123'}),[]);
 assert.ok(validateProduct({...p,category:'nhan',ni_tay:null}).length);
});
