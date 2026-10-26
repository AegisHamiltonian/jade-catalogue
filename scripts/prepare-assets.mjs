import sharp from 'sharp';
import { mkdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
const assets = path.resolve('dist/assets');
await mkdir('design/source-images', {recursive:true});
for (const name of ['jade-editorial','lavender-bangle','honey-ring','green-pendant']) {
  const source=path.join(assets,name+'.png');
  const metadata=await sharp(source).metadata();
  await copyFile(source,path.resolve('design/source-images',name+'.png'));
  await sharp(source).resize({width:1536,withoutEnlargement:true}).webp({quality:85}).toFile(path.join(assets,name+'.webp'));
  const output=await sharp(path.join(assets,name+'.webp')).metadata();
  if(!output.width||output.width>metadata.width||output.format!=='webp')throw new Error('Asset conversion failed');
  console.log(`${name}: ${metadata.width}x${metadata.height} -> ${output.width}x${output.height}, ${(await stat(path.join(assets,name+'.webp'))).size} bytes`);
}
const files={
  'lora-regular.ttf':'https://raw.githubusercontent.com/google/fonts/main/ofl/lora/Lora%5Bwght%5D.ttf',
  'lora-italic.ttf':'https://raw.githubusercontent.com/google/fonts/main/ofl/lora/Lora-Italic%5Bwght%5D.ttf',
  'be-vietnam.ttf':'https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf',
  'lora-OFL.txt':'https://raw.githubusercontent.com/google/fonts/main/ofl/lora/OFL.txt',
  'be-vietnam-OFL.txt':'https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/OFL.txt',
};
for(const [name,url] of Object.entries(files)) {const response=await fetch(url);if(!response.ok)throw new Error(`Font download ${name}: ${response.status}`);await writeFile(path.join(assets,name),Buffer.from(await response.arrayBuffer()));}
const cssPath=path.resolve('dist/styles.css');
let css=await readFile(cssPath,'utf8');
for(const name of ['lora-regular','lora-italic','be-vietnam'])css=css.replaceAll(`${name}.woff2`,`${name}.ttf`);
css=css.replaceAll("format('woff2')","format('truetype')");
await writeFile(cssPath,css);
