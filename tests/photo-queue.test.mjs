import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PhotoQueue} from '../dist/photo-queue.js';
const file=name=>new File(['photo'],name,{type:'image/jpeg'});
function queue(options={}){let index=0;const released=[];return {released,q:new PhotoQueue({preview:()=>`blob:local-${++index}`,release:url=>released.push(url),upload:async f=>'https://example.com/'+f.name,...options})};}

test('first selected photo is immediately the cover preview; save waits for every selected photo',async()=>{
 let finish;const gate=new Promise(resolve=>finish=resolve);
 const {q}=queue({upload:async(f,namespace,{onProgress})=>{assert.equal(namespace,'images');onProgress(45);await gate;return 'https://example.com/'+f.name;}});
 const task=q.add([file('first.jpg'),file('second.jpg')]);
 assert.equal(q.items.length,2);assert.equal(q.items[0].name,'first.jpg');assert.ok(q.items[0].preview);assert.equal(q.busy,true);assert.throws(()=>q.urls,/chưa tải xong/);
 finish();await task;
 assert.deepEqual(q.urls,['https://example.com/first.jpg','https://example.com/second.jpg']);assert.equal(q.items[0].progress,100);
});

test('failed first cover remains selected and can retry without reselecting or dropping other files',async()=>{
 const attempts=new Map();const {q}=queue({upload:async f=>{const attempt=(attempts.get(f.name)||0)+1;attempts.set(f.name,attempt);if(f.name==='first.jpg'&&attempt===1)throw Error('Mạng gián đoạn');return 'https://example.com/'+f.name;}});
 await q.add([file('first.jpg'),file('second.jpg')]);
 assert.equal(q.items[0].status,'error');assert.equal(q.items[1].status,'ready');assert.throws(()=>q.urls,/chưa tải xong/);
 await q.retry(q.items[0].id);
 assert.deepEqual(q.urls,['https://example.com/first.jpg','https://example.com/second.jpg']);assert.equal(attempts.get('second.jpg'),1);
 q.cover(q.items[1].id);assert.equal(q.urls[0],'https://example.com/second.jpg');
 q.remove(q.items[0].id);assert.deepEqual(q.urls,['https://example.com/first.jpg']);
});

test('removing or resetting an active upload cannot attach late responses to the next product',async()=>{
 let finish;const gate=new Promise(resolve=>finish=resolve);const {q,released}=queue({upload:async()=>{await gate;return 'https://example.com/late.jpg';}});
 const task=q.add([file('first.jpg')]);await Promise.resolve();
 q.reset(['https://example.com/existing.jpg']);finish();await task;
 assert.deepEqual(q.urls,['https://example.com/existing.jpg']);assert.ok(released.includes('blob:local-1'));
});

test('stop retains selections for retry and releases local URLs only on explicit removal/reset',async()=>{
 let started;const inFlight=new Promise(resolve=>started=resolve);
 const {q,released}=queue({upload:(f,namespace,{signal})=>new Promise((resolve,reject)=>{started();signal.addEventListener('abort',()=>reject(new DOMException('Stopped','AbortError')),{once:true});})});
 const task=q.add([file('first.jpg'),file('second.jpg')]);await inFlight;q.pause();await task;
 assert.equal(q.items.length,2);assert.ok(q.items.every(i=>i.status==='error'));assert.equal(released.length,0);
 q.remove(q.items[0].id);assert.equal(released.length,1);q.reset();assert.equal(released.length,2);
});

test('existing galleries retain order, cover/reorder controls and the twelve-photo limit',async()=>{
 const {q}=queue();q.reset(['https://example.com/a.jpg','https://example.com/b.jpg']);q.cover(q.items[1].id);
 assert.deepEqual(q.urls,['https://example.com/b.jpg','https://example.com/a.jpg']);
 q.reset(Array.from({length:11},(_,i)=>`https://example.com/${i}.jpg`));
 assert.throws(()=>q.add([file('one.jpg'),file('two.jpg')]),/12 ảnh/);assert.equal(q.items.length,11);
});
