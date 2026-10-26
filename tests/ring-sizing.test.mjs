import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ringSizeRows,renderRingSizingGuide} from '../dist/ring-sizing.js';

test('ring guide uses diameter mm with checked circumference values, not the inconsistent source size scale', () => {
  assert.deepEqual(ringSizeRows.map(r=>[r.diameter,r.circumference]), [
    [14,44.0],[15,47.1],[16,50.3],[17,53.4],[18,56.5],[18.4,57.8],[19,59.7],[20,62.8],[21,66.0],
  ]);
  const html=renderRingSizingGuide();
  assert.match(html,/<th scope="row">18,4<\/th><td>57,8<\/td>/);
  assert.doesNotMatch(html,/59\s*[–-]\s*62|Size\/Ni/);
  assert.match(html,/không phải cỡ US/);
  assert.match(html,/không đo theo hình trên màn hình/);
  assert.equal((html.match(/class="ring-method-visual"/g)||[]).length,2);
});

test('ring guide is wired into the existing sizing dialog while all bangle reference responsibilities remain', async () => {
  const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
  const bangle=await readFile(new URL('../dist/sizing-images.js',import.meta.url),'utf8');
  assert.match(app,/import \{ renderRingSizingGuide \} from '\.\/ring-sizing\.js'/);
  assert.match(app,/\$\{renderRingSizingGuide\(\)\}/);
  assert.match(app,/\$\{renderSizingImages\(\)\}/);
  for(const name of ['size-hand-reference','size-round-bangle','size-flat-bangle','size-slender-bangle','size-oval-bangle','size-shape-reference']) assert.ok(bangle.includes(name));
  for(const file of ['size-ring-finger.webp','size-ring-diameter.webp']) assert.ok((await readFile(new URL('../dist/assets/'+file,import.meta.url))).length>0);
});
